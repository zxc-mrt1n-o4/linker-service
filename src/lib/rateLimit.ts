// Simple in-memory rate limiter
// For production, consider using a Redis-based solution

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipLimiter = new Map<string, RateLimitRecord>();
const usernameLimiter = new Map<string, RateLimitRecord>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  
  // Clean IP limiter
  for (const [ip, record] of ipLimiter.entries()) {
    if (now > record.resetTime) {
      ipLimiter.delete(ip);
    }
  }
  
  // Clean username limiter
  for (const [username, record] of usernameLimiter.entries()) {
    if (now > record.resetTime) {
      usernameLimiter.delete(username);
    }
  }
}, 60 * 1000); // Run every minute

export function checkRateLimit(
  ip: string,
  username: string,
  maxIpAttempts = 10,
  maxUsernameAttempts = 5,
  windowMs = 15 * 60 * 1000 // 15 minutes
): { limited: boolean; remainingAttempts: number; resetTime: number } {
  const now = Date.now();
  const resetTime = now + windowMs;
  
  // Check IP rate limit
  let ipRecord = ipLimiter.get(ip);
  if (!ipRecord) {
    ipRecord = { count: 0, resetTime };
    ipLimiter.set(ip, ipRecord);
  } else if (now > ipRecord.resetTime) {
    ipRecord.count = 0;
    ipRecord.resetTime = resetTime;
  }
  
  // Check username rate limit
  let usernameRecord = usernameLimiter.get(username);
  if (!usernameRecord) {
    usernameRecord = { count: 0, resetTime };
    usernameLimiter.set(username, usernameRecord);
  } else if (now > usernameRecord.resetTime) {
    usernameRecord.count = 0;
    usernameRecord.resetTime = resetTime;
  }
  
  // Increment counters
  ipRecord.count++;
  usernameRecord.count++;
  
  // Check if rate limited
  const ipLimited = ipRecord.count > maxIpAttempts;
  const usernameLimited = usernameRecord.count > maxUsernameAttempts;
  const limited = ipLimited || usernameLimited;
  
  // Calculate remaining attempts (the lower of the two)
  const ipRemaining = Math.max(0, maxIpAttempts - ipRecord.count);
  const usernameRemaining = Math.max(0, maxUsernameAttempts - usernameRecord.count);
  const remainingAttempts = Math.min(ipRemaining, usernameRemaining);
  
  return {
    limited,
    remainingAttempts,
    resetTime: Math.min(ipRecord.resetTime, usernameRecord.resetTime)
  };
}

export function resetRateLimit(ip: string, username: string): void {
  ipLimiter.delete(ip);
  usernameLimiter.delete(username);
}
