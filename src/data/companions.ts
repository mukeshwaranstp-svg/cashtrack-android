export interface CompanionProfile {
  id: string;
  name: string;
  role: string;
  desc: string;
  speech: string;
  emoji: string;
  stars: string;
  levelBadge: string;
  themeColor: string;
  glowColor: string;
  bgGradient: string;
  badgeBg: string;
  image: string;
  favoriteQuote: string;
  strengths: string;
  specialAbility: string;
  dailyMood: string;
  preferredColor: string;
  voice: string;
  favoriteReward: string;
  dialogues: {
    greeting: string;
    overspending: string;
    budgetBalanced: string;
    goalFunding: string;
    goalCompleted: string;
    streakReminder: string;
    achievementUnlocked: string;
  };
}

export const DEFAULT_WAGURI_COMPANION: CompanionProfile = {
  id: "waguri",
  name: "Waguri",
  emoji: "🌸",
  role: "CashTrack Companion",
  desc: "Cheerful, energetic and celebrates every rupee you save.",
  speech: "Hi! I'm Waguri! I'll help you build amazing money habits. Let's celebrate every single win together! 🌸",
  stars: "★★★★★ CashTrack Official",
  levelBadge: "DEFAULT",
  themeColor: "from-pink-500 to-purple-600",
  glowColor: "rgba(255, 92, 168, 0.35)",
  bgGradient: "from-pink-50 via-purple-50 to-amber-50",
  badgeBg: "bg-pink-100 text-pink-700 border-pink-200",
  image: "/assets/narrator/waguri.png",
  favoriteQuote: "I'll celebrate every small win with you!",
  strengths: "Budget motivation & milestone celebrations",
  specialAbility: "Coin bursts & confetti animations on savings milestones.",
  dailyMood: "😊 Cheerful",
  preferredColor: "Pink & Purple",
  voice: "Cute and energetic",
  favoriteReward: "Confetti & Golden Coins",
  dialogues: {
    greeting: "Good morning! Let's keep our budget on track and save smart today! 🌸",
    overspending: "Oops... Looks like Wants spending is getting high today. Let's slow down a little! ⚠️",
    budgetBalanced: "Excellent! You're following your 70/20/10 budget targets perfectly! ✨",
    goalFunding: "Wow! Your savings goal is funding super fast! Keep going! 🚀",
    goalCompleted: "Amazing! Goal complete! You did it! I'm so proud of you! 🎉",
    streakReminder: "Welcome back! Keep your streak burning bright today! 🔥",
    achievementUnlocked: "🎉 Congratulations! You've unlocked a new financial milestone!"
  }
};

export const COMPANIONS_DATA: CompanionProfile[] = [
  DEFAULT_WAGURI_COMPANION
];

export function getCompanionById(id: string): CompanionProfile {
  if (id === "custom") {
    const customImg = localStorage.getItem("cashtrack_custom_companion_img");
    const customName = localStorage.getItem("cashtrack_custom_companion_name") || "Custom Companion";
    if (customImg) {
      return {
        ...DEFAULT_WAGURI_COMPANION,
        id: "custom",
        name: customName,
        emoji: "✨",
        role: "Custom Companion",
        image: customImg,
        speech: `Hi! I'm ${customName}! I'll be your CashTrack companion! ✨`,
      };
    }
  }
  return DEFAULT_WAGURI_COMPANION;
}
