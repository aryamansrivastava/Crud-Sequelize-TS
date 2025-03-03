import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10,
  message: {
    success: false,
    error: "Too many requests",
    message: "You have exceeded the request limit. Please wait and try again in a few minutes.",
    retry_after_seconds: 60
  },
  headers: true,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "Too many requests",
      message: "You have exceeded the request limit. Please wait and try again in a few minutes.",
      retry_after_seconds: 60
    });
  }
});