import type { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

const prisma = new PrismaClient();

// Validate JWT_SECRET at startup - no fallback allowed
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "CRITICAL: JWT_SECRET environment variable is not defined. Set it before starting the server.",
  );
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  // Skip authentication - allow all requests (non-protected mode)
  // To re-enable protection, uncomment the code below:
  /*
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    req.user = decoded as { id: string };
    next();
  });
  */

  // For now, just allow all requests through
  next();
};

/**
 * Middleware to block soft-deleted users from performing actions
 * Apply this AFTER authenticateToken in routes that need this protection
 */
export const requireActiveUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { is_deleted: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.is_deleted) {
      return res.status(403).json({
        error: "Account has been deleted. Please contact support.",
      });
    }

    next();
  } catch (error) {
    console.error("Active user check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
