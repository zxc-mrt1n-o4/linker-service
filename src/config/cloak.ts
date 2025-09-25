/**
 * Configuration for the about:blank cloaking feature
 */
export const cloakConfig = {
  // Default title for the cloaked page
  title: "Linker - School Community",
  
  // Default favicon for the cloaked page (relative to public directory)
  favicon: "/favicon.ico",
  
  // Redirect URL for the original page
  redirectUrl: "https://www.wikipedia.org",
  
  // Delay before redirecting (in milliseconds)
  delay: 500,
  
  // Whether cloaking is enabled by default
  enabledByDefault: true,
  
  // Local storage key for cloaking preference
  storageKey: "ab",
  
  // Session storage key to prevent multiple cloaking attempts
  cloakingAttemptedKey: "cloaking_attempted"
}
