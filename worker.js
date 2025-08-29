// Service worker: capture Authorization headers when
// (A) the active tab's URL matches configured URL patterns, OR
// (B) the request is from a tab whose hostname matches configured domains.
//
// Notes:
// - We keep a lightweight cache of tabId -> last known URL to avoid
//   async calls inside the webRequest listener.
// - Supports configurable URL patterns for flexible Swagger UI detection

const latestByTab = new Map();   // tabId -> { when, header, url }
const tokenHistoryByTab = new Map(); // tabId -> array of tokens
const tabUrlCache = new Map();   // tabId -> url

// Default URL patterns for Swagger UI detection
const DEFAULT_URL_PATTERNS = [
  "*://*/swagger/*",
  "*://*/swagger-ui/*", 
  "*://*/api-docs/*",
  "*://*/docs/*"
];

// Default login URL patterns
const DEFAULT_LOGIN_PATTERNS = [
  "/api/login",
  "/api/auth/login",
  "/auth/login",
  "/login"
];

// Initialize default patterns on extension install/enable
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed/updated");
  
  // Initialize default URL patterns if not set
  try {
    const result = await chrome.storage.sync.get(['urlPatterns', 'loginPatterns']);
    if (!result.urlPatterns) {
      await chrome.storage.sync.set({ urlPatterns: DEFAULT_URL_PATTERNS });
      console.log('✅ Default URL patterns initialized:', DEFAULT_URL_PATTERNS);
    }
    if (!result.loginPatterns) {
      await chrome.storage.sync.set({ loginPatterns: DEFAULT_LOGIN_PATTERNS });
      console.log('✅ Default login patterns initialized:', DEFAULT_LOGIN_PATTERNS);
    }
  } catch (e) {
    console.error('❌ Failed to initialize default patterns:', e);
  }
});

// Helper: get configured URL patterns from storage
async function getConfiguredPatterns() {
  try {
    const result = await chrome.storage.sync.get(['urlPatterns']);
    return result.urlPatterns || DEFAULT_URL_PATTERNS;
  } catch {
    return DEFAULT_URL_PATTERNS;
  }
}

// Helper: get configured login patterns from storage
async function getConfiguredLoginPatterns() {
  try {
    const result = await chrome.storage.sync.get(['loginPatterns']);
    return result.loginPatterns || DEFAULT_LOGIN_PATTERNS;
  } catch {
    return DEFAULT_LOGIN_PATTERNS;
  }
}

// Helper: check if URL matches any configured login pattern
async function matchesLoginPattern(urlStr) {
  if (!urlStr) return false;
  
  const loginPatterns = await getConfiguredLoginPatterns();
  
  try {
    const url = new URL(urlStr);
    const pathname = url.pathname;
    
    for (const pattern of loginPatterns) {
      if (pathname.includes(pattern)) {
        console.log('✅ Login URL matched pattern:', pattern, 'for URL:', urlStr);
        return true;
      }
    }
  } catch (e) {
    console.warn('Invalid URL for login check:', urlStr, e);
  }
  
  return false;
}

// Helper: convert URL pattern to regex for matching
function patternToRegex(pattern) {
  // Convert Chrome extension match pattern to regex
  // https://developer.chrome.com/docs/extensions/mv3/match_patterns/
  
  // Escape special regex chars except * and ?
  let regex = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '___STAR___')
    .replace(/\?/g, '___QUESTION___');
  
  // Handle special Chrome pattern rules:
  // * matches any string of characters (including empty string)
  // Scheme: http, https, *, file, ftp
  regex = regex
    .replace(/___STAR___/g, '.*')
    .replace(/___QUESTION___/g, '.');
  
  return regex;
}

// Helper: return true if URL matches any configured pattern
async function matchesConfiguredPatterns(urlStr) {
  if (!urlStr) return false;
  
  const patterns = await getConfiguredPatterns();
  console.log('🔍 Checking URL:', urlStr);
  console.log('🔍 Against patterns:', patterns);
  
  for (const pattern of patterns) {
    try {
      const regexStr = patternToRegex(pattern);
      const regex = new RegExp('^' + regexStr + '$', 'i');
      console.log(`🔍 Pattern "${pattern}" → Regex: /${regex.source}/i`);
      
      if (regex.test(urlStr)) {
        console.log('✅ MATCH found for pattern:', pattern);
        return true;
      } else {
        console.log('❌ No match for pattern:', pattern);
      }
    } catch (e) {
      console.warn('Invalid URL pattern:', pattern, e);
    }
  }
  
  console.log('❌ No patterns matched URL:', urlStr);
  return false;
}

// Fallback helper: return true if URL looks like a Swagger UI page (legacy)
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

