export interface CompanionDialogue {
  text: string;
  emotion: "neutral" | "happy" | "excited" | "worried" | "angry";
  animation: "wave" | "jump" | "dance" | "shake" | "float" | "victory";
}

export const COMPANION_DIALOGUES: { [key: string]: CompanionDialogue } = {
  first_launch: {
    text: "Welcome to CashTrack! Let's start your saving journey! 🌸",
    emotion: "neutral",
    animation: "wave"
  },
  create_goal: {
    text: "Amazing! Every great journey starts with one goal. 🎯",
    emotion: "happy",
    animation: "jump"
  },
  log_expense: {
    text: "Nice! Tracking every expense makes you stronger. 💪",
    emotion: "happy",
    animation: "wave"
  },
  under_budget: {
    text: "You're doing great! Keep staying disciplined and under budget! ✨",
    emotion: "happy",
    animation: "dance"
  },
  exceed_budget: {
    text: "Oops! We went over budget today. Let's be careful tomorrow! ⚠️",
    emotion: "worried",
    animation: "shake"
  },
  goal_25: {
    text: "You're already 25% there! Awesome progress! 🚀",
    emotion: "happy",
    animation: "jump"
  },
  goal_50: {
    text: "Halfway there! Keep it up, you can do this! 💖",
    emotion: "excited",
    animation: "dance"
  },
  goal_75: {
    text: "Almost done! Don't stop now, we're so close! ⭐",
    emotion: "excited",
    animation: "jump"
  },
  goal_complete: {
    text: "🎉 Goal Complete! You did it! I'm so proud of you! ✨",
    emotion: "excited",
    animation: "victory"
  },
  daily_login: {
    text: "Ready to save today? Let's check our budget! ☀️",
    emotion: "neutral",
    animation: "wave"
  },
  streak_7: {
    text: "Seven days! You're building an amazing habit! 🔥",
    emotion: "excited",
    animation: "dance"
  },
  challenge_complete: {
    text: "Challenge cleared! Here's your reward! 🏆",
    emotion: "excited",
    animation: "victory"
  }
};

export const IDLE_TIPS = [
  "💡 Saving ₹100 every day becomes ₹36,500 per year.",
  "💡 Needs come first, wants can wait!",
  "💡 Small savings create big dreams.",
  "💡 Every rupee has a purpose in your plan.",
  "💡 Consistency beats perfection. Stay on track!",
  "💡 Keep checking your 70/20/10 budget splits!",
  "💡 Avoiding impulse tea runs saves more than you think!"
];
