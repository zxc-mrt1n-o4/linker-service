// Input validation and sanitization utilities

// Sanitize string input to prevent XSS
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  // Basic sanitization - remove script tags and other potentially harmful content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

// Validate username
export function validateUsername(username: string): { valid: boolean; message?: string } {
  if (!username) {
    return { valid: false, message: 'Username is required' };
  }
  
  // Sanitize
  const sanitized = sanitizeString(username);
  
  // Check if sanitization removed content
  if (sanitized !== username) {
    return { valid: false, message: 'Username contains invalid characters' };
  }
  
  // Check length
  if (sanitized.length < 3 || sanitized.length > 30) {
    return { valid: false, message: 'Username must be between 3 and 30 characters' };
  }
  
  // Check format - alphanumeric and some special characters
  const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
  if (!usernameRegex.test(sanitized)) {
    return { valid: false, message: 'Username can only contain letters, numbers, underscores, dots, and hyphens' };
  }
  
  return { valid: true };
}

// Validate password strength
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  
  // Check length
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  // Check complexity - at least one uppercase, one lowercase, one number
  // Uncomment for stricter validation
  /*
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return { 
      valid: false, 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    };
  }
  */
  
  return { valid: true };
}

// Generate a CSRF token
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Validate CSRF token
export function validateCSRFToken(token: string, storedToken: string): boolean {
  return token === storedToken;
}