// Keep cache of tab URLs and inject content script on matching pages
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    tabUrlCache.set(tabId, changeInfo.url);
    
    // Check if URL matches configured patterns and inject content script
    if (await matchesConfiguredPatterns(changeInfo.url)) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
        console.log('✅ Content script injected on', changeInfo.url);
      } catch (e) {
        console.log('⚠️ Failed to inject content script:', e.message);
      }
    }
  } else if (tab?.url) {
    tabUrlCache.set(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab?.url) {
      tabUrlCache.set(tabId, tab.url);
      
      // Check if URL matches configured patterns and inject content script
      if (await matchesConfiguredPatterns(tab.url)) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
          });
          console.log('✅ Content script injected on tab activation', tab.url);
        } catch (e) {
          console.log('⚠️ Failed to inject content script on activation:', e.message);
        }
      }
    }
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
  async (details) => {
    const { tabId, requestHeaders, url } = details;
    if (tabId < 0 || !requestHeaders || !url) return;

    const tabUrl = tabUrlCache.get(tabId) || "";
    let allow = false;

    // Check if tab URL matches configured patterns
    if (await matchesConfiguredPatterns(tabUrl)) {
      allow = true;
    } else {
      // Fallback: check if it's a Swagger URL or Bakalari subdomain
      if (isSwaggerUrl(tabUrl)) {
        allow = true;
      } else {
        try {
          const u = new URL(tabUrl || url);
          if (isXBakalariHost(u.hostname)) {
            allow = true;
          }
        } catch {}
      }
    }

    if (!allow) return;

    // Skip authentication requests - we want to parse their responses, not their Basic/OAuth auth headers
    if (await matchesLoginPattern(url)) {
      return;
    }

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
    (async () => {
      const tabId = sender.tab?.id;
      if (tabId && tabId >= 0) {
        // Získat login patterns pro inject
        const loginPatterns = await getConfiguredLoginPatterns();
        
        // Injektovat script pomocí chrome.scripting API
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          world: 'MAIN',
          args: [loginPatterns],
          func: (patterns) => {
            // MAIN WORLD FETCH INTERCEPTOR
            const originalFetch = window.fetch;
            
            window.fetch = async function(...args) {
              const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
              const method = args[1]?.method || (args[0]?.method) || 'GET';
              
              const response = await originalFetch.apply(this, args);
              
              // Kontrola login requestu s configurable patterns
              if (url && method.toUpperCase() === 'POST') {
                let isLoginUrl = false;
                for (const pattern of patterns) {
                  if (url.includes(pattern)) {
                    isLoginUrl = true;
                    break;
                  }
                }
                
                if (isLoginUrl && response.ok && response.status === 200) {
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
                  } catch (err) {
                    console.warn("❌ Failed to parse login response:", err);
                  }
                }
              }
              
              return response;
            };
          }
        }).then(() => {
          console.log("✅ Main world script injected successfully");
          try {
            sendResponse({ ok: true });
          } catch (e) {
            // Response channel closed
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
    })();
    
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
  
  // Handle URL patterns management
  if (msg?.type === "GET_URL_PATTERNS") {
    (async () => {
      try {
        const patterns = await getConfiguredPatterns();
        sendResponse({ ok: true, data: patterns });
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
    })();
    return true;
  }
  
  if (msg?.type === "ADD_URL_PATTERN") {
    (async () => {
      try {
        const currentPatterns = await getConfiguredPatterns();
        const newPattern = msg.pattern;
        
        if (newPattern && !currentPatterns.includes(newPattern)) {
          const updatedPatterns = [...currentPatterns, newPattern];
          await chrome.storage.sync.set({ urlPatterns: updatedPatterns });
          sendResponse({ ok: true, data: updatedPatterns });
        } else {
          sendResponse({ ok: false, error: "Pattern already exists or is invalid" });
        }
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
    })();
    return true;
  }
  
  if (msg?.type === "REMOVE_URL_PATTERN") {
    (async () => {
      try {
        const currentPatterns = await getConfiguredPatterns();
        const patternToRemove = msg.pattern;
        
        const updatedPatterns = currentPatterns.filter(p => p !== patternToRemove);
        await chrome.storage.sync.set({ urlPatterns: updatedPatterns });
        sendResponse({ ok: true, data: updatedPatterns });
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
    })();
    return true;
  }
  
  if (msg?.type === "RESET_URL_PATTERNS") {
    (async () => {
      try {
        await chrome.storage.sync.set({ urlPatterns: DEFAULT_URL_PATTERNS });
        sendResponse({ ok: true, data: DEFAULT_URL_PATTERNS });
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
    })();
    return true;
  }
  
  // Handle login patterns management
  if (msg?.type === "GET_LOGIN_PATTERNS") {
    (async () => {
      try {
        const patterns = await getConfiguredLoginPatterns();
        sendResponse({ ok: true, data: patterns });
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
    })();
    return true;
  }
  
  if (msg?.type === "ADD_LOGIN_PATTERN") {
    (async () => {
      try {
        const currentPatterns = await getConfiguredLoginPatterns();
        const newPattern = msg.pattern;
        
        if (newPattern && !currentPatterns.includes(newPattern)) {
          const updatedPatterns = [...currentPatterns, newPattern];
          await chrome.storage.sync.set({ loginPatterns: updatedPatterns });
          sendResponse({ ok: true, data: updatedPatterns });
        } else {
          sendResponse({ ok: false, error: "Pattern already exists or is invalid" });
        }
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
    })();
    return true;
  }
  
  if (msg?.type === "REMOVE_LOGIN_PATTERN") {
    (async () => {
      try {
        const currentPatterns = await getConfiguredLoginPatterns();
        const patternToRemove = msg.pattern;
        
        const updatedPatterns = currentPatterns.filter(p => p !== patternToRemove);
        await chrome.storage.sync.set({ loginPatterns: updatedPatterns });
        sendResponse({ ok: true, data: updatedPatterns });
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
    })();
    return true;
  }
  
  if (msg?.type === "RESET_LOGIN_PATTERNS") {
    (async () => {
      try {
        await chrome.storage.sync.set({ loginPatterns: DEFAULT_LOGIN_PATTERNS });
        sendResponse({ ok: true, data: DEFAULT_LOGIN_PATTERNS });
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
    })();
    return true;
  }
  
  // Handle origins management (for API monitoring) - DEPRECATED: Use URL patterns instead
  /* Origins management removed - URL patterns provide better flexibility
  if (msg?.type === "GET_ORIGINS") {
    (async () => {
      try {
        const result = await chrome.storage.sync.get(['origins']);
        const origins = result.origins || [];
        sendResponse({ ok: true, data: origins });
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
    })();
    return true;
  }
  */
});
