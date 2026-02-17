import { useState, useMemo, useEffect } from "react";
import { Button } from "@/app/components/ui/skill-swap-button";
import { SkillChip } from "@/app/components/ui/skill-chip";
import { useTheme, themes, type ThemeType } from "@/app/contexts/ThemeContext";
import { useAuth } from "@/app/contexts/AuthContext";
import { skillsApi, type Skill } from "@/app/api/skills";
import { usersApi, type UserSkill } from "@/app/api/users";
import { gamificationApi, type GamificationData, type Achievement } from "@/app/api/gamification";
import { Loader2 } from "lucide-react";
import { 
  X, Award, Target, Plus, CheckCircle, Sparkles, 
  Zap, Heart, Star, Trophy, Flame, TrendingUp, 
  Camera, Edit3, Share2, MessageCircle, Moon, Sun, 
  Cloud, Palette, Sparkle, Rainbow, Ghost, Coffee,
  Check, Users, GraduationCap, Calendar, Crown
} from "lucide-react";
import MagicBento from "@/app/components/ui/MagicBento";

// Gamification levels - now fetched from backend
const getLevelInfo = (xp: number) => {
  if (xp < 100) return { level: 1, title: "Novice", nextLevel: 100, nextLevelXP: 100, color: "#64748b", progress: (xp / 100) * 100 };
  if (xp < 300) return { level: 2, title: "Apprentice", nextLevel: 300, nextLevelXP: 300, color: "#10b981", progress: ((xp - 100) / 200) * 100 };
  if (xp < 600) return { level: 3, title: "Practitioner", nextLevel: 600, nextLevelXP: 600, color: "#3b82f6", progress: ((xp - 300) / 300) * 100 };
  if (xp < 1000) return { level: 4, title: "Expert", nextLevel: 1000, nextLevelXP: 1000, color: "#8b5cf6", progress: ((xp - 600) / 400) * 100 };
  return { level: 5, title: "Master", nextLevel: 2000, nextLevelXP: 2000, color: "#f59e0b", progress: Math.min(((xp - 1000) / 1000) * 100, 100) };
};

// Icon mapping for achievements
const iconMap: Record<string, React.ElementType> = {
  Flame,
  Heart,
  Trophy,
  Star,
  Zap,
  CheckCircle,
  Target,
  Award,
  Users,
  GraduationCap,
  Calendar,
  Crown,
};

// Theme cards data with icons
const allThemes: { id: ThemeType; icon: typeof Sun; bg: string; isDark: boolean }[] = [
  { id: "sapphire-dreams", icon: Sparkle, bg: "from-blue-900 to-indigo-950", isDark: true },
  /* { id: "deep-space", icon: Moon, bg: "from-slate-900 to-rose-950", isDark: true },
  { id: "lavender-mist", icon: Palette, bg: "from-indigo-200 to-purple-200", isDark: false },
  { id: "graphite-mint", icon: Cloud, bg: "from-teal-800 to-emerald-900", isDark: true },
  { id: "forest-mist", icon: Sun, bg: "from-emerald-900 to-teal-800", isDark: true }, */
  { id: "royal-gold", icon: Award, bg: "from-amber-900 to-yellow-950", isDark: true },
  /* { id: "cosmic-purple", icon: Sparkles, bg: "from-purple-950 to-fuchsia-950", isDark: true },
  { id: "warm-burgundy", icon: Heart, bg: "from-rose-100 to-amber-100", isDark: false },
  { id: "olive-garden", icon: Coffee, bg: "from-lime-800 to-green-900", isDark: true }, */
];

