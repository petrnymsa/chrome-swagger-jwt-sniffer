// JWT Token Interceptor for Swagger UI
console.log("🎯 JWT Token Interceptor loaded");

// POUŽÍT CHROME.SCRIPTING API PRO INJEKCI DO MAIN WORLD
(async function() {
  try {
    // Poslat požadavek service workeru, aby injektoval script
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
    
    const messagePromise = chrome.runtime.sendMessage({
      type: "INJECT_MAIN_WORLD_SCRIPT"
    });
    
    const response = await Promise.race([messagePromise, timeoutPromise]);
  } catch (e) {
    // FALLBACK: Pokusit se o direct injection pomocí DOM events
    console.log("🔄 Using fallback injection method");
    
    const injectorDiv = document.createElement('div');
    injectorDiv.style.display = 'none';
    injectorDiv.setAttribute('data-jwt-interceptor', 'true');
    
    const observer = new MutationObserver(() => {
      if (document.contains(injectorDiv)) {
        // Přepsat fetch přímo na window objektu
        const originalFetch = window.fetch;
        if (originalFetch) {
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
        
        observer.disconnect();
      }
    });
    
    observer.observe(document, { childList: true, subtree: true });
    document.body.appendChild(injectorDiv);
  }
})();

// CONTENT SCRIPT LISTENER PRO CUSTOM EVENTS
window.addEventListener('jwt-token-captured', (event) => {
  const { token, url, fullResponse } = event.detail;
  
  // Poslat token do service worker
  chrome.runtime.sendMessage({
    type: "LOGIN_TOKEN_CAPTURED",
    token: token,
    url: url,
    fullResponse: fullResponse
  }).then((response) => {
    console.log("✅ Token successfully sent to extension");
  }).catch((e) => {
    console.error("❌ Error sending token to service worker:", e);
  });
});

console.log("🚀 JWT Token Interceptor ready");
