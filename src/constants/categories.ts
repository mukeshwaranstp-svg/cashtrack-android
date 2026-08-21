export interface Category {
  name: string;
  bucket: "Needs" | "Wants" | "Savings";
  icon: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  // Needs (70%)
  { name: "Food", bucket: "Needs", icon: "🍔", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { name: "Rent", bucket: "Needs", icon: "🏠", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { name: "Transport", bucket: "Needs", icon: "🚗", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { name: "Bills", bucket: "Needs", icon: "💡", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { name: "Education", bucket: "Needs", icon: "📚", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { name: "Medical", bucket: "Needs", icon: "❤️", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { name: "Utilities", bucket: "Needs", icon: "🔌", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { name: "Mobile & Internet", bucket: "Needs", icon: "📱", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },

  // Wants (20%)
  { name: "Entertainment", bucket: "Wants", icon: "🎬", color: "bg-[#FF5CA8]/10 text-[#FF5CA8] border-[#FF5CA8]/20" },
  { name: "Shopping", bucket: "Wants", icon: "🛍️", color: "bg-[#FF5CA8]/10 text-[#FF5CA8] border-[#FF5CA8]/20" },
  { name: "Coffee & Cafes", bucket: "Wants", icon: "☕", color: "bg-[#FF5CA8]/10 text-[#FF5CA8] border-[#FF5CA8]/20" },
  { name: "Dining Out", bucket: "Wants", icon: "🍽️", color: "bg-[#FF5CA8]/10 text-[#FF5CA8] border-[#FF5CA8]/20" },
  { name: "Gaming", bucket: "Wants", icon: "🎮", color: "bg-[#FF5CA8]/10 text-[#FF5CA8] border-[#FF5CA8]/20" },
  { name: "Gifts", bucket: "Wants", icon: "🎁", color: "bg-[#FF5CA8]/10 text-[#FF5CA8] border-[#FF5CA8]/20" },
  { name: "Travel", bucket: "Wants", icon: "✈️", color: "bg-[#FF5CA8]/10 text-[#FF5CA8] border-[#FF5CA8]/20" },
  { name: "Fun", bucket: "Wants", icon: "🎉", color: "bg-[#FF5CA8]/10 text-[#FF5CA8] border-[#FF5CA8]/20" },

  // Savings (10%)
  { name: "Savings/Investment", bucket: "Savings", icon: "💰", color: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20" }
];

export function getBucketForCategory(category: string): "Needs" | "Wants" | "Savings" {
  const found = CATEGORIES.find(c => c.name.toLowerCase() === category.toLowerCase());
  return found ? found.bucket : "Needs";
}
