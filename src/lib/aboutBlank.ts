import { cloakConfig } from '@/config/cloak';

/**
 * Opens a URL in an about:blank page using iframe technique
 * @param url The URL to open in the about:blank page
 */
export function openInAboutBlank(url: string): void {
  // Create a unique window reference key based on the URL
  const windowKey = `_abWindow_${url.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  // Try to use existing window if it's already open
  if ((window as any)[windowKey] && !(window as any)[windowKey].closed) {
    (window as any)[windowKey].focus();
    return;
  }
  
  // Check if we're already in an about:blank page
  const isAboutBlank = window.location.href === 'about:blank' || 
                       window.location.href.startsWith('about:blank?') ||
                       window.location.href.startsWith('about:blank#');
  
  // If we're in an about:blank page, just navigate directly to the URL
  if (isAboutBlank) {
    window.location.href = url;
    return;
  }
  
  // Create a new blank window
  const win = window.open('', '_blank');
  
  // If window creation failed or was blocked
  if (!win) {
    alert('Please allow popups to use this feature');
    return;
  }
  
  // Mark that cloaking has been attempted for this session
  try {
    sessionStorage.setItem(cloakConfig.cloakingAttemptedKey, "true");
  } catch (e) {
    console.warn('Failed to set session storage', e);
  }
  
  // Set up the document
  win.document.title = 'Linker - School Community';
  win.document.body.style.margin = '0';
  win.document.body.style.height = '100%';
  
  // Add favicon
  const link = win.document.createElement('link');
  link.rel = 'icon';
  link.href = new URL('/favicon.ico', window.location.origin).href;
  win.document.head.appendChild(link);
  
  // Create and configure the iframe
  const iframe = win.document.createElement('iframe');
  iframe.style.border = 'none';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.margin = '0';
  iframe.src = url;
  
  // Add the iframe to the document
  win.document.body.appendChild(iframe);
  
  // Store the window reference
  (window as any)[windowKey] = win;
  
  // Add a confirmation dialog when trying to close the window
  const script = win.document.createElement('script');
  script.textContent = `
    window.onbeforeunload = function(event) {
      const confirmationMessage = 'Leave Site?';
      (event || window.event).returnValue = confirmationMessage;
      return confirmationMessage;
    };
  `;
  win.document.head.appendChild(script);

  // Add reload overlay functionality with session storage
  const reloadScript = win.document.createElement('script');
  reloadScript.textContent = `
    // Session storage management for about:blank
    function syncSessionStorage() {
      try {
        // Get all session storage from parent window
        const parentStorage = window.opener ? window.opener.sessionStorage : null;
        if (parentStorage) {
          // Copy all session storage items to current window
          for (let i = 0; i < parentStorage.length; i++) {
            const key = parentStorage.key(i);
            if (key) {
              sessionStorage.setItem(key, parentStorage.getItem(key));
            }
          }
        }
      } catch (e) {
        console.warn('Could not sync session storage:', e);
      }
    }
    
    // Sync session storage on load
    syncSessionStorage();
    
    // Create reload overlay
    function createReloadOverlay() {
      const overlay = document.createElement('div');
      overlay.id = 'reload-overlay';
      overlay.style.cssText = \`
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 999999;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;
        backdrop-filter: blur(4px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      \`;
      
      overlay.innerHTML = \`
        <div style="display: flex; align-items: center; gap: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
          Reload
        </div>
      \`;
      
      overlay.addEventListener('click', function() {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          // Sync session storage before reload
          syncSessionStorage();
          iframe.src = iframe.src;
        }
      });
      
      overlay.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(0, 0, 0, 0.9)';
        this.style.transform = 'scale(1.05)';
      });
      
      overlay.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(0, 0, 0, 0.8)';
        this.style.transform = 'scale(1)';
      });
      
      document.body.appendChild(overlay);
    }
    
    // Create overlay when iframe loads
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.addEventListener('load', function() {
        setTimeout(createReloadOverlay, 500);
      });
    } else {
      // If iframe is already loaded, create overlay immediately
      setTimeout(createReloadOverlay, 500);
    }
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      // Ctrl+R or Cmd+R
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        const iframe = document.querySelector('iframe');
        if (iframe) {
          // Sync session storage before reload
          syncSessionStorage();
          iframe.src = iframe.src;
        }
      }
      // F5
      if (e.key === 'F5') {
        e.preventDefault();
        const iframe = document.querySelector('iframe');
        if (iframe) {
          // Sync session storage before reload
          syncSessionStorage();
          iframe.src = iframe.src;
        }
      }
    });
    
    // Periodic session storage sync (every 5 seconds)
    setInterval(syncSessionStorage, 5000);
  `;
  win.document.head.appendChild(reloadScript);
}
