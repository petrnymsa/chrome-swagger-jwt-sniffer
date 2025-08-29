async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
function set(id, text) { document.getElementById(id).textContent = text; }

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
    set("status","Nothing captured yet. Trigger a request on *.bakalari.cz (Swagger UI).");
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
  set("status","Done.");
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
loadLatest();
