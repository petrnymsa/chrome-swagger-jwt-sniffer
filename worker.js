// Service worker: capture Authorization headers only when
// (A) the active tab's URL looks like a Swagger UI page, OR
// (B) the request is from a tab whose hostname matches X.*.bakalari.cz.
//
// Notes:
// - We keep a lightweight cache of tabId -> last known URL to avoid
//   async calls inside the webRequest listener.
// - "X.*.bakalari.cz" means hostname like: <single-letter>.<something>.bakalari.cz

const latestByTab = new Map();   // tabId -> { when, header, url }
const tokenHistoryByTab = new Map(); // tabId -> array of tokens
const tabUrlCache = new Map();   // tabId -> url

// Helper: return true if URL of the tab looks like a Swagger UI page
function isSwaggerUrl(urlStr) {
  if (!urlStr) return false;
  try {
    const u = new URL(urlStr);
    const path = (u.pathname || "").toLowerCase();
    const full = (u.href || "").toLowerCase();
    // common swagger patterns
    return (
      path.includes("swagger") ||
      path.includes("swagger-ui") ||
      path.includes("api-docs") ||
      full.includes("swagger")
    );
  } catch {
    return false;
  }
}

// Helper: return true if hostname matches X.*.bakalari.cz
function isXBakalariHost(hostname) {
  if (!hostname) return false;
  return /^[a-z]\..+\.bakalari\.cz$/i.test(hostname);
}

// Keep cache of tab URLs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    tabUrlCache.set(tabId, changeInfo.url);
  } else if (tab?.url) {
    tabUrlCache.set(tabId, tab.url);
  }
});
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab?.url) tabUrlCache.set(tabId, tab.url);
  } catch {}
});
chrome.tabs.onRemoved.addListener((tabId) => {
  tabUrlCache.delete(tabId);
  latestByTab.delete(tabId);
  tokenHistoryByTab.delete(tabId);
});

// Helper function to add token to history
function addTokenToHistory(tabId, tokenData) {
  if (!tokenHistoryByTab.has(tabId)) {
    tokenHistoryByTab.set(tabId, []);
  }
  
  const history = tokenHistoryByTab.get(tabId);
  
  // Don't add duplicate tokens
  const isDuplicate = history.some(existing => 
    existing.header === tokenData.header && 
    existing.source === tokenData.source
  );
  
  if (!isDuplicate) {
    history.unshift(tokenData); // Add to beginning
    // Keep only last 5 tokens
    if (history.length > 5) {
      history.splice(5);
    }
    tokenHistoryByTab.set(tabId, history);
  }
}

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const { tabId, requestHeaders, url } = details;
    if (tabId < 0 || !requestHeaders || !url) return;

    const tabUrl = tabUrlCache.get(tabId) || "";
    let allow = false;

    // (A) Swagger page detection
    if (isSwaggerUrl(tabUrl)) {
      allow = true;
    } else {
      // (B) X.*.bakalari.cz subdomains
      try {
        const u = new URL(tabUrl || url);
        if (isXBakalariHost(u.hostname)) {
          allow = true;
        }
      } catch {}
    }

    if (!allow) return;

    // Skip authentication requests - we want to parse their responses, not their Basic/OAuth auth headers
    try {
      const u = new URL(url);
      if (u.pathname.includes('/api/login') || 
          u.pathname.includes('/login') || 
          u.pathname.includes('/auth') || 
          u.pathname.includes('/oauth')) {
        return;
      }
    } catch {}

    const auth = requestHeaders.find(h => h.name.toLowerCase() === "authorization");
    if (auth?.value) {
      const currentData = latestByTab.get(tabId);
      const newPayload = { when: Date.now(), header: auth.value, url, source: "request_header" };
      
      // Add to history
      addTokenToHistory(tabId, newPayload);
      
      // Update latest only if no login token exists or this is significantly newer
      if (!currentData || 
          currentData.source !== "login_response" || 
          Date.now() - currentData.when > 30000) { // 30 seconds grace period for login tokens
        latestByTab.set(tabId, newPayload);
        chrome.storage.session.set({ ["auth_" + tabId]: newPayload }).catch(()=>{});
      }
    }
  },
  // Limit to Bakalari subdomains only (extra safety)
  { urls: ["*://*.bakalari.cz/*"] },
  ["requestHeaders"]
);

// Respond to popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "GET_LATEST_AUTH_FOR_TAB") {
    const data = latestByTab.get(msg.tabId) || null;
    sendResponse({ ok: true, data });
    return true;
  }
  
  if (msg?.type === "GET_TOKEN_HISTORY_FOR_TAB") {
    const history = tokenHistoryByTab.get(msg.tabId) || [];
    sendResponse({ ok: true, data: history });
    return true;
  }
  
  if (msg?.type === "INJECT_MAIN_WORLD_SCRIPT") {
    const tabId = sender.tab?.id;
    if (tabId && tabId >= 0) {
      // Injektovat script pomocí chrome.scripting API
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        world: 'MAIN',
        func: () => {
          // MAIN WORLD FETCH INTERCEPTOR
          const originalFetch = window.fetch;
          
          window.fetch = async function(...args) {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            const method = args[1]?.method || (args[0]?.method) || 'GET';
            
            const response = await originalFetch.apply(this, args);
            
            // Kontrola login requestu
            if (url && method.toUpperCase() === 'POST' && url.includes('/api/login')) {
              if (response.ok && response.status === 200) {
                try {
                  const clonedResponse = response.clone();
                  const data = await clonedResponse.json();
                  
                  if (data.access_token) {
                    console.log("✅ JWT token captured from login");
                    
                    // Poslat token přes custom event
                    window.dispatchEvent(new CustomEvent('jwt-token-captured', {
                      detail: {
                        token: data.access_token,
                        url: url,
                        fullResponse: data
                      }
                    }));
                  }
                } catch (e) {
                  console.error("❌ Error parsing login response:", e);
                }
              }
            }
            
            return response;
          };
        }
      }).then(() => {
        try {
          sendResponse({ ok: true, injected: true });
        } catch (e) {
          // Response channel closed, but injection was successful
        }
      }).catch((e) => {
        console.error("❌ Error injecting script:", e);
        try {
          sendResponse({ ok: false, error: e.toString() });
        } catch (responseError) {
          // Response channel closed
        }
      });
    } else {
      console.error("❌ No valid tab ID for injection");
      try {
        sendResponse({ ok: false, error: "No valid tab ID" });
      } catch (e) {
        // Response channel closed
      }
    }
    
    return true; // Asynchronní response
  }
  
  if (msg?.type === "LOGIN_TOKEN_CAPTURED") {
    // Get the tab ID from the sender
    const tabId = sender.tab?.id;
    if (tabId && tabId >= 0) {
      // Create Bearer token from access_token
      const bearerToken = `Bearer ${msg.token}`;
      const payload = { 
        when: Date.now(), 
        header: bearerToken, 
        url: msg.url,
        source: "login_response",
        fullResponse: msg.fullResponse
      };
      
      // Add to history
      addTokenToHistory(tabId, payload);
      
      // Always prioritize login tokens
      latestByTab.set(tabId, payload);
      chrome.storage.session.set({ ["auth_" + tabId]: payload }).catch(()=>{});
      
      console.log("✅ Login token stored for tab", tabId);
    } else {
      console.error("❌ No valid tab ID found in sender");
    }
    
    sendResponse({ ok: true });
    return true;
  }
});