export function ProfilePage() {
  const { theme: currentTheme, setTheme } = useTheme();
  const { user, refreshUser } = useAuth();
  const [offeredSkills, setOfferedSkills] = useState<UserSkill[]>([]);
  const [wantedSkills, setWantedSkills] = useState<UserSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillType, setNewSkillType] = useState<"offer" | "want">("offer");
  const [newSkillLevel, setNewSkillLevel] = useState("beginner");
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState<"teaching" | "learning">("teaching");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);

  // Fetch user data and skills on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [userData, skillsData, gamification] = await Promise.all([
          usersApi.getMe(),
          skillsApi.getAll(),
          gamificationApi.getStats(),
        ]);
        setOfferedSkills(userData.offeredSkills || []);
        setWantedSkills(userData.wantedSkills || []);
        setAllSkills(skillsData);
        setGamificationData(gamification);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
        setError("Failed to load profile data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update streak when user is active
  useEffect(() => {
    const updateUserStreak = async () => {
      try {
        await gamificationApi.updateStreak();
      } catch (err) {
        console.error("Failed to update streak:", err);
      }
    };

    if (!isLoading) {
      updateUserStreak();
    }
  }, [isLoading]);

  // Use real gamification data from backend
  const userXP = gamificationData?.xp || 0;
  const levelInfo = gamificationData?.level || getLevelInfo(0);
  const xpProgress = levelInfo.progress || 0;
  const nextLevelXP = levelInfo.nextLevelXP || 0;
  const achievements = gamificationData?.achievements || [];
  const streak = gamificationData?.streak || { current: 0, longest: 0, lastActive: null };

  const handleRemoveSkill = async (skillId: string, type: "offer" | "want") => {
    try {
      await skillsApi.removeFromProfile(skillId);
      if (type === "offer") {
        setOfferedSkills(offeredSkills.filter((s) => s.id !== skillId));
      } else {
        setWantedSkills(wantedSkills.filter((s) => s.id !== skillId));
      }
      refreshUser();
    } catch (err) {
      console.error("Failed to remove skill:", err);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;

    try {
      // Find or create skill
      let skill = allSkills.find(s => s.name.toLowerCase() === newSkillName.toLowerCase());
      
      if (!skill) {
        // For now, we'll use the first skill as a fallback
        // In a real app, you'd create the skill first
        skill = allSkills[0];
      }

      if (!skill) {
        setError("No skills available. Please try again later.");
        return;
      }

      await skillsApi.addToProfile({
        skill_id: skill.id,
        skill_type: newSkillType,
        proficiency_level: newSkillLevel as "beginner" | "intermediate" | "expert",
      });

      // Refresh user data to get updated skills
      await refreshUser();
      const userData = await usersApi.getMe();
      setOfferedSkills(userData.offeredSkills || []);
      setWantedSkills(userData.wantedSkills || []);

      setNewSkillName("");
      setNewSkillLevel("beginner");
      setShowAddSkillModal(false);
      setShowSuccessFeedback(true);
      setTimeout(() => setShowSuccessFeedback(false), 2000);
    } catch (err) {
      console.error("Failed to add skill:", err);
      setError("Failed to add skill. Please try again.");
    }
  };

  // Profile stats for MagicBento - Action-oriented milestones with real data
  const profileStats = [
    { color: '#1e1b4b', title: 'Teaching', description: `${offeredSkills.length} skills shared`, label: 'Teaching' },
    { color: '#1e1b4b', title: 'Learning', description: `${wantedSkills.length} goals set`, label: 'Growth' },
    { color: '#1e1b4b', title: `Level ${levelInfo.level}`, description: `${userXP}/${nextLevelXP || '∞'} XP`, label: 'XP' },
    { color: '#1e1b4b', title: `${streak.current} Day Streak`, description: streak.current > 0 ? 'Keep it up! 🔥' : 'Start your streak!', label: 'Streak' },
    { color: '#1e1b4b', title: `${gamificationData?.stats.averageRating.toFixed(1) || '0.0'} Rating`, description: `${gamificationData?.stats.totalRatings || 0} reviews`, label: 'Stars' },
    { color: '#1e1b4b', title: `${gamificationData?.stats.completedSessions || 0} Swaps`, description: 'Completed sessions', label: 'Done' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Profile completion calculation
  const profileStrength = useMemo(() => {
    let score = 20;
    if (offeredSkills.length > 0) score += 25;
    if (wantedSkills.length > 0) score += 25;
    if (offeredSkills.length >= 3) score += 15;
    if (wantedSkills.length >= 3) score += 15;
    return Math.min(score, 100);
  }, [offeredSkills.length, wantedSkills.length]);

  const getStrengthLabel = (score: number) => {
    if (score < 40) return { label: "Starter", color: "#ef4444", message: "Add skills to get discovered!" };
    if (score < 70) return { label: "Rising", color: "#f59e0b", message: "Good start! Add more skills." };
    if (score < 90) return { label: "Strong", color: "#3b82f6", message: "Almost there! Keep building." };
    return { label: "All-Star", color: "#10b981", message: "Amazing profile! You'll get great matches." };
  };

  const strengthInfo = getStrengthLabel(profileStrength);

  return (
    <div className="max-w-[1400px] pb-20">
      {/* Hero Profile Card - Solid dark blue with subtle glow */}
      <div 
        className="relative mb-8 rounded-3xl overflow-hidden p-8 text-white shadow-2xl"
        style={{ 
          backgroundColor: '#1A1A2E',
          boxShadow: '0 0 60px rgba(99, 102, 241, 0.15), 0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="relative flex items-start gap-6">
          <div className="relative">
            <div 
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold border-2 shadow-lg"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div 
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white shadow-lg"
              style={{ backgroundColor: levelInfo.color }}
            >
              {levelInfo.level}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>{user?.name || 'User'}</h1>
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
              >
                <Sparkles className="w-4 h-4" />
                Pro
              </span>
              {strengthInfo.label === "All-Star" && (
                <span 
                  className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                  style={{ backgroundColor: 'rgba(250, 204, 21, 0.2)', color: '#FDE047' }}
                >
                  <Star className="w-4 h-4" />
                  All-Star
                </span>
              )}
            </div>
            <p className="mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{user?.email || ''}</p>
            
            <div className="flex items-center gap-4 max-w-md">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium" style={{ color: '#FFFFFF' }}>{levelInfo.title}</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{userXP} / {nextLevelXP} XP</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${xpProgress}%`, 
                      background: `linear-gradient(90deg, ${levelInfo.color}, #8b5cf6)` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              className="p-3 rounded-xl transition-all backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
              <Camera className="w-5 h-5" />
            </button>
            <button 
              className="p-3 rounded-xl transition-all backdrop-blur-sm flex items-center gap-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              onClick={() => setIsEditing(!isEditing)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
              <Edit3 className="w-5 h-5" />
              <span className="text-sm font-medium">Edit Profile</span>
            </button>
            <button 
              className="p-3 rounded-xl transition-all backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Strength Indicator
      <div className="mb-8 p-6 rounded-2xl border-2 transition-all duration-300" style={{ 
        backgroundColor: 'var(--card)', 
        borderColor: strengthInfo.color + '40',
        boxShadow: `0 4px 20px ${strengthInfo.color}20`
      }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: strengthInfo.color + '20' }}>
              <TrendingUp className="w-5 h-5" style={{ color: strengthInfo.color }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Profile Strength: <span style={{ color: strengthInfo.color }}>{strengthInfo.label}</span>
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {strengthInfo.message}
              </p>
            </div>
          </div>
          <span className="text-2xl font-bold" style={{ color: strengthInfo.color }}>
            {profileStrength}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-1000"
            style={{ 
              width: `${profileStrength}%`, 
              background: `linear-gradient(90deg, ${strengthInfo.color}, ${strengthInfo.color}80)` 
            }}
          />
        </div>
      </div> */}

      {/* Main Content Grid - Bento 70% | Skills+Activity 30% */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Left Side - MagicBento (70%) */}
        <div className="col-span-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#E0E0E0', fontWeight: 500 }}>
            Your Journey
          </h2>
          <MagicBento
            textAutoHide={true}
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={true}
            enableMagnetism={false}
            clickEffect={true}
            spotlightRadius={400}
            particleCount={12}
            glowColor="99, 102, 241"
            disableAnimations={false}
            cards={profileStats}
          />
        </div>

        {/* Right Side - Skills & Activity (30%) */}
        <div className="col-span-4 space-y-4">
          {/* Skills Section */}
          <div 
            className="p-5 rounded-2xl border"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)',
            }}
          >
            {/* Skills Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab("teaching")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  activeTab === "teaching" 
                    ? "bg-indigo-500 text-white shadow-md" 
                    : "text-[var(--text-secondary)] hover:bg-[var(--card-item-hover-bg)]"
                }`}
                style={activeTab !== "teaching" ? { backgroundColor: 'var(--secondary)' } : {}}
              >
                <Award className="w-4 h-4" />
                Teach ({offeredSkills.length})
              </button>
              <button
                onClick={() => setActiveTab("learning")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  activeTab === "learning" 
                    ? "bg-purple-500 text-white shadow-md" 
                    : "text-[var(--text-secondary)] hover:bg-[var(--card-item-hover-bg)]"
                }`}
                style={activeTab !== "learning" ? { backgroundColor: 'var(--secondary)' } : {}}
              >
                <Target className="w-4 h-4" />
                Learn ({wantedSkills.length})
              </button>
            </div>

            <div className="min-h-[120px]">
              {(activeTab === "teaching" ? offeredSkills : wantedSkills).length > 0 ? (
                <div className="flex flex-wrap gap-2 items-center">
                  {(activeTab === "teaching" ? offeredSkills : wantedSkills).slice(0, 6).map((skill, index) => (
                    <div 
                      key={skill.id}
                      className="animate-in fade-in zoom-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <SkillChip
                        skill={skill.name}
                        type={activeTab === "teaching" ? "offer" : "want"}
                        onRemove={() => handleRemoveSkill(skill.id, activeTab === "teaching" ? "offer" : "want")}
                      />
                    </div>
                  ))}
                  {(activeTab === "teaching" ? offeredSkills : wantedSkills).length > 6 && (
                    <span 
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ 
                        backgroundColor: 'var(--secondary)', 
                        color: 'var(--text-tertiary)' 
                      }}
                    >
                      +{(activeTab === "teaching" ? offeredSkills : wantedSkills).length - 6} more
                    </span>
                  )}
                  <button 
                    onClick={() => {
                      setNewSkillType(activeTab === "teaching" ? "offer" : "want");
                      setShowAddSkillModal(true);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-1 border border-indigo-500/30"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    No {activeTab === "teaching" ? "skills" : "goals"} yet
                  </p>
                  <button 
                    onClick={() => {
                      setNewSkillType(activeTab === "teaching" ? "offer" : "want");
                      setShowAddSkillModal(true);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition-all"
                  >
                    <Plus className="w-3 h-3 inline mr-1" />
                    Add First
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div 
            className="p-5 rounded-2xl border"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)',
            }}
          >
            <h3 className="font-bold mb-3 text-sm" style={{ color: 'var(--text-primary)' }}>
              Recent Activity
            </h3>
            <div className="space-y-2">
              {[
                { icon: MessageCircle, text: "Matched with Sarah", time: "2h", color: "#3b82f6" },
                { icon: CheckCircle, text: "Completed JS swap", time: "1d", color: "#10b981" },
                { icon: Star, text: "5⭐ from Mike", time: "2d", color: "#f59e0b" },
                { icon: Flame, text: "7-day streak!", time: "3d", color: "#f97316" },
              ].map((activity, i) => {
                const Icon = activity.icon;
                // Safely generate rgba with 8% opacity (better contrast than 15%)
                const iconBg = activity.color.includes('#') && activity.color.length === 7
                  ? `rgba(${parseInt(activity.color.slice(1, 3), 16)}, ${parseInt(activity.color.slice(3, 5), 16)}, ${parseInt(activity.color.slice(5, 7), 16)}, 0.08)`
                  : `rgba(128, 128, 128, 0.08)`;
                
                return (
                  <div 
                    key={i} 
                    className="flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer"
                    style={{ 
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--card-item-hover-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ backgroundColor: iconBg }}
                    >
                      <Icon className="w-4 h-4" style={{ color: activity.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{activity.text}</p>
                    </div>
                    <span 
                      className="text-xs"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {activity.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

        {/* Achievements - Full Width with tooltips */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4" style={{ color: '#E0E0E0', fontWeight: 500 }}>
          Achievements ({achievements.filter(a => a.unlocked).length}/{achievements.length})
        </h2>
        <div className="grid grid-cols-6 gap-3">
          {achievements.map((achievement: Achievement) => {
            const Icon = iconMap[achievement.icon] || Star;
            const achievementColor = achievement.unlocked ? "#10b981" : "#6b7280";
            return (
              <div 
                key={achievement.id}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer group ${
                  achievement.unlocked 
                    ? 'hover:scale-105 hover:shadow-lg' 
                    : 'opacity-50 grayscale'
                }`}
                style={{
                  backgroundColor: achievement.unlocked ? achievementColor + '10' : 'var(--section-bg)',
                  borderColor: achievement.unlocked ? achievementColor + '40' : '#2D2D2D',
                  borderRadius: '8px',
                }}
                title={`${achievement.title}: ${achievement.description}`}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: achievement.unlocked ? achievementColor + '20' : 'var(--secondary)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: achievement.unlocked ? achievementColor : 'var(--text-disabled)' }} />
                </div>
                <p className="text-xs font-medium" style={{ color: '#E0E0E0', fontWeight: 500 }}>
                  {achievement.title}
                </p>
                <p className="text-[10px] mt-1" style={{ color: '#BDBDBD' }}>
                  {achievement.description}
                </p>
                {achievement.unlocked && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: achievementColor }} />
                )}
              </div>
            );
          })}
        </div>
      </div>


      {/* Theme Cards - Grid Layout */}
      <div className="mb-2">
        <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          Choose Your Vibe
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4 p-4">
          {allThemes.map((theme) => {
            const Icon = theme.icon;
            const themeData = themes[theme.id];
            const isActive = currentTheme === theme.id;
            
            return (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 group text-left bg-gradient-to-br ${theme.bg} ${
                  isActive ? 'ring-2 ring-offset-2 ring-indigo-500 scale-105 shadow-lg' : 'hover:shadow-md'
                }`}
                  style={{ 
                    borderColor: isActive ? themeData.colors["--primary"] : 'transparent',
                    borderRadius: '12px',
                    minHeight: '100px',
                  }}

              >
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: theme.isDark ? '#FFFFFF' : '#1a1a2e' }} />
                  </div>
                  {isActive && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white/90 shadow-sm">
                      <Check className="w-4 h-4 text-indigo-600" />
                    </div>
                  )}
                </div>
                <h3 className={`font-semibold text-sm mb-1 ${theme.isDark ? 'text-white' : 'text-gray-900'}`} style={{ fontWeight: 600 }}>
                  {themeData.name}
                </h3>
                <p className={`text-xs leading-relaxed ${theme.isDark ? 'text-white/80' : 'text-gray-700'}`} style={{ fontSize: '12px', opacity: 0.9 }}>
                  {themeData.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>


      {/* Success Feedback */}
      {showSuccessFeedback && (
        <div className="fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 fade-in flex items-center gap-3 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Skill added! +50 XP 🎉</span>
        </div>
      )}

      {/* XP Notification for Level Up */}
      {gamificationData && gamificationData.level.progress === 0 && gamificationData.xp > 0 && (
        <div className="fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 fade-in flex items-center gap-3 z-50 bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
          <Trophy className="w-5 h-5" />
          <span className="font-medium">Level Up! You're now {gamificationData.level.title} 🎊</span>
        </div>
      )}

      {/* Add Skill Modal */}
      {showAddSkillModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setShowAddSkillModal(false)}
        >
          <div 
            className="w-full max-w-[480px] p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: 'var(--card)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Add New {newSkillType === "offer" ? "Skill" : "Goal"}
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {newSkillType === "offer" 
                    ? "What can you teach others?" 
                    : "What do you want to learn?"}
                </p>
              </div>
              <button
                onClick={() => setShowAddSkillModal(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--card-item-hover-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Skill Name
                </label>
                <input
                  type="text"
                  placeholder={newSkillType === "offer" ? "e.g., React, Guitar, Spanish" : "e.g., Machine Learning, Cooking"}
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  style={{ 
                    backgroundColor: 'var(--input-background, #FFFFFF)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Proficiency Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["beginner", "intermediate", "expert"].map((level) => (
                    <button
                      key={level}
                      onClick={() => setNewSkillLevel(level)}
                      className={`py-3 px-4 rounded-xl border-2 font-medium capitalize transition-all ${
                        newSkillLevel === level
                          ? newSkillType === "offer"
                            ? "border-indigo-500 text-indigo-700"
                            : "border-purple-500 text-purple-700"
                          : "hover:border-[var(--primary)]"
                      }`}
                      style={newSkillLevel === level 
                        ? { 
                            backgroundColor: newSkillType === "offer" ? 'rgba(99, 102, 241, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                            color: newSkillType === "offer" ? '#4f46e5' : '#9333ea'
                          }
                        : { 
                            borderColor: 'var(--border)',
                            color: 'var(--text-secondary)'
                          }
                      }
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddSkill}
                  disabled={!newSkillName.trim()}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all ${
                    newSkillType === "offer"
                      ? "bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300"
                      : "bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300"
                  }`}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add {newSkillType === "offer" ? "to Teaching" : "to Learning"}
                </button>
                <button 
                  onClick={() => setShowAddSkillModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-medium border-2 transition-all"
                  style={{ 
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--card-item-hover-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
