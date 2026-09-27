import rateLimit from 'express-rate-limit';

// General rate limiter applied to all routes
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX) || 1000, // limit each IP per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for authentication routes (more permissive)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  // standardHeaders removed
  // legacyHeaders removed
});
