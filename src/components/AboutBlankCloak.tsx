'use client'

import { useEffect } from 'react'
import { cloakConfig } from '@/config/cloak'

export default function AboutBlankCloak() {
  useEffect(() => {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }

    const performCloaking = () => {
      // Check if cloaking has already been attempted in this session
      const cloakingAttempted = sessionStorage.getItem(cloakConfig.cloakingAttemptedKey) === "true";
      
      // Check if we're in an iframe
      let inFrame
      try {
        inFrame = window !== top
      } catch (e) {
        inFrame = true
      }

      // Check if we're already in an about:blank page
      const isAboutBlank = window.location.href === 'about:blank' || 
                           window.location.href.startsWith('about:blank?') ||
                           window.location.href.startsWith('about:blank#');
      
      // Store cloak preference in localStorage (default to enabled)
      if (!localStorage.getItem(cloakConfig.storageKey)) {
        localStorage.setItem(cloakConfig.storageKey, cloakConfig.enabledByDefault ? "true" : "false")
      }
      
      // Only run if not in an iframe, not in Firefox, not already in about:blank, not already attempted, and cloak is enabled
      if (
        !inFrame &&
        !isAboutBlank &&
        !cloakingAttempted &&
        !navigator.userAgent.includes("Firefox") &&
        localStorage.getItem(cloakConfig.storageKey) === "true"
      ) {
        // Mark that cloaking has been attempted for this session
        sessionStorage.setItem(cloakConfig.cloakingAttemptedKey, "true");
        // Open about:blank popup
        const popup = window.open("about:blank", "_blank")
        
        setTimeout(() => {
          if (!popup || popup.closed) {
            console.log("Popup blocked or closed")
          } else {
            const doc = popup.document
            const iframe = doc.createElement("iframe")
            const style = iframe.style
            const link = doc.createElement("link")

            // Set title and favicon (using absolute URL for favicon)
            doc.title = cloakConfig.title
            link.rel = "icon"
            link.href = new URL(cloakConfig.favicon, window.location.origin).href

            // Set iframe to current URL
            iframe.src = window.location.href
            style.position = "fixed"
            style.top = style.bottom = style.left = style.right = "0"
            style.border = style.outline = "none"
            style.width = style.height = "100%"

            doc.head.appendChild(link)
            doc.body.appendChild(iframe)

            // Add confirmation when trying to close the tab
            const script = doc.createElement("script")
            script.textContent = `
              window.onbeforeunload = function (event) {
                const confirmationMessage = 'Leave Site?';
                (event || window.event).returnValue = confirmationMessage;
                return confirmationMessage;
              };
            `
            doc.head.appendChild(script)

            // Add reload overlay functionality with session storage
            const reloadScript = doc.createElement("script")
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
            `
            doc.head.appendChild(reloadScript)

            // Redirect this original page to the configured redirect URL
            window.location.replace(cloakConfig.redirectUrl)
          }
        }, cloakConfig.delay)
      }
    }

    // Run cloaking on initial load
    performCloaking()

    // Also run on page visibility change (handles reloads and navigation)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        performCloaking()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null
}
