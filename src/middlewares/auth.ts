import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const isAuthenticated = (
  req: Request & { user?: any; session?: { user?: { token?: string } } },
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  if (req.session?.user?.token) {
    token = req.session.user.token;
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  } else {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Token Malformed",
      });
      return;
    }
    token = authHeader.split("Bearer ")[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      req.user = decoded;
      next();
      return;
    } catch (err) {
      res.status(401).json({ message: "Invalid or expired token" });
    }
    return;
  }
  res.status(401).json({ message: "Unauthorized, please log in" });
  return;
};