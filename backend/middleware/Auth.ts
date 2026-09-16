import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  role: "user" | "admin";
}

export interface AuthRequest extends Request {
  user?: JwtPayload;

}

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Invalid authorization format",
      });
      return;
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is missing from environment");

      res.status(500).json({
        message: "JWT configuration error",
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      secret,
    ) as JwtPayload;

    req.user = decoded;

    next();
  } catch (error) {
    console.error("JWT verification error:", error);

    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};