import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { 
    success: false,
    error: 'Too many requests, please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for voting
export const voteRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { 
    success: false,
    error: 'Too many votes from this IP, please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP + Poll ID as key to prevent cross-poll abuse
    return `${req.ip}-${req.params.pollId}`;
  }
});

// Poll creation rate limiter
export const createPollLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { 
    success: false,
    error: 'Too many polls created from this IP, please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false
});