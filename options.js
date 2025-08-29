// Options page JavaScript
const patternsListEl = document.getElementById('patternsList');
const urlPatternInput = document.getElementById('urlPattern');
const loginPatternsListEl = document.getElementById('loginPatternsList');
const loginPatternInput = document.getElementById('loginPattern');

async function refreshPatterns() {
  try {
    console.log('Refreshing URL patterns...');
    const response = await chrome.runtime.sendMessage({ type: "GET_URL_PATTERNS" });
    console.log('Got response:', response);
    
    const patterns = response?.data || [];
    console.log('Patterns:', patterns);
    
    patternsListEl.innerHTML = '';
    
    if (patterns.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No patterns configured. Click "Reset to Defaults" to load default patterns.';
      li.style.fontStyle = 'italic';
      li.style.color = '#666';
      patternsListEl.appendChild(li);
    } else {
      patterns.forEach(pattern => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = pattern;
        span.style.fontFamily = 'Monaco, Consolas, monospace';
        span.style.fontSize = '13px';
        
        const rm = document.createElement('button');
        rm.textContent = 'Remove';
        rm.className = 'danger';
        rm.onclick = async () => {
          try {
            console.log('Removing pattern:', pattern);
            const response = await chrome.runtime.sendMessage({ type: "REMOVE_URL_PATTERN", pattern });
            console.log('Remove response:', response);
            refreshPatterns();
          } catch (e) {
            console.error('Error removing pattern:', e);
            alert('Error removing pattern: ' + e.message);
          }
        };
        
        li.appendChild(span);
        li.appendChild(rm);
        patternsListEl.appendChild(li);
      });
    }
    
  } catch (e) {
    console.error('Error refreshing patterns:', e);
    alert('Error loading patterns: ' + e.message);
  }
}

async function refreshLoginPatterns() {
  try {
    console.log('Refreshing login patterns...');
    const response = await chrome.runtime.sendMessage({ type: "GET_LOGIN_PATTERNS" });
    console.log('Got login patterns response:', response);
    
    const patterns = response?.data || [];
    console.log('Login patterns:', patterns);
    
    loginPatternsListEl.innerHTML = '';
    
    if (patterns.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No login patterns configured. Click "Reset to Defaults" to load default patterns.';
      li.style.fontStyle = 'italic';
      li.style.color = '#666';
      loginPatternsListEl.appendChild(li);
    } else {
      patterns.forEach(pattern => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = pattern;
        span.style.fontFamily = 'Monaco, Consolas, monospace';
        span.style.fontSize = '13px';
        
        const rm = document.createElement('button');
        rm.textContent = 'Remove';
        rm.className = 'danger';
        rm.onclick = async () => {
          try {
            console.log('Removing login pattern:', pattern);
            const response = await chrome.runtime.sendMessage({ type: "REMOVE_LOGIN_PATTERN", pattern });
            console.log('Remove login pattern response:', response);
            refreshLoginPatterns();
          } catch (e) {
            console.error('Error removing login pattern:', e);
            alert('Error removing login pattern: ' + e.message);
          }
        };
        
        li.appendChild(span);
        li.appendChild(rm);
        loginPatternsListEl.appendChild(li);
      });
    }
    
  } catch (e) {
    console.error('Error refreshing login patterns:', e);
    alert('Error loading login patterns: ' + e.message);
  }
}

// Event listeners
document.getElementById('addPattern').addEventListener('click', async () => {
  const pattern = urlPatternInput.value.trim();
  console.log('Adding pattern:', pattern);
  
  if (!pattern) {
    alert('Please enter a pattern');
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({ type: "ADD_URL_PATTERN", pattern });
    console.log('Add pattern response:', response);
    
    if (response?.ok) {
      urlPatternInput.value = '';
      refreshPatterns();
      alert('Pattern added successfully!');
    } else {
      alert('Error: ' + (response?.error || 'Failed to add pattern'));
    }
  } catch (e) {
    console.error('Error adding pattern:', e);
    alert('Error adding pattern: ' + e.message);
  }
});

document.getElementById('resetPatterns').addEventListener('click', async () => {
  if (confirm('Reset URL patterns to defaults? This cannot be undone.')) {
    try {
      await chrome.runtime.sendMessage({ type: "RESET_URL_PATTERNS" });
      refreshPatterns();
    } catch (e) {
      alert('Error resetting patterns: ' + e.message);
    }
  }
});

document.getElementById('addLoginPattern').addEventListener('click', async () => {
  const pattern = loginPatternInput.value.trim();
  console.log('Adding login pattern:', pattern);
  
  if (!pattern) {
    alert('Please enter a login pattern');
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({ type: "ADD_LOGIN_PATTERN", pattern });
    console.log('Add login pattern response:', response);
    
    if (response?.ok) {
      loginPatternInput.value = '';
      refreshLoginPatterns();
      alert('Login pattern added successfully!');
    } else {
      alert('Error: ' + (response?.error || 'Failed to add login pattern'));
    }
  } catch (e) {
    console.error('Error adding login pattern:', e);
    alert('Error adding login pattern: ' + e.message);
  }
});

document.getElementById('resetLoginPatterns').addEventListener('click', async () => {
  if (confirm('Reset login patterns to defaults? This cannot be undone.')) {
    try {
      await chrome.runtime.sendMessage({ type: "RESET_LOGIN_PATTERNS" });
      refreshLoginPatterns();
    } catch (e) {
      alert('Error resetting login patterns: ' + e.message);
    }
  }
});

document.getElementById('clear-all').addEventListener('click', async () => {
  if (confirm('Clear all captured tokens? This cannot be undone.')) {
    try {
      await chrome.storage.session.clear();
      await chrome.storage.sync.clear();
      alert('All data cleared successfully');
    } catch (e) {
      alert('Error clearing data: ' + e.message);
    }
  }
});

// Enter key support
urlPatternInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('addPattern').click();
});

loginPatternInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('addLoginPattern').click();
});

// Initialize
refreshPatterns();
refreshLoginPatterns();
