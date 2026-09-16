import { Response, NextFunction } from "express";
import { AuthRequest } from "./Auth";

export const requireRole = (...allowedRoles: ("user" | "admin")[]) => {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: "Access denied",
      });
      return;
    }

    next();
  };
};