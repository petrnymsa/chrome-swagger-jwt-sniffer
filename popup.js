async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function set(id, text) { document.getElementById(id).textContent = text; }

// Helper: convert URL pattern to regex for matching (same as worker.js)
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

// Check if current page URL matches configured patterns
async function checkPatternMatch(url) {
  if (!url) return false;
  
  try {
    const response = await chrome.runtime.sendMessage({ type: "GET_URL_PATTERNS" });
    const patterns = response?.data || [];
    
    console.log('Checking URL against patterns:', url, patterns);
    
    for (const pattern of patterns) {
      try {
        // Convert Chrome extension match pattern to regex (same logic as worker.js)
        const regexStr = patternToRegex(pattern);
        const regexPattern = new RegExp('^' + regexStr + '$', 'i');
        console.log('Testing pattern:', pattern, '→', regexPattern.source, '→', regexPattern.test(url));
        
        if (regexPattern.test(url)) {
          console.log('✅ URL matches pattern:', pattern);
          return true;
        }
      } catch (e) {
        console.warn('Invalid pattern:', pattern, e);
      }
    }
    
    console.log('❌ URL does not match any pattern');
    return false;
  } catch (e) {
    console.error('Error checking pattern match:', e);
    return false;
  }
}

// Update page status indicator
async function updatePageStatus() {
  const tab = await activeTab();
  if (!tab?.url) {
    set("pageStatus", "Unknown page");
    document.getElementById("pageUrl").textContent = "";
    updateStatusIndicator(false, "No active tab");
    return;
  }
  
  const url = tab.url;
  console.log('Checking pattern match for URL:', url);
  
  const isMatched = await checkPatternMatch(url);
  console.log('Pattern match result:', isMatched);
  
  // Display shortened URL
  let displayUrl = url;
  try {
    const urlObj = new URL(url);
    displayUrl = `${urlObj.hostname}${urlObj.pathname}`;
    if (displayUrl.length > 50) {
      displayUrl = displayUrl.substring(0, 47) + "...";
    }
  } catch (e) {
    if (url.length > 50) {
      displayUrl = url.substring(0, 47) + "...";
    }
  }
  
  document.getElementById("pageUrl").textContent = url;
  
  if (isMatched) {
    set("pageStatus", "✅ Extension active");
    updateStatusIndicator(true, "Active");
  } else {
    set("pageStatus", "⚠️ Not configured");
    updateStatusIndicator(false, "Inactive");
  }
}

// Update status indicator
function updateStatusIndicator(isActive, text) {
  const indicator = document.getElementById("statusIndicator");
  const icon = document.getElementById("statusIcon");
  const statusText = document.getElementById("statusText");
  
  if (isActive) {
    indicator.className = "status-indicator status-active";
    icon.textContent = "🟢";
    statusText.textContent = text;
  } else {
    indicator.className = "status-indicator status-inactive";
    icon.textContent = "🟡";
    statusText.textContent = text;
  }
}

function decodeJwtPayload(bearer) {
  if (!bearer) return null;
  
  console.log("Decoding bearer token:", bearer);
  
  // Extract token from Bearer header
  const m = bearer.match(/^Bearer\s+(.+)$/i);
  const token = m ? m[1] : bearer;
  
  console.log("Extracted token:", token);
  
  // Split JWT into parts
  const parts = token.split(".");
  console.log("JWT parts count:", parts.length);
  
  if (parts.length !== 3) {
    return { 
      error: "Invalid JWT format", 
      debug: `Expected 3 parts, got ${parts.length}`,
      token: token.substring(0, 50) + "..." 
    };
  }
  
  try {
    // Decode the payload (second part)
    const payload = parts[1];
    console.log("Raw payload part:", payload);
    
    // Fix base64url encoding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 ? '='.repeat(4 - (base64.length % 4)) : '';
    const paddedBase64 = base64 + pad;
    
    console.log("Base64 with padding:", paddedBase64);
    
    const json = atob(paddedBase64);
    console.log("Decoded JSON string:", json);
    
    const parsed = JSON.parse(json);
    console.log("Parsed JWT payload:", parsed);
    
    return parsed;
  } catch (e) {
    console.error("JWT decode error:", e);
    return { 
      error: "Cannot decode JWT", 
      details: e.message,
      token: token.substring(0, 50) + "..."
    };
  }
}

async function loadLatest() {
  set("status","Loading…");
  
  // Update page status first
  await updatePageStatus();
  
  const tab = await activeTab();
  if (!tab?.id) { set("status","No active tab."); return; }

  console.log("Active tab:", tab);

  const key = "auth_" + tab.id;
  const fromStore = await chrome.storage.session.get(key);
  let data = fromStore[key] || null;

  console.log("Data from session storage:", data);

  if (!data) {
    const res = await chrome.runtime.sendMessage({ type:"GET_LATEST_AUTH_FOR_TAB", tabId: tab.id }).catch(()=>null);
    console.log("Data from service worker:", res);
    if (res?.ok) data = res.data;
  }

  if (!data?.header) {
    set("auth","—");
    set("payload","—");
    
    const tab = await activeTab();
    const isMatched = await checkPatternMatch(tab?.url);
    
    if (isMatched) {
      set("status","Extension is active on this page. Perform login or authenticated requests to capture JWT tokens.");
    } else {
      set("status","This page is not configured for JWT capture. Add URL patterns in Options or visit a Swagger UI page.");
    }
    return;
  }

  console.log("Raw authorization header:", data.header);
  console.log("Request URL:", data.url);
  console.log("Token source:", data.source);

  const sourceText = data.source === "login_response" ? " (from login response)" : " (from request header)";
  set("auth", `${data.header}\n\n(from: ${data.url})${sourceText}`);
  const payload = decodeJwtPayload(data.header);
  console.log("Decoded payload result:", payload);
  
  set("payload", payload ? JSON.stringify(payload, null, 2) : "—");
  set("status","Token captured successfully!");
}

async function copyAll() {
  const txt = [
    "AUTH:",
    document.getElementById("auth").textContent.trim(),
    "",
    "PAYLOAD:",
    document.getElementById("payload").textContent.trim()
  ].join("\n");
  if (!txt.trim() || txt.includes("—")) { set("status","Nothing to copy."); return; }
  await navigator.clipboard.writeText(txt);
  set("status","Copied.");
}

async function loadTokenHistory() {
  const tab = await activeTab();
  if (!tab?.id) return;
  
  const res = await chrome.runtime.sendMessage({ type:"GET_TOKEN_HISTORY_FOR_TAB", tabId: tab.id }).catch(()=>null);
  const history = res?.data || [];
  
  const select = document.getElementById("tokenSelect");
  select.innerHTML = '<option value="">Latest token (auto)</option>';
  
  history.forEach((token, index) => {
    const date = new Date(token.when).toLocaleTimeString();
    const sourceLabel = token.source === "login_response" ? "LOGIN" : "REQUEST";
    const shortToken = token.header.substring(0, 50) + "...";
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${date} - ${sourceLabel} - ${shortToken}`;
    select.appendChild(option);
  });
  
  return history;
}

async function showHistory() {
  const historyDiv = document.getElementById("tokenHistory");
  const button = document.getElementById("showHistory");
  
  if (historyDiv.style.display === "none") {
    await loadTokenHistory();
    historyDiv.style.display = "block";
    button.textContent = "Hide History";
  } else {
    historyDiv.style.display = "none";
    button.textContent = "History";
  }
}

async function onTokenSelect() {
  const select = document.getElementById("tokenSelect");
  const selectedIndex = select.value;
  
  if (selectedIndex === "") {
    // Load latest token
    await loadLatest();
    return;
  }
  
  const tab = await activeTab();
  if (!tab?.id) return;
  
  const res = await chrome.runtime.sendMessage({ type:"GET_TOKEN_HISTORY_FOR_TAB", tabId: tab.id }).catch(()=>null);
  const history = res?.data || [];
  const selectedToken = history[parseInt(selectedIndex)];
  
  if (selectedToken) {
    console.log("Selected token from history:", selectedToken);
    
    const sourceText = selectedToken.source === "login_response" ? " (from login response)" : " (from request header)";
    set("auth", `${selectedToken.header}\n\n(from: ${selectedToken.url})${sourceText}`);
    
    const payload = decodeJwtPayload(selectedToken.header);
    set("payload", payload ? JSON.stringify(payload, null, 2) : "—");
    set("status", "Loaded from history.");
  }
}

document.getElementById('refresh').addEventListener('click', loadLatest);
document.getElementById('copy').addEventListener('click', copyAll);
document.getElementById('showHistory').addEventListener('click', showHistory);
document.getElementById('tokenSelect').addEventListener('change', onTokenSelect);
document.getElementById('openOptions').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

loadLatest();
