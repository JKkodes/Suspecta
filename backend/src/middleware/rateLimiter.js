import rateLimit from "express-rate-limit";

/**
 * General rate limiter for standard backend routes.
 * Protects server resources without blocking normal app navigation.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: "Too many requests. Please wait a few minutes before trying again.",
  },
});

/**
 * Stricter rate limiter specifically for Groq AI endpoints (/api/url, /api/conversation).
 * Prevents rapid sequence calls from blowing through Groq's Tokens Per Minute (TPM) quota.
 */
export const aiScanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: "AI analysis limit reached. Please wait 1 minute before submitting another URL or prompt.",
  },
});