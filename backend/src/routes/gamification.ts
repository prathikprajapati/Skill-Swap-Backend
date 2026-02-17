import { Router } from "express";
import { authenticateToken } from "../middleware/auth";

import {
  getUserStats,
  awardXP,
  getXPHistory,
  updateStreak,
  getLeaderboard,
} from "../controllers/gamificationController";

const router = Router();

// Get user's gamification stats
router.get("/stats", authenticateToken, getUserStats);

// Award XP (admin or system use)
router.post("/xp", authenticateToken, awardXP);

// Get XP transaction history
router.get("/xp/history", authenticateToken, getXPHistory);

// Update user streak
router.post("/streak", authenticateToken, updateStreak);

// Get leaderboard
router.get("/leaderboard", authenticateToken, getLeaderboard);

export default router;
