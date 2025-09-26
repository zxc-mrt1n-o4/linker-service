'use client'

import { useEffect } from 'react'
import { cloakConfig } from '@/config/cloak'

export default function AboutBlankCloak() {
  useEffect(() => {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }

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
    
    // Check if cloaking has already been attempted in this session
    const cloakingAttempted = sessionStorage.getItem(cloakConfig.cloakingAttemptedKey) === "true";

    // Store cloak preference in localStorage (default to enabled)
    if (!localStorage.getItem(cloakConfig.storageKey)) {
      localStorage.setItem(cloakConfig.storageKey, cloakConfig.enabledByDefault ? "true" : "false")
    }
    
    // Only run if not in an iframe, not in Firefox, not already in about:blank, 
    // not already attempted cloaking, and cloak is enabled
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

          // Redirect this original page to the configured redirect URL
          window.location.replace(cloakConfig.redirectUrl)
        }
      }, cloakConfig.delay)
    }
  }, [])

  return null
}
