import type { Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../types/auth";

const prisma = new PrismaClient();

// XP values for different actions
const XP_VALUES = {
  ADD_SKILL: 50,
  COMPLETE_SESSION: 100,
  RECEIVE_RATING: 20,
  STREAK_BONUS: 10, // per day of streak
  FIRST_MATCH: 100,
  TEACH_SKILL: 30, // per skill taught
  LEARN_SKILL: 25, // per skill learned
};

// Level thresholds
const LEVEL_THRESHOLDS = [
  { level: 1, minXP: 0, title: "Novice", color: "#64748b" },
  { level: 2, minXP: 100, title: "Apprentice", color: "#10b981" },
  { level: 3, minXP: 300, title: "Practitioner", color: "#3b82f6" },
  { level: 4, minXP: 600, title: "Expert", color: "#8b5cf6" },
  { level: 5, minXP: 1000, title: "Master", color: "#f59e0b" },
  { level: 6, minXP: 2000, title: "Grandmaster", color: "#ef4444" },
];

// Achievement definitions
const ACHIEVEMENTS = [
  {
    id: "first_skill",
    title: "First Skill",
    description: "Added your first skill",
    icon: "Target",
    condition: (stats: UserStats) => stats.totalSkills >= 1,
  },
  {
    id: "skill_collector",
    title: "Skill Collector",
    description: "Added 5+ skills to your profile",
    icon: "Award",
    condition: (stats: UserStats) => stats.totalSkills >= 5,
  },
  {
    id: "first_match",
    title: "First Match",
    description: "Found your first skill partner",
    icon: "Heart",
    condition: (stats: UserStats) => stats.totalMatches >= 1,
  },
  {
    id: "social_butterfly",
    title: "Social Butterfly",
    description: "Made 10+ matches",
    icon: "Users",
    condition: (stats: UserStats) => stats.totalMatches >= 10,
  },
  {
    id: "teacher",
    title: "Teacher",
    description: "Taught 3+ skills to others",
    icon: "GraduationCap",
    condition: (stats: UserStats) => stats.skillsTaught >= 3,
  },
  {
    id: "quick_learner",
    title: "Quick Learner",
    description: "Learned 3+ skills in a month",
    icon: "Zap",
    condition: (stats: UserStats) => stats.skillsLearnedThisMonth >= 3,
  },
  {
    id: "streak_7",
    title: "7-Day Streak",
    description: "Active for 7 days straight",
    icon: "Flame",
    condition: (stats: UserStats) => stats.currentStreak >= 7,
  },
  {
    id: "streak_30",
    title: "Monthly Master",
    description: "Active for 30 days straight",
    icon: "Calendar",
    condition: (stats: UserStats) => stats.currentStreak >= 30,
  },
  {
    id: "top_rated",
    title: "Top Rated",
    description: "Maintained 4.5+ rating with 5+ reviews",
    icon: "Star",
    condition: (stats: UserStats) =>
      stats.averageRating >= 4.5 && stats.totalRatings >= 5,
  },
  {
    id: "session_master",
    title: "Session Master",
    description: "Completed 20+ skill swap sessions",
    icon: "Trophy",
    condition: (stats: UserStats) => stats.completedSessions >= 20,
  },
  {
    id: "verified",
    title: "Verified",
    description: "Completed profile verification",
    icon: "CheckCircle",
    condition: (stats: UserStats) => stats.isVerified,
  },
  {
    id: "xp_1000",
    title: "XP Champion",
    description: "Earned 1000+ XP",
    icon: "Crown",
    condition: (stats: UserStats) => stats.totalXP >= 1000,
  },
];

interface UserStats {
  totalSkills: number;
  totalMatches: number;
  skillsTaught: number;
  skillsLearnedThisMonth: number;
  currentStreak: number;
  averageRating: number;
  totalRatings: number;
  completedSessions: number;
  isVerified: boolean;
  totalXP: number;
}

// Get user's gamification stats
export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user with skills
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_skills: {
          include: {
            skill: true,
          },
        },
        user1_matches: true,
        user2_matches: true,
        sessions_as_teacher: true,
        sessions_as_learner: true,
        ratings_received: true,
        xp_transactions: {
          orderBy: { created_at: "desc" },
          take: 10,
        },
        streak: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Calculate stats
    const totalMatches = user.user1_matches.length + user.user2_matches.length;
    const completedSessions = [
      ...user.sessions_as_teacher,
      ...user.sessions_as_learner,
    ].filter((s) => s.status === "completed").length;

    const ratings = user.ratings_received;
    const averageRating =
      ratings.length > 0
        ? ratings.reduce(
            (sum: number, r: { rating: number }) => sum + r.rating,
            0,
          ) / ratings.length
        : 0;

    // Calculate streak
    const streak = await calculateStreak(userId);

    // Calculate skills learned this month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const skillsLearnedThisMonth = user.user_skills.filter(
      (s: { skill_type: string; created_at: Date }) =>
        s.skill_type === "want" && new Date(s.created_at) > oneMonthAgo,
    ).length;

    // Calculate skills taught (based on completed sessions where user was teacher)
    const skillsTaught = user.sessions_as_teacher.filter(
      (s: { status: string }) => s.status === "completed",
    ).length;

    const stats: UserStats = {
      totalSkills: user.user_skills.length,
      totalMatches,
      skillsTaught,
      skillsLearnedThisMonth,
      currentStreak: streak.currentStreak,
      averageRating,
      totalRatings: ratings.length,
      completedSessions,
      isVerified: user.is_verified || false,
      totalXP: user.xp || 0,
    };

    // Calculate achievements
    const achievements = ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      unlocked: achievement.condition(stats),
      unlockedAt: achievement.condition(stats)
        ? new Date().toISOString()
        : null,
    }));

    // Get current level info
    const currentLevel = getLevelInfo(user.xp || 0);

    res.json({
      xp: user.xp || 0,
      level: currentLevel,
      stats,
      achievements,
      streak: {
        current: streak.currentStreak,
        longest: streak.longestStreak,
        lastActive: streak.lastActiveDate,
      },
      recentTransactions: user.xp_transactions,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Award XP to user
export const awardXP = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { action, amount } = req.body;

    // Validate action
    const xpAmount = amount || XP_VALUES[action as keyof typeof XP_VALUES];
    if (!xpAmount) {
      return res.status(400).json({ error: "Invalid action or amount" });
    }

    // Get current XP before update
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true },
    });

    const oldXP = currentUser?.xp || 0;

    // Update user XP
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        xp: {
          increment: xpAmount,
        },
      },
    });

    // Check for level up
    const oldLevel = getLevelInfo(oldXP);
    const newLevel = getLevelInfo(user.xp || 0);

    const leveledUp = oldLevel.level < newLevel.level;

    // Record XP transaction
    await prisma.xPTransaction.create({
      data: {
        user_id: userId,
        amount: xpAmount,
        action: action || "custom",
        description: `Earned ${xpAmount} XP for ${action}`,
      },
    });

    res.json({
      success: true,
      xp: user.xp,
      earned: xpAmount,
      leveledUp,
      newLevel: leveledUp ? newLevel : null,
    });
  } catch (error) {
    console.error("Award XP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get XP history
export const getXPHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const transactions = await prisma.xPTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 50, // Last 50 transactions
    });

    res.json(transactions);
  } catch (error) {
    console.error("Get XP history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update streak
export const updateStreak = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get or create streak record
    let streak = await prisma.streak.findUnique({
      where: { user_id: userId },
    });

    if (!streak) {
      streak = await prisma.streak.create({
        data: {
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          last_active_date: today,
        },
      });
    } else {
      const lastActive = new Date(streak.last_active_date);
      lastActive.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        // Consecutive day - increment streak
        const newStreak = streak.current_streak + 1;
        streak = await prisma.streak.update({
          where: { user_id: userId },
          data: {
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, streak.longest_streak),
            last_active_date: today,
          },
        });

        // Award streak bonus XP
        if (newStreak % 7 === 0) {
          // Weekly bonus
          await awardXPToUser(
            userId,
            XP_VALUES.STREAK_BONUS * 7,
            "weekly_streak_bonus",
          );
        }
      } else if (diffDays > 1) {
        // Streak broken - reset
        streak = await prisma.streak.update({
          where: { user_id: userId },
          data: {
            current_streak: 1,
            last_active_date: today,
          },
        });
      }
      // If diffDays === 0, already active today - do nothing
    }

    res.json({
      current: streak.current_streak,
      longest: streak.longest_streak,
      lastActive: streak.last_active_date,
    });
  } catch (error) {
    console.error("Update streak error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get leaderboard
export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = "10", period = "all" } = req.query;

    let whereClause = {};

    if (period === "month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      whereClause = {
        created_at: {
          gte: oneMonthAgo,
        },
      };
    } else if (period === "week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      whereClause = {
        created_at: {
          gte: oneWeekAgo,
        },
      };
    }

    // Get top users by XP
    const topUsers = await prisma.user.findMany({
      where: {
        xp: {
          gt: 0,
        },
      },
      orderBy: {
        xp: "desc",
      },
      take: parseInt(limit as string),
      select: {
        id: true,
        name: true,
        avatar: true,
        xp: true,
        _count: {
          select: {
            user_skills: true,
          },
        },
      },
    });

    // Add rank and level info
    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      ...user,
      level: getLevelInfo(user.xp || 0),
      totalSkills: user._count?.user_skills || 0,
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper functions
function getLevelInfo(xp: number) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].minXP) {
      const nextLevel = LEVEL_THRESHOLDS[i + 1];
      return {
        ...LEVEL_THRESHOLDS[i],
        nextLevelXP: nextLevel?.minXP || null,
        progress: nextLevel
          ? ((xp - LEVEL_THRESHOLDS[i].minXP) /
              (nextLevel.minXP - LEVEL_THRESHOLDS[i].minXP)) *
            100
          : 100,
      };
    }
  }
  return LEVEL_THRESHOLDS[0];
}

async function calculateStreak(userId: string) {
  const streak = await prisma.streak.findUnique({
    where: { user_id: userId },
  });

  if (!streak) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    };
  }

  // Check if streak is still valid
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActive = new Date(streak.last_active_date);
  lastActive.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays > 1) {
    // Streak broken
    return {
      currentStreak: 0,
      longestStreak: streak.longest_streak,
      lastActiveDate: streak.last_active_date,
    };
  }

  return {
    currentStreak: streak.current_streak,
    longestStreak: streak.longest_streak,
    lastActiveDate: streak.last_active_date,
  };
}

async function awardXPToUser(userId: string, amount: number, action: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: {
        increment: amount,
      },
    },
  });

  await prisma.xPTransaction.create({
    data: {
      user_id: userId,
      amount: amount,
      action: action,
      description: `Earned ${amount} XP for ${action}`,
    },
  });
}
