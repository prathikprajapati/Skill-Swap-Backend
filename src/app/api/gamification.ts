import { apiClient } from "./client";

export interface LevelInfo {
  level: number;
  minXP: number;
  title: string;
  color: string;
  nextLevelXP: number | null;
  progress: number;
}

export interface UserStats {
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

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (stats: UserStats) => boolean;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastActive: string | null;
}

export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  action: string;
  description: string | null;
  created_at: string;
}

export interface GamificationData {
  xp: number;
  level: LevelInfo;
  stats: UserStats;
  achievements: Achievement[];
  streak: StreakInfo;
  recentTransactions: XPTransaction[];
}

export interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  avatar: string | null;
  xp: number;
  level: LevelInfo;
  totalSkills: number;
}

export const gamificationApi = {
  // Get user's gamification stats
  getStats: async (): Promise<GamificationData> => {
    const response = await apiClient.get("/gamification/stats");
    return response.data;
  },

  // Award XP (typically called by system, not user)
  awardXP: async (
    action: string,
    amount?: number,
  ): Promise<{
    success: boolean;
    xp: number;
    earned: number;
    leveledUp: boolean;
    newLevel: LevelInfo | null;
  }> => {
    const response = await apiClient.post("/gamification/xp", {
      action,
      amount,
    });
    return response.data;
  },

  // Get XP transaction history
  getXPHistory: async (): Promise<XPTransaction[]> => {
    const response = await apiClient.get("/gamification/xp/history");
    return response.data;
  },

  // Update streak (call when user performs an action)
  updateStreak: async (): Promise<StreakInfo> => {
    const response = await apiClient.post("/gamification/streak");
    return response.data;
  },

  // Get leaderboard
  getLeaderboard: async (
    limit: number = 10,
    period: "all" | "month" | "week" = "all",
  ): Promise<LeaderboardUser[]> => {
    const response = await apiClient.get("/gamification/leaderboard", {
      params: { limit, period },
    });
    return response.data;
  },
};
