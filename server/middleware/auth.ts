import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface User {
      id: number;
      isAdmin: boolean;
    }
  }
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check if the user has admin privileges
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  next();
}