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
}
