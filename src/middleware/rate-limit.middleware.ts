import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import appConfig from '../config/app.config';

const createRateLimitError = (message: string, code: string) => {
  return new AppError(message, 429, code as any, 'RATE_LIMIT' as any, true);
};

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    next(createRateLimitError('Too many requests, please try again later', 'ERR_RATE_LIMIT_001'));
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    next(createRateLimitError('Too many auth attempts, please try again later', 'ERR_RATE_LIMIT_002'));
  },
});

export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    next(createRateLimitError('Too many attempts, account temporarily locked', 'ERR_RATE_LIMIT_003'));
  },
});

export const publicChatRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: appConfig.rag.rateLimits.publicChatPer15m,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    next(createRateLimitError('Too many public chat requests, please try again later', 'ERR_RATE_LIMIT_004'));
  },
});

export const ingestionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: appConfig.rag.rateLimits.ingestionPer15m,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    next(createRateLimitError('Too many ingestion requests, please try again later', 'ERR_RATE_LIMIT_005'));
  },
});
