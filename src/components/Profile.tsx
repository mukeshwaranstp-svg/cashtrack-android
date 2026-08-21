import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import Cropper from "react-easy-crop";
import { 
  User, 
  Award, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Check, 
  Edit2, 
  Flame, 
  Download, 
  Coins, 
  Bell, 
  BellRing,
  UserRound,
  UploadCloud,
  Users,
  Sparkles, 
  TrendingUp, 
  PieChart, 
  AlertTriangle,
  Compass,
  ArrowRightLeft,
  DollarSign,
  Camera,
  Trash2,
  X,
  RefreshCw,
  Sliders,
  Plus,
  ChevronRight,
  Crop,
  ZoomIn,
  Upload,
  Zap,
  PiggyBank,
  Target,
  Moon,
  Sun,
  Monitor
} from "lucide-react";
import Narrator from "./Narrator";
import { COMPANIONS_DATA } from "../data/companions";
import { SummaryData } from "../types";
import PageLayout from "./PageLayout";
import { applyTheme, getStoredTheme, ThemeOption } from "../utils/theme";

interface ProfileProps {
  data: SummaryData | null;
  onRefresh: () => void;
}

const AVATARS = ["🦊", "🐼", "🐱", "🦁", "🐯", "🐶", "🐸", "🐰", "🐻", "🐨", "🦄", "🐷"];

export function Profile({ data, onRefresh }: ProfileProps) {
  // Streak Statistics state
  const [streakStats, setStreakStats] = useState(() => {
    const saved = localStorage.getItem("cashtrack_streak_stats");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          current_streak: parsed.current_streak ?? 0,
          longest_streak: parsed.longest_streak ?? 0,
          freeze_count: parsed.freeze_count ?? 0,
          completed_missions_count: parsed.completed_missions_count ?? 0,
          total_xp_earned: parsed.total_xp_earned ?? 0,
          total_coins_earned: parsed.total_coins_earned ?? 0,
        };
      } catch (e) {}
    }
    return {
      current_streak: 0,
      longest_streak: 0,
      freeze_count: 0,
      completed_missions_count: 0,
      total_xp_earned: 0,
      total_coins_earned: 0,
    };
  });

  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() => {
    const saved = localStorage.getItem("cashtrack_unlocked_achievements");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  // Local profile state
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("cashtrack_profile");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      avatar: "??",
      name: "Arigato Student",
      username: "@arigato.stp",
      email: "arigato.stp@gmail.com",
      bio: "Sem 3 engineering student | Tracking tea tapri expenses, metro tickets, and mess bills with 70/20/10 discipline."
    };
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editUsername, setEditUsername] = useState(profile.username);
  const [editEmail, setEditEmail] = useState(profile.email);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editAvatar, setEditAvatar] = useState(profile.avatar);
  const [saveProfileSuccess, setSaveProfileSuccess] = useState(false);

  // Profile Photo Upload and Crop State
  const [profilePic, setProfilePic] = useState<string | null>(() => localStorage.getItem("cashtrack_profile_pic"));
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Companion Settings States
  const [selectedCompanionId, setSelectedCompanionId] = useState(() => localStorage.getItem("cashtrack_selected_companion") || "disabled");
  const [companionVisibility, setCompanionVisibility] = useState(() => localStorage.getItem("cashtrack_companion_visibility") || "disabled");
  const [customCompanionName, setCustomCompanionName] = useState(() => localStorage.getItem("cashtrack_custom_companion_name") || "My Companion");
  const [customCompanionImg, setCustomCompanionImg] = useState(() => localStorage.getItem("cashtrack_custom_companion_img"));
  const [previewAnimation, setPreviewAnimation] = useState<"float" | "bounce" | "wave" | "blink" | "jump">("float");
  
  const [isChangeCompanionOpen, setIsChangeCompanionOpen] = useState(false);
  const [isCreateCompanionOpen, setIsCreateCompanionOpen] = useState(false);
  const [isCompanionPreviewing, setIsCompanionPreviewing] = useState(false);

  // Upload/Cropper states for custom companion inside settings
  const [settingsImageSrc, setSettingsImageSrc] = useState<string | null>(null);
  const [settingsZoom, setSettingsZoom] = useState<number>(1);
  const [settingsDragOffset, setSettingsDragOffset] = useState({ x: 0, y: 0 });
  const [isSettingsDragging, setIsSettingsDragging] = useState(false);
  const settingsDragStart = useRef({ x: 0, y: 0 });
  const [settingsCustomName, setSettingsCustomName] = useState("My Companion");
  const [settingsCroppedImage, setSettingsCroppedImage] = useState<string | null>(null);
  const settingsFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const handleUpdate = () => {
      setProfilePic(localStorage.getItem("cashtrack_profile_pic"));
    };
    window.addEventListener("cashtrack_profile_pic_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("cashtrack_profile_pic_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const triggerImagePicker = () => {
    fileInputRef.current?.click();
  };

  // Companion Settings Handlers
  const handleSettingsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSettingsImageSrc(event.target.result as string);
          setSettingsZoom(1);
          setSettingsDragOffset({ x: 0, y: 0 });
          setSettingsCroppedImage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingsMouseDown = (e: React.MouseEvent) => {
    setIsSettingsDragging(true);
    settingsDragStart.current = { x: e.clientX - settingsDragOffset.x, y: e.clientY - settingsDragOffset.y };
  };

  const handleSettingsMouseMove = (e: React.MouseEvent) => {
    if (!isSettingsDragging) return;
    setSettingsDragOffset({
      x: e.clientX - settingsDragStart.current.x,
      y: e.clientY - settingsDragStart.current.y
    });
  };

  const handleSettingsMouseUp = () => {
    setIsSettingsDragging(false);
  };

  const handleSettingsTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      setIsSettingsDragging(true);
      settingsDragStart.current = { 
        x: e.touches[0].clientX - settingsDragOffset.x, 
        y: e.touches[0].clientY - settingsDragOffset.y 
      };
    }
  };

  const handleSettingsTouchMove = (e: React.TouchEvent) => {
    if (!isSettingsDragging || !e.touches[0]) return;
    setSettingsDragOffset({
      x: e.touches[0].clientX - settingsDragStart.current.x,
      y: e.touches[0].clientY - settingsDragStart.current.y
    });
  };

  const performSettingsCrop = () => {
    if (!settingsImageSrc) return;

    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      const img = new Image();
      img.src = settingsImageSrc;
      img.onload = () => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 320, 320);

        const cx = 160;
        const cy = 160;

        const scale = settingsZoom;
        const imgWidth = img.width;
        const imgHeight = img.height;

        const minDim = Math.min(imgWidth, imgHeight);
        const drawW = (imgWidth / minDim) * 320 * scale;
        const drawH = (imgHeight / minDim) * 320 * scale;

        const xPos = cx - drawW / 2 + settingsDragOffset.x;
        const yPos = cy - drawH / 2 + settingsDragOffset.y;

        ctx.drawImage(img, xPos, yPos, drawW, drawH);

        const base64Cropped = canvas.toDataURL("image/png");
        setSettingsCroppedImage(base64Cropped);
      };
    }
  };

  // Companion Options Handlers
  const selectOptionNoCompanion = () => {
    setSelectedCompanionId("disabled");
    setCompanionVisibility("disabled");
    localStorage.setItem("cashtrack_selected_companion", "disabled");
    localStorage.setItem("cashtrack_companion_visibility", "disabled");
    showToast("Companion disabled. Application in clean professional mode.");
    window.dispatchEvent(new Event("cashtrack_companion_settings_updated"));
    window.dispatchEvent(new Event("cashtrack_companion_updated"));
  };

  const selectOptionDefaultCompanion = () => {
    setSelectedCompanionId("waguri");
    setCompanionVisibility("events");
    localStorage.setItem("cashtrack_selected_companion", "waguri");
    localStorage.setItem("cashtrack_companion_visibility", "events");
    showToast("Default CashTrack Companion (Waguri) enabled!");
    window.dispatchEvent(new Event("cashtrack_companion_settings_updated"));
    window.dispatchEvent(new Event("cashtrack_companion_updated"));
  };

  const selectOptionUploadCompanion = () => {
    setSettingsImageSrc(null);
    setSettingsCroppedImage(null);
    setIsCompanionPreviewing(false);
    setIsCreateCompanionOpen(true);
  };

  const saveSettingsCustomCompanion = () => {
    const imgToSave = settingsCroppedImage || settingsImageSrc;
    if (imgToSave) {
      localStorage.setItem("cashtrack_selected_companion", "custom");
      localStorage.setItem("cashtrack_companion_visibility", "events");
      localStorage.setItem("cashtrack_custom_companion_img", imgToSave);
      localStorage.setItem("cashtrack_custom_companion_name", settingsCustomName || "My Companion");
      
      setSelectedCompanionId("custom");
      setCompanionVisibility("events");
      setCustomCompanionImg(imgToSave);
      setCustomCompanionName(settingsCustomName || "My Companion");
      
      setIsCreateCompanionOpen(false);
      setIsCompanionPreviewing(false);
      setSettingsImageSrc(null);
      setSettingsCroppedImage(null);
      
      showToast(`Custom companion "${settingsCustomName || "My Companion"}" saved!`);
      window.dispatchEvent(new Event("cashtrack_companion_settings_updated"));
      window.dispatchEvent(new Event("cashtrack_companion_updated"));
    }
  };

  const restoreDefaultWaguri = () => {
    localStorage.setItem("cashtrack_selected_companion", "waguri");
    localStorage.setItem("cashtrack_companion_visibility", "events");
    setSelectedCompanionId("waguri");
    setCompanionVisibility("events");
    showToast("Restored Waguri as default companion.");
    window.dispatchEvent(new Event("cashtrack_companion_settings_updated"));
    window.dispatchEvent(new Event("cashtrack_companion_updated"));
  };

  const deleteCustomCompanion = () => {
    localStorage.removeItem("cashtrack_custom_companion_img");
    localStorage.removeItem("cashtrack_custom_companion_name");
    setCustomCompanionImg(null);
    setCustomCompanionName("My Companion");
    
    if (selectedCompanionId === "custom") {
      localStorage.setItem("cashtrack_selected_companion", "waguri");
      setSelectedCompanionId("waguri");
    }
    
    showToast("Deleted custom companion.");
    window.dispatchEvent(new Event("cashtrack_companion_settings_updated"));
    window.dispatchEvent(new Event("cashtrack_companion_updated"));
  };

  const handleSelectCompanionId = (id: string) => {
    if (id === "disabled") {
      selectOptionNoCompanion();
      return;
    }
    localStorage.setItem("cashtrack_selected_companion", id);
    localStorage.setItem("cashtrack_companion_visibility", "events");
    setSelectedCompanionId(id);
    setCompanionVisibility("events");
    setIsChangeCompanionOpen(false);
    showToast(`Companion switched to ${id === "custom" ? customCompanionName : "Waguri"}`);
    window.dispatchEvent(new Event("cashtrack_companion_settings_updated"));
    window.dispatchEvent(new Event("cashtrack_companion_updated"));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validFormats.includes(file.type)) {
      showToast("Unsupported image format");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5 MB");
      e.target.value = "";
      return;
    }

    setIsImageLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCropImage(event.target.result as string);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setIsCropOpen(true);
      }
      setIsImageLoading(false);
    };
    reader.onerror = () => {
      setIsImageLoading(false);
      showToast("Failed to load image");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number }
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    canvas.width = 300;
    canvas.height = 300;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      300,
      300
    );

    return canvas.toDataURL("image/png");
  };

  const handleCropConfirm = async () => {
    if (!cropImage || !croppedAreaPixels) return;

    setIsCropping(true);
    try {
      const croppedBase64 = await getCroppedImg(cropImage, croppedAreaPixels);
      localStorage.setItem("cashtrack_profile_pic", croppedBase64);
      window.dispatchEvent(new Event("cashtrack_profile_pic_updated"));
      showToast("Profile picture updated successfully!");
      setIsCropOpen(false);
      setCropImage(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to crop/save profile picture.");
    } finally {
      setIsCropping(false);
    }
  };

  // Settings states
  const [currency, setCurrency] = useState(() => localStorage.getItem("cashtrack_currency") || "₹");
  const [themeMode, setThemeMode] = useState<ThemeOption>(() => getStoredTheme());
  const [budgetLimit, setBudgetLimit] = useState(data ? String(data.monthlyBudget) : "15000");

  useEffect(() => {
    const handleThemeEvent = () => {
      setThemeMode(getStoredTheme());
    };
    window.addEventListener("cashtrack_theme_changed", handleThemeEvent);
    return () => window.removeEventListener("cashtrack_theme_changed", handleThemeEvent);
  }, []);
  const [savingBudget, setSavingBudget] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);

  const updateCompanionSetting = (key: string, value: string) => {
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event("cashtrack_companion_settings_updated"));
    window.dispatchEvent(new Event("cashtrack_companion_updated"));
  };

  // Save profile helper
  const handleSaveProfile = () => {
    const updated = {
      avatar: editAvatar,
      name: editName || "Anonymous Student",
      username: editUsername.startsWith("@") ? editUsername : `@${editUsername}` || "@student",
      email: editEmail || "student@cashtrack.in",
      bio: editBio || "B.Tech Student"
    };
    localStorage.setItem("cashtrack_profile", JSON.stringify(updated));
    setProfile(updated);
    setIsEditingProfile(false);
    setSaveProfileSuccess(true);
    setTimeout(() => setSaveProfileSuccess(false), 2000);
    onRefresh();
  };

  // Save budget limit helper
  const handleUpdateBudget = async () => {
    if (isNaN(Number(budgetLimit)) || Number(budgetLimit) <= 0) return;
    setSavingBudget(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyBudget: parseFloat(budgetLimit) })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingBudget(false);
    }
  };

  // Currency selection helper
  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    localStorage.setItem("cashtrack_currency", newCurr);
  };

  // Visual Theme Mode selection helper
  const handleThemeChange = (newTheme: ThemeOption) => {
    setThemeMode(newTheme);
    applyTheme(newTheme);
  };

  // Mock backup / restore trigger
  const [backupLogs, setBackupLogs] = useState<string[]>([]);
  const triggerBackup = () => {
    const dateStr = new Date().toLocaleTimeString();
    setBackupLogs(prev => [`[${dateStr}] Backup created successfully in secure index`, ...prev]);
  };
  const triggerRestore = () => {
    const dateStr = new Date().toLocaleTimeString();
    setBackupLogs(prev => [`[${dateStr}] Local state restored to latest snapshot`, ...prev]);
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-[3.5px] border-[#ECECEC] border-t-[#FF5CA8] rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#707070] animate-pulse">Syncing profile suite...</p>
      </div>
    );
  }

  const { totalSpend, monthlyBudget, streak, categorySummary, recentTransactions } = data;

  // Derive Report Statistics
  const incomeAllowance = monthlyBudget; // Allowance / Total Budget limit
  const remainingSavingsAmount = Math.max(incomeAllowance - totalSpend, 0);
  const topSpentCategory = [...categorySummary].sort((a, b) => b.amount - a.amount)[0] || { category: "None", amount: 0 };
  const highestSingleExpense = [...recentTransactions].sort((a, b) => b.amount - a.amount)[0] || { amount: 0, category: "None" };

  // Calculate best spending days
  const dailyMap: { [date: string]: number } = {};
  recentTransactions.forEach(tx => {
    dailyMap[tx.date] = (dailyMap[tx.date] || 0) + tx.amount;
  });
  const dailyList = Object.keys(dailyMap).map(date => ({ date, amount: dailyMap[date] }));
  const sortedDays = dailyList.sort((a, b) => a.amount - b.amount);
  const bestDay = sortedDays[0] || { date: "No Logs yet", amount: 0 };
  const worstDay = sortedDays[sortedDays.length - 1] || { date: "No Logs yet", amount: 0 };

  return (
    <>
      <PageLayout id="profile-viewport" className="space-y-6 animate-fadeIn">
        {/* Top Header */}
        <div className="space-y-1 py-2">
          <h1 className="text-xl font-black text-[#111111] dark:text-white tracking-tight">Account & Settings</h1>
          <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold leading-relaxed">Manage your profile, companions, and preferences.</p>
        </div>

        {/* 1. Large Profile Card with Premium Banner */}
      <div className="bg-[#1C2230] border border-[#31384A] rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.2)] relative">
        <div className="h-24 bg-[#232A3B] relative">
          <div className="absolute top-4 right-4 flex gap-1">
            <span className="text-[8px] font-black uppercase tracking-wider bg-[#171A23]/90 px-2.5 py-1 rounded-full border border-white/10 text-white shadow-sm">
              Level 4 Budgeteer
            </span>
          </div>
        </div>

        <div className="p-5 pt-0 space-y-4">
          <div className="flex justify-between items-end -mt-12 relative z-10">
            {/* Hidden Input File */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".png, .jpg, .jpeg, .webp"
              onChange={handleFileChange}
              className="hidden"
            />
            {/* Big Circular Profile Photo */}
            <div 
              onClick={triggerImagePicker}
              className="w-[100px] h-[100px] rounded-full bg-[#171A23] border-4 border-[#1C2230] flex items-center justify-center text-4xl shadow-md select-none relative group cursor-pointer overflow-hidden transition-colors duration-200 hover:scale-105"
            >
              {isImageLoading ? (
                <div className="absolute inset-0 bg-[#171A23]/80 flex items-center justify-center">
                  <div className="w-8 h-8 border-[3px] border-gray-700 border-t-[#FF5CA8] rounded-full animate-spin" />
                </div>
              ) : profilePic ? (
                <motion.img
                  key={profilePic}
                  src={profilePic}
                  alt="Profile"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-5xl">{profile.avatar}</span>
              )}

              {/* Camera icon button inside bottom-right of avatar */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerImagePicker();
                }}
                className="absolute bottom-1 right-1 w-7 h-7 bg-[#202534] hover:bg-[#171A23] border border-white/10 text-[#FF5CA8] hover:text-[#ff3c96] rounded-full flex items-center justify-center shadow-md cursor-pointer transition-colors active:scale-90 z-20"
                title="Change Photo"
              >
                <Camera size={13} strokeWidth={2.2} />
              </button>
            </div>
            
            <button
              onClick={() => {
                if (isEditingProfile) {
                  handleSaveProfile();
                } else {
                  setEditName(profile.name);
                  setEditUsername(profile.username);
                  setEditEmail(profile.email);
                  setEditBio(profile.bio);
                  setEditAvatar(profile.avatar);
                  setIsEditingProfile(true);
                }
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-[#FF5CA8] hover:text-[#ff3c96] transition-colors bg-[#FF5CA8]/10 border border-[#FF5CA8]/25 rounded-[12px] px-3.5 py-2 cursor-pointer active:scale-95 shadow-sm"
            >
              {isEditingProfile ? (
                <>
                  <Check size={13} /> Finish Editing
                </>
              ) : (
                <>
                  <Edit2 size={12} /> Edit Profile
                </>
              )}
            </button>
          </div>

          {/* Profile details or Editor */}
          {!isEditingProfile ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <h4 className="text-base font-black text-white leading-tight tracking-tight">{profile.name}</h4>
                  <ShieldCheck size={15} className="text-[#FF5CA8] fill-[#FF5CA8]/10" />
                </div>
                <p className="text-xs font-bold text-[#8B5CF6] font-mono">{profile.username}</p>
                <p className="text-[10px] text-[#C6CBD8] font-bold font-mono">{profile.email}</p>
                {profile.bio && (
                  <p className="text-xs text-[#C6CBD8] leading-relaxed italic font-medium mt-2 bg-[#171A23] p-3 rounded-xl border border-[#31384A]">
                    "{profile.bio}"
                  </p>
                )}
              </div>

              {/* Statistics Row Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-[#171A23] border border-[#31384A] rounded-xl p-3 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#8B93A7]">Current Streak</span>
                  <div className="text-base font-black text-white mt-1 flex items-center justify-center gap-1">
                    <Flame size={14} className="text-[#FF5CA8] fill-[#FF5CA8]" />
                    {streak.current_streak} days
                  </div>
                </div>
                <div className="bg-[#171A23] border border-[#31384A] rounded-xl p-3 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#8B93A7]">Longest Streak</span>
                  <div className="text-base font-black text-white mt-1 flex items-center justify-center gap-1">
                    <Award size={14} className="text-[#8B5CF6]" />
                    {streak.longest_streak} days
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-3 border-t border-[#31384A] animate-fadeIn">
              {/* Profile Photo Editor Section */}
              <div className="bg-[#171A23] border border-[#31384A] rounded-[20px] p-4 flex flex-col sm:flex-row items-center gap-4 animate-fadeIn">
                <div className="relative w-[100px] h-[100px] rounded-full bg-[#1C2230] border border-[#31384A] overflow-hidden flex items-center justify-center text-4xl shadow-inner shrink-0 select-none">
                  {isImageLoading ? (
                    <div className="absolute inset-0 bg-[#171A23]/80 flex items-center justify-center">
                      <div className="w-8 h-8 border-[3px] border-gray-700 border-t-[#FF5CA8] rounded-full animate-spin" />
                    </div>
                  ) : profilePic ? (
                    <motion.img
                      key={profilePic}
                      src={profilePic}
                      alt="Profile"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span>{editAvatar}</span>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={triggerImagePicker}
                      className="px-4 py-2 bg-[#202534] hover:bg-[#1C2230] border border-[#31384A] text-[#FF5CA8] font-bold text-xs rounded-[12px] shadow-sm transition-colors active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Camera size={13} /> Change Photo
                    </button>
                    {profilePic && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Are you sure you want to remove your profile photo?")) {
                            localStorage.removeItem("cashtrack_profile_pic");
                            window.dispatchEvent(new Event("cashtrack_profile_pic_updated"));
                            showToast("Profile photo removed");
                          }
                        }}
                        className="px-4 py-2 bg-[#202534] hover:bg-red-500/10 border border-[#31384A] text-[#EF4444] font-bold text-xs rounded-[12px] shadow-sm transition-colors active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 size={13} /> Remove Photo
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-[#C6CBD8] font-semibold text-center sm:text-left">
                    Accepts PNG, JPG, JPEG, WEBP up to 5 MB.
                  </p>
                </div>
              </div>

              <span className="text-[9px] font-black text-[#8B93A7] uppercase tracking-wider block">Live Avatar Selection</span>

              {/* Horizontal scroll of avatar choices */}
              <div className="flex gap-2.5 overflow-x-auto py-1.5 no-scrollbar">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setEditAvatar(av)}
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-2xl shrink-0 cursor-pointer border transition-colors ${
                      editAvatar === av 
                        ? "bg-[#FF5CA8]/20 border-[#FF5CA8] scale-110 shadow-sm" 
                        : "bg-[#171A23] border-[#31384A] hover:border-gray-500"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>

              {/* IOS Form inputs */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8B93A7] uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#171A23] border border-[#31384A] rounded-[14px] py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-[#FF5CA8] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8B93A7] uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-[#171A23] border border-[#31384A] rounded-[14px] py-3 px-4 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#FF5CA8] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8B93A7] uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-[#171A23] border border-[#31384A] rounded-[14px] py-3 px-4 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#FF5CA8] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8B93A7] uppercase tracking-wider">Bio / Motto</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={2}
                    className="w-full bg-[#171A23] border border-[#31384A] rounded-[14px] py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-[#FF5CA8] transition-colors leading-normal"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2.5 rounded-[12px] bg-[#171A23] border border-[#31384A] text-[#C6CBD8] text-xs font-bold hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-5 py-2.5 rounded-[12px] bg-[#FF5CA8] text-white text-xs font-black hover:bg-[#ff3c96] cursor-pointer shadow-md shadow-[#FF5CA8]/10"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {saveProfileSuccess && (
            <div className="p-3 bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold rounded-[14px] text-center">
              ✅ Profile settings updated in secure cache successfully!
            </div>
          )}
        </div>
      </div>

      {/* 2. Daily Streak Statistics Section */}
      <div className="bg-[#1C2230] border border-[#31384A] rounded-[20px] p-5 space-y-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FF5CA8]/10 text-[#FF5CA8] flex items-center justify-center">
            <Flame size={16} className="fill-[#FF5CA8]" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">
              Daily Streak & Mastery Metrics
            </h3>
            <p className="text-[10px] text-[#8B93A7] font-semibold">Your daily financial discipline stats</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Stat 1: Current Streak */}
          <motion.div whileHover={{ y: -2 }} className="bg-[#171A23] border border-[#31384A] rounded-[20px] p-4 flex flex-col items-center justify-center text-center gap-1.5 transition-colors">
            <div className="w-9 h-9 rounded-2xl bg-[#FF5CA8]/10 text-[#FF5CA8] flex items-center justify-center shadow-sm">
              <Flame size={18} className="fill-[#FF5CA8]" />
            </div>
            <div className="text-[14px] font-black text-white font-mono">{streakStats.current_streak} Days</div>
            <p className="text-[9px] font-bold text-[#8B93A7] uppercase tracking-wider">Current Streak</p>
          </motion.div>

          {/* Stat 2: Longest Streak */}
          <motion.div whileHover={{ y: -2 }} className="bg-[#171A23] border border-[#31384A] rounded-[20px] p-4 flex flex-col items-center justify-center text-center gap-1.5 transition-colors">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-sm">
              <Award size={18} strokeWidth={2.2} />
            </div>
            <div className="text-[14px] font-black text-white font-mono">{streakStats.longest_streak} Days</div>
            <p className="text-[9px] font-bold text-[#8B93A7] uppercase tracking-wider">Longest Streak</p>
          </motion.div>

          {/* Stat 3: Freeze Count */}
          <motion.div whileHover={{ y: -2 }} className="bg-[#171A23] border border-[#31384A] rounded-[20px] p-4 flex flex-col items-center justify-center text-center gap-1.5 transition-colors">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-sm">
              <ShieldCheck size={18} strokeWidth={2.2} />
            </div>
            <div className="text-[14px] font-black text-white font-mono">{streakStats.freeze_count} / 1</div>
            <p className="text-[9px] font-bold text-[#8B93A7] uppercase tracking-wider">Streak Freezes</p>
          </motion.div>

          {/* Stat 4: Completed Missions */}
          <motion.div whileHover={{ y: -2 }} className="bg-[#171A23] border border-[#31384A] rounded-[20px] p-4 flex flex-col items-center justify-center text-center gap-1.5 transition-colors">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-sm">
              <Check size={18} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-black text-white font-mono">{streakStats.completed_missions_count}</div>
            <p className="text-[9px] font-bold text-[#8B93A7] uppercase tracking-wider">Missions Done</p>
          </motion.div>

          {/* Stat 5: Streak XP */}
          <motion.div whileHover={{ y: -2 }} className="bg-[#171A23] border border-[#31384A] rounded-[20px] p-4 flex flex-col items-center justify-center text-center gap-1.5 transition-colors">
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-sm">
              <Zap size={18} strokeWidth={2.2} />
            </div>
            <div className="text-[14px] font-black text-purple-400 font-mono">+{streakStats.total_xp_earned} XP</div>
            <p className="text-[9px] font-bold text-[#8B93A7] uppercase tracking-wider">Streak XP Gained</p>
          </motion.div>

          {/* Stat 6: Streak Coins */}
          <motion.div whileHover={{ y: -2 }} className="bg-[#171A23] border border-[#31384A] rounded-[20px] p-4 flex flex-col items-center justify-center text-center gap-1.5 transition-colors">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-sm">
              <Coins size={18} strokeWidth={2.2} />
            </div>
            <div className="text-[14px] font-black text-amber-400 font-mono">+{streakStats.total_coins_earned} c</div>
            <p className="text-[9px] font-bold text-[#8B93A7] uppercase tracking-wider">Streak Coins</p>
          </motion.div>
        </div>

        {/* Milestones Achieved list */}
        <div className="space-y-2.5 pt-1">
          <span className="text-[9px] font-black uppercase tracking-wider text-[#8B93A7]">Milestones Map</span>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 3, label: "3 Days", color: "text-amber-500" },
              { value: 7, label: "7 Days", color: "text-blue-400" },
              { value: 14, label: "14 Days", color: "text-purple-400" },
              { value: 30, label: "30 Days", color: "text-emerald-400" },
              { value: 50, label: "50 Days", color: "text-[#FF5CA8]" },
              { value: 100, label: "100 Days", color: "text-amber-400" },
              { value: 365, label: "365 Days", color: "text-indigo-400" }
            ].map((m) => {
              const isUnlocked = streakStats.longest_streak >= m.value;
              return (
                <div
                  key={m.value}
                  className={`px-3 py-1.5 rounded-[12px] border text-[10px] font-black flex items-center gap-1.5 transition-colors ${
                    isUnlocked
                      ? "bg-amber-500/10 border-amber-500/25 text-white"
                      : "bg-[#171A23] border-[#31384A] text-[#8B93A7]/40"
                  }`}
                  title={`${m.value} Days Milestone`}
                >
                  <Award size={12} className={isUnlocked ? m.color : "opacity-30"} />
                  <span>{m.label}</span>
                  {isUnlocked && <span className="text-[8px] bg-amber-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-center">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Achievement Badges Container */}
      <div className="bg-[#1C2230] border border-[#31384A] rounded-[20px] p-5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Award size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">
              Unlocked Achievement Badges
            </h3>
            <p className="text-[10px] text-[#8B93A7] font-semibold">Financial milestones unlocked on CashTrack</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Badge 1 */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-[20px] border flex flex-col items-center justify-center text-center gap-2 transition-colors cursor-pointer ${
              recentTransactions.length > 0 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm" 
                : "bg-[#171A23] border-[#31384A] text-gray-500 opacity-60"
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${recentTransactions.length > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-gray-500"}`}>
              <Award size={20} />
            </div>
            <div>
              <div className="text-[11px] font-black text-white">First Week</div>
              <p className="text-[9px] font-bold text-[#C6CBD8] leading-tight mt-0.5">Logged first expense</p>
            </div>
          </motion.div>

          {/* Badge 2 */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-[20px] border flex flex-col items-center justify-center text-center gap-2 transition-colors cursor-pointer ${
              remainingSavingsAmount >= 10000 
                ? "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-sm" 
                : "bg-[#171A23] border-[#31384A] text-gray-500 opacity-60"
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${remainingSavingsAmount >= 10000 ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-gray-500"}`}>
              <PiggyBank size={20} />
            </div>
            <div>
              <div className="text-[11px] font-black text-white">Saved ₹10k</div>
              <p className="text-[9px] font-bold text-[#C6CBD8] leading-tight mt-0.5">Remaining cap &gt; ₹10k</p>
            </div>
          </motion.div>

          {/* Badge 3: 30 Day Streak */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-[20px] border flex flex-col items-center justify-center text-center gap-2 transition-colors cursor-pointer ${
              streakStats.longest_streak >= 30 || streak.current_streak >= 30
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-sm" 
                : "bg-[#171A23] border-[#31384A] text-gray-500 opacity-60"
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${streakStats.longest_streak >= 30 || streak.current_streak >= 30 ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-gray-500"}`}>
              <Flame size={20} className="fill-current" />
            </div>
            <div>
              <div className="text-[11px] font-black text-white">30 Day Streak</div>
              <p className="text-[9px] font-bold text-[#C6CBD8] leading-tight mt-0.5">30 logging days</p>
            </div>
          </motion.div>

          {/* Badge 4 */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-[20px] border flex flex-col items-center justify-center text-center gap-2 transition-colors cursor-pointer ${
              totalSpend <= monthlyBudget && recentTransactions.length > 0
                ? "bg-[#FF5CA8]/10 border-[#FF5CA8]/30 text-[#FF5CA8] shadow-sm" 
                : "bg-[#171A23] border-[#31384A] text-gray-500 opacity-60"
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${totalSpend <= monthlyBudget && recentTransactions.length > 0 ? "bg-[#FF5CA8]/20 text-[#FF5CA8]" : "bg-white/5 text-gray-500"}`}>
              <Target size={20} />
            </div>
            <div>
              <div className="text-[11px] font-black text-white">Under Budget</div>
              <p className="text-[9px] font-bold text-[#C6CBD8] leading-tight mt-0.5">Stayed disciplined</p>
            </div>
          </motion.div>

          {/* Badge 5: First Streak */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-[20px] border flex flex-col items-center justify-center text-center gap-2 transition-colors cursor-pointer ${
              streakStats.longest_streak >= 1 || unlockedAchievements.includes("first_streak")
                ? "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-sm" 
                : "bg-[#171A23] border-[#31384A] text-gray-500 opacity-60"
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${streakStats.longest_streak >= 1 || unlockedAchievements.includes("first_streak") ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-gray-500"}`}>
              <Zap size={20} />
            </div>
            <div>
              <div className="text-[11px] font-black text-white">First Streak</div>
              <p className="text-[9px] font-bold text-[#C6CBD8] leading-tight mt-0.5">Logged first day</p>
            </div>
          </motion.div>

          {/* Badge 6: 7-Day Saver */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-[20px] border flex flex-col items-center justify-center text-center gap-2 transition-colors cursor-pointer ${
              streakStats.longest_streak >= 7 || unlockedAchievements.includes("streak_7")
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-sm" 
                : "bg-[#171A23] border-[#31384A] text-gray-500 opacity-60"
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${streakStats.longest_streak >= 7 || unlockedAchievements.includes("streak_7") ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-gray-500"}`}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="text-[11px] font-black text-white">7-Day Saver</div>
              <p className="text-[9px] font-bold text-[#C6CBD8] leading-tight mt-0.5">7 days non-stop</p>
            </div>
          </motion.div>

          {/* Badge 7: 100-Day Master */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-[20px] border flex flex-col items-center justify-center text-center gap-2 transition-colors cursor-pointer ${
              streakStats.longest_streak >= 100 || unlockedAchievements.includes("streak_100")
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-sm" 
                : "bg-[#171A23] border-[#31384A] text-gray-500 opacity-60"
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${streakStats.longest_streak >= 100 || unlockedAchievements.includes("streak_100") ? "bg-rose-500/20 text-rose-400" : "bg-white/5 text-gray-500"}`}>
              <Award size={20} />
            </div>
            <div>
              <div className="text-[11px] font-black text-white">100-Day Master</div>
              <p className="text-[9px] font-bold text-[#C6CBD8] leading-tight mt-0.5">100 days of discipline</p>
            </div>
          </motion.div>

          {/* Badge 8: Year of Consistency */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-[20px] border flex flex-col items-center justify-center text-center gap-2 transition-colors cursor-pointer ${
              streakStats.longest_streak >= 365 || unlockedAchievements.includes("streak_365")
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm" 
                : "bg-[#171A23] border-[#31384A] text-gray-500 opacity-60"
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${streakStats.longest_streak >= 365 || unlockedAchievements.includes("streak_365") ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-gray-500"}`}>
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-[11px] font-black text-white">Year Master</div>
              <p className="text-[9px] font-bold text-[#C6CBD8] leading-tight mt-0.5">365-day legend</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3. Monthly Report Suite */}
      <div className="bg-[#1C2230] border border-[#31384A] rounded-[20px] p-5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-2">
          <PieChart size={16} className="text-[#8B5CF6]" />
          <h3 className="text-xs font-black uppercase tracking-widest text-white">
            Student Monthly Report
          </h3>
        </div>

        <div className="space-y-3.5">
          {/* Income Allowance */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#C6CBD8] font-bold">Income/Allowance</span>
            <span className="font-black text-white font-mono">{currency}{Math.round(incomeAllowance).toLocaleString("en-IN")}</span>
          </div>

          {/* Expenses */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#C6CBD8] font-bold">Expenses</span>
            <span className="font-black text-[#FF5CA8] font-mono">{currency}{Math.round(totalSpend).toLocaleString("en-IN")}</span>
          </div>

          {/* Savings */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#C6CBD8] font-bold">Derived Savings</span>
            <span className="font-black text-[#22C55E] font-mono">{currency}{Math.round(remainingSavingsAmount).toLocaleString("en-IN")}</span>
          </div>

          <div className="border-t border-[#31384A] pt-3 space-y-3">
            {/* Top Category */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#C6CBD8] font-bold">Top Category</span>
              <span className="font-black text-white truncate max-w-[150px]">
                {topSpentCategory.category.replace("Food ??", "") || "None"}
              </span>
            </div>

            {/* Highest Expense */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#C6CBD8] font-bold">Highest Outlay</span>
              <span className="font-black text-[#EF4444] font-mono">{currency}{Math.round(highestSingleExpense.amount).toLocaleString("en-IN")}</span>
            </div>

            {/* Best Spending Day */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#C6CBD8] font-bold">Best Spend Day</span>
              <span className="font-black text-[#22C55E] font-mono">{bestDay.date} ({currency}{bestDay.amount})</span>
            </div>

            {/* Worst Spending Day */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#C6CBD8] font-bold">Worst Spend Day</span>
              <span className="font-black text-[#EF4444] font-mono">{worstDay.date} ({currency}{worstDay.amount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Core System Preferences & Budget Config */}
      <div className="bg-[#1C2230] border border-[#31384A] rounded-[20px] p-5 space-y-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-2">
          <SettingsIcon size={16} className="text-[#8B93A7]" />
          <h3 className="text-xs font-black uppercase tracking-widest text-white">
            Theme & Settings
          </h3>
        </div>

        <div className="space-y-4">
          {/* Target Monthly Limit form */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#8B93A7]">Monthly Budget Limit</label>
            <div className="flex gap-2">
              <div className="relative flex items-center flex-1">
                <span className="absolute left-4 font-bold text-xs text-[#8B93A7] font-mono">{currency}</span>
                <input
                  type="number"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  className="w-full bg-[#171A23] border border-[#31384A] rounded-[14px] py-3 pl-8 pr-4 text-xs font-black text-white focus:outline-none focus:border-[#FF5CA8] transition-colors font-mono"
                />
              </div>
              <button
                onClick={handleUpdateBudget}
                disabled={savingBudget}
                className="bg-[#FF5CA8] hover:bg-[#ff3c96] text-white font-black px-5 rounded-[14px] text-xs transition-colors duration-150 active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
              >
                {savingBudget ? "Saving..." : "Update"}
              </button>
            </div>
          </div>

          {/* Currency Settings */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#8B93A7]">Local Currency Symbol</label>
            <div className="grid grid-cols-4 gap-2">
              {["₹", "$", "€", "£"].map((curr) => (
                <button
                  key={curr}
                  onClick={() => handleCurrencyChange(curr)}
                  className={`py-2.5 rounded-[14px] text-xs font-black border transition-colors ${
                    currency === curr 
                      ? "bg-[#FF5CA8] text-white border-[#FF5CA8] shadow-sm" 
                      : "bg-[#171A23] border-[#31384A] text-[#8B93A7] hover:bg-[#1D212D]"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* Theme selection toggle */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#8B93A7]">Visual App Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "light" as ThemeOption, label: "Light", icon: "☀️" },
                { id: "dark" as ThemeOption, label: "Dark Mode", icon: "🌙" },
                { id: "system" as ThemeOption, label: "System", icon: "🖥️" },
              ].map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => handleThemeChange(th.id)}
                  className={`py-2.5 px-2 rounded-[14px] text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    themeMode === th.id 
                      ? "bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm" 
                      : "bg-[#171A23] border-[#31384A] text-[#C6CBD8] hover:bg-[#1D212D]"
                  }`}
                >
                  <span>{th.icon}</span>
                  <span>{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notification settings switch */}
          <div className="flex items-center justify-between p-4 bg-[#171A23] border border-[#31384A] rounded-[18px]">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <BellRing size={14} className="text-[#FF5CA8]" /> Daily Log Reminders
              </span>
              <p className="text-[10px] text-[#8B93A7] font-medium">Keep yourself disciplined with gentle daily reminders.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsNotificationEnabled(!isNotificationEnabled)}
              className={`w-12 h-6 rounded-full transition-colors duration-200 ease-out relative cursor-pointer outline-none p-0.5 ${
                isNotificationEnabled 
                  ? "bg-[#FF5CA8] shadow-[0_0_15px_rgba(255,92,168,0.4)]" 
                  : "bg-[#2A3142]"
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-colors duration-200 ease-out transform ${
                isNotificationEnabled ? "translate-x-6" : "translate-x-0"
              }`} />
            </button>
          </div>

          {/* Companion (Optional) Settings Panel */}
          <div className="border-t border-[#31384A] pt-5 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-400" /> Companion (Optional)
                </h4>
                {/* Current Status Badge */}
                <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  selectedCompanionId === "disabled" || companionVisibility === "disabled"
                    ? "bg-[#171A23] text-[#8B93A7] border-[#31384A]"
                    : selectedCompanionId === "custom"
                    ? "bg-purple-950/40 text-purple-400 border-purple-800/50"
                    : "bg-pink-950/40 text-pink-400 border-pink-800/50"
                }`}>
                  Status: {
                    selectedCompanionId === "disabled" || companionVisibility === "disabled"
                      ? "Disabled"
                      : selectedCompanionId === "custom"
                      ? "Custom Companion"
                      : "Default (Waguri)"
                  }
                </span>
              </div>
              <p className="text-[10px] text-[#8B93A7] font-medium leading-relaxed">
                Choose a companion to celebrate achievements and motivate you.
              </p>
            </div>

            {/* If disabled display notice or companion cards */}
            {(selectedCompanionId === "disabled" || companionVisibility === "disabled") && (
              <div className="p-3.5 bg-[#171A23] border border-[#31384A] rounded-[16px] text-center text-xs font-medium text-[#8B93A7]">
                No companion selected
              </div>
            )}

            {/* Three Main Option Choices */}
            <div className="grid grid-cols-1 gap-2.5">
              {/* Option 1: No Companion (Default) */}
              <button
                type="button"
                onClick={selectOptionNoCompanion}
                className={`p-3.5 rounded-[18px] border text-left transition-colors flex items-center justify-between cursor-pointer ${
                  selectedCompanionId === "disabled" || companionVisibility === "disabled"
                    ? "bg-purple-600/10 border-purple-500 ring-1 ring-purple-500/30 shadow-sm"
                    : "bg-[#171A23] border-[#31384A] hover:border-gray-500"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-800/80 border border-gray-700/80 flex items-center justify-center text-gray-400 font-black text-xs">
                    <User size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">No Companion Selected</h5>
                    <p className="text-[10px] text-[#8B93A7] font-medium">Clean professional finance tracker mode. No narrator.</p>
                  </div>
                </div>
                {(selectedCompanionId === "disabled" || companionVisibility === "disabled") && (
                  <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Check size={11} strokeWidth={3} />
                  </div>
                )}
              </button>

              {/* Option 2: Default CashTrack Companion */}
              <button
                type="button"
                onClick={selectOptionDefaultCompanion}
                className={`p-3.5 rounded-[18px] border text-left transition-colors flex items-center justify-between cursor-pointer ${
                  selectedCompanionId === "waguri" && companionVisibility !== "disabled"
                    ? "bg-purple-600/10 border-purple-500 ring-1 ring-purple-500/30 shadow-sm"
                    : "bg-[#171A23] border-[#31384A] hover:border-gray-500"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-pink-950/40 border border-pink-800/40 flex items-center justify-center">
                    <Narrator size="icon" companionId="waguri" animation="none" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">Choose Companion (Waguri 🐹)</h5>
                    <p className="text-[10px] text-[#8B93A7] font-medium">Built-in mascot celebrations and savings tips.</p>
                  </div>
                </div>
                {selectedCompanionId === "waguri" && companionVisibility !== "disabled" && (
                  <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Check size={11} strokeWidth={3} />
                  </div>
                )}
              </button>

              {/* Option 3: Upload Your Own Companion */}
              <button
                type="button"
                onClick={selectOptionUploadCompanion}
                className={`p-3.5 rounded-[18px] border text-left transition-colors flex items-center justify-between cursor-pointer ${
                  selectedCompanionId === "custom" && companionVisibility !== "disabled"
                    ? "bg-purple-600/10 border-purple-500 ring-1 ring-purple-500/30 shadow-sm"
                    : "bg-[#171A23] border-[#31384A] hover:border-gray-500"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-950/40 border border-purple-800/40 flex items-center justify-center text-purple-400 font-bold overflow-hidden">
                    {customCompanionImg ? (
                      <img src={customCompanionImg} alt="Custom" className="w-full h-full object-contain p-1" />
                    ) : (
                      <UploadCloud size={18} />
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">
                      Upload Custom {customCompanionImg && `(${customCompanionName})`}
                    </h5>
                    <p className="text-[10px] text-[#8B93A7] font-medium">
                      {customCompanionImg ? "Custom PNG/JPG companion loaded." : "Upload PNG, JPG, or WebP character."}
                    </p>
                  </div>
                </div>
                {selectedCompanionId === "custom" && companionVisibility !== "disabled" && (
                  <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Check size={11} strokeWidth={3} />
                  </div>
                )}
              </button>
            </div>

            {/* Live Companion Interactive Preview Card (When Enabled) */}
            {selectedCompanionId !== "disabled" && companionVisibility !== "disabled" && (
              <div className="relative p-5 bg-[#171A23] border border-[#31384A] rounded-[20px] overflow-hidden shadow-inner space-y-4 flex flex-col items-center">
                <div className="flex flex-col items-center text-center space-y-0.5">
                  <span className="text-[8px] font-black uppercase tracking-wider text-purple-400 bg-purple-950/40 px-2.5 py-1 rounded-full border border-purple-800/40">
                    Active Companion Preview
                  </span>
                  <h5 className="text-sm font-black text-white tracking-tight pt-1">
                    {selectedCompanionId === "custom" ? customCompanionName : "Waguri 🐹"}
                  </h5>
                </div>

                <div className="w-32 h-32 flex items-center justify-center bg-[#1C2230] rounded-[18px] border border-[#31384A] shadow-inner p-2 relative">
                  <Narrator 
                    size="speech" 
                    animation={previewAnimation} 
                    companionId={selectedCompanionId} 
                  />
                </div>

                <div className="w-full space-y-1">
                  <label className="text-[9px] font-black text-[#8B93A7] uppercase tracking-wider text-center block">
                    Preview Animations
                  </label>
                  <div className="flex flex-wrap justify-center gap-1">
                    {(["float", "bounce", "wave", "blink", "jump"] as const).map((anim) => (
                      <button
                        key={anim}
                        type="button"
                        onClick={() => setPreviewAnimation(anim)}
                        className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                          previewAnimation === anim
                            ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                            : "bg-[#1C2230] border-[#31384A] text-[#C6CBD8] hover:border-purple-500"
                        }`}
                      >
                        {anim}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="w-full grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={selectOptionUploadCompanion}
                    className="bg-[#1C2230] hover:bg-purple-950/40 border border-purple-900/40 text-purple-400 py-3 rounded-xl text-[10px] font-black transition-colors flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Upload size={11} /> {customCompanionImg ? "Replace Companion" : "Upload Companion"}
                  </button>
                  <button
                    type="button"
                    onClick={selectOptionNoCompanion}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-200 py-3 rounded-xl text-[10px] font-black transition-colors flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <X size={11} /> Disable Companion
                  </button>
                </div>

                <div className="w-full flex justify-center gap-4 text-[9px] font-black uppercase tracking-wider text-[#8B93A7] pt-1 border-t border-[#31384A]">
                  <button 
                    type="button"
                    onClick={restoreDefaultWaguri}
                    className="hover:text-purple-400 transition-colors cursor-pointer"
                  >
                    Restore Default
                  </button>
                  {customCompanionImg && (
                    <button 
                      type="button"
                      onClick={deleteCustomCompanion}
                      className="hover:text-red-400 transition-colors text-red-400 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 size={9} /> Delete Custom
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Backup & Restore UI Panel */}
      <div className="bg-[#1C2230] border border-[#31384A] rounded-[20px] p-5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <h3 className="text-xs font-black uppercase tracking-widest text-white">
          Cloud Backup & Snapshot (UI only)
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={triggerBackup}
            className="bg-[#171A23] hover:bg-gray-800 border border-[#31384A] text-white py-3 rounded-[14px] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            Create Backup
          </button>
          <button
            type="button"
            onClick={triggerRestore}
            className="bg-[#171A23] hover:bg-gray-800 border border-[#31384A] text-white py-3 rounded-[14px] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            Restore snapshot
          </button>
        </div>

        {backupLogs.length > 0 && (
          <div className="bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-[16px] p-3 max-h-[100px] overflow-y-auto font-mono text-[9px] text-gray-500 dark:text-[#C6CBD8] space-y-1">
            {backupLogs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Professional About section */}
      <div className="text-center space-y-1 py-4">
        <h4 className="text-xs font-black tracking-tight text-[#111111] dark:text-[#FFFFFF] flex items-center justify-center gap-1">
          <Coins size={14} className="text-[#FF5CA8]" /> CashTrack Premium Suite
        </h4>
        <p className="text-[9px] font-bold text-[#707070] dark:text-[#8B93A7] uppercase tracking-widest">Version 2.4.0 (Student Build)</p>
        <p className="text-[10px] text-[#707070] dark:text-[#C6CBD8] font-medium leading-relaxed max-w-xs mx-auto">
          Crafted with 70/20/10 financial discipline targets. No AI slop or telemetry logs, purely premium offline-first data privacy.
        </p>
      </div>
    </PageLayout>

    {/* Toast Alert */}
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#111111]/90 text-white text-xs font-bold px-4 py-3 rounded-full border border-white/10 shadow-lg flex items-center gap-2"
        >
          <span>✅</span>
          <span>{toast}</span>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Image Crop Modal */}
    {isCropOpen && cropImage && (
      <div className="fixed inset-0 bg-[#111111]/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1D212D] rounded-[28px] w-full max-w-sm overflow-hidden border border-[#ECECEC] dark:border-white/10 shadow-2xl animate-scaleIn">
          {/* Header */}
          <div className="p-5 border-b border-[#ECECEC] dark:border-white/10 flex justify-between items-center bg-white dark:bg-[#1D212D]">
            <h3 className="text-sm font-black text-[#111111] dark:text-[#FFFFFF] uppercase tracking-widest">Crop Profile Photo</h3>
            <button
              onClick={() => {
                setIsCropOpen(false);
                setCropImage(null);
              }}
              className="w-8 h-8 rounded-full bg-[#F8F8FA] dark:bg-[#171A23] flex items-center justify-center text-[#707070] dark:text-[#C6CBD8] border border-[#ECECEC] dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Crop Area Container */}
          <div className="p-6 flex flex-col items-center space-y-6 bg-[#F8F8FA] dark:bg-[#171A23]">
            {/* react-easy-crop viewport */}
            <div className="relative w-[280px] h-[280px] bg-[#111111] rounded-[24px] overflow-hidden border border-black/10 dark:border-white/10 shadow-inner">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                classes={{
                  containerClassName: "rounded-[24px]",
                }}
              />
            </div>

            {/* Zoom Slider */}
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-[#707070] dark:text-[#8B93A7] uppercase tracking-wider">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-[#FF5CA8] h-1.5 bg-[#ECECEC] dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <p className="text-[10px] text-[#707070] dark:text-[#8B93A7] font-semibold text-center">
              Drag, pinch, or scroll to reposition and scale the image inside the circle.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-[#ECECEC] dark:border-white/10 flex gap-2 justify-end bg-white dark:bg-[#1D212D]">
            <button
              onClick={() => {
                setIsCropOpen(false);
                setCropImage(null);
              }}
              className="px-4 py-2.5 rounded-[14px] bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 text-[#707070] dark:text-[#C6CBD8] text-xs font-bold hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCropConfirm}
              disabled={isCropping}
              className="px-5 py-2.5 rounded-[14px] bg-[#FF5CA8] text-white text-xs font-black hover:bg-[#ff3c96] shadow-md shadow-[#FF5CA8]/10 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-55"
            >
              {isCropping ? "Cropping..." : "Apply Crop"}
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Change Companion Dialog Overlay */}
    {isChangeCompanionOpen && (
      <div className="fixed inset-0 bg-[#111111]/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1D212D] rounded-[28px] w-full max-w-sm overflow-hidden border border-[#ECECEC] dark:border-white/10 shadow-2xl animate-scaleIn p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-white/10">
            <h4 className="text-sm font-black text-gray-950 dark:text-[#FFFFFF] uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw size={14} className="text-purple-600 dark:text-purple-400" /> Switch Companion
            </h4>
            <button
              onClick={() => setIsChangeCompanionOpen(false)}
              className="w-8 h-8 rounded-full bg-gray-50 dark:bg-[#171A23] flex items-center justify-center text-gray-400 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-[10px] text-gray-500 dark:text-[#C6CBD8] font-semibold leading-normal">
            Choose the companion that will accompany you. Swapping companions will never change your personal profile picture.
          </p>

          <div className="grid grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
            {COMPANIONS_DATA.map((comp) => {
              const isSelected = selectedCompanionId === comp.id;
              return (
                <button
                  key={comp.id}
                  onClick={() => handleSelectCompanionId(comp.id)}
                  className={`p-3 rounded-2xl border text-center transition-colors flex flex-col items-center justify-center relative cursor-pointer outline-none ${
                    isSelected 
                      ? "bg-purple-600/5 dark:bg-purple-900/20 border-purple-600 ring-2 ring-purple-600/20 shadow-sm" 
                      : "bg-[#F8F8FA] dark:bg-[#171A23] border-[#ECECEC] dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                  }`}
                >
                  <div className="w-12 h-12 flex items-center justify-center mb-1">
                    <Narrator size="floating" animation={isSelected ? "bounce" : "none"} companionId={comp.id} />
                  </div>
                  <h6 className="text-[11px] font-black text-gray-900 dark:text-white">{comp.name} {comp.emoji}</h6>
                  <span className="text-[8px] font-bold text-gray-400 dark:text-[#8B93A7] uppercase tracking-wide">{comp.role}</span>

                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-purple-600 flex items-center justify-center text-white border border-white">
                      <Check size={8} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}

            {/* Custom Companion Option */}
            {customCompanionImg ? (
              <button
                onClick={() => handleSelectCompanionId("custom")}
                className={`p-3 rounded-2xl border text-center transition-colors flex flex-col items-center justify-center relative cursor-pointer outline-none ${
                  selectedCompanionId === "custom" 
                    ? "bg-purple-600/5 dark:bg-purple-900/20 border-purple-600 ring-2 ring-purple-600/20 shadow-sm" 
                    : "bg-[#F8F8FA] dark:bg-[#171A23] border-[#ECECEC] dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                }`}
              >
                <div className="w-12 h-12 flex items-center justify-center mb-1">
                  <img src={customCompanionImg} alt="Custom option" className="w-10 h-10 object-contain rounded-xl" />
                </div>
                <h6 className="text-[11px] font-black text-purple-600 dark:text-purple-400">{customCompanionName}</h6>
                <span className="text-[8px] font-bold text-gray-400 dark:text-[#8B93A7] uppercase tracking-wide">Custom Companion</span>

                {selectedCompanionId === "custom" && (
                  <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-purple-600 flex items-center justify-center text-white border border-white">
                    <Check size={8} strokeWidth={3} />
                  </div>
                )}
              </button>
            ) : (
              <div 
                onClick={() => {
                  setIsChangeCompanionOpen(false);
                  setIsCreateCompanionOpen(true);
                }}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-purple-200 dark:border-purple-800/40 bg-purple-50/20 dark:bg-purple-950/20 text-center min-h-[100px] cursor-pointer hover:bg-purple-50/40 dark:hover:bg-purple-950/40 transition-colors"
              >
                <Plus size={14} className="text-purple-600 dark:text-purple-400 mb-1" />
                <span className="text-[9px] font-black text-purple-600 dark:text-purple-400">Create Custom</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Create/Upload Custom Companion Dialog Overlay */}
    {isCreateCompanionOpen && (
      <div className="fixed inset-0 bg-[#111111]/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1D212D] rounded-[28px] w-full max-w-sm overflow-hidden border border-[#ECECEC] dark:border-white/10 shadow-2xl animate-scaleIn p-5 space-y-4">
          
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-white/10">
            <h4 className="text-sm font-black text-gray-950 dark:text-[#FFFFFF] uppercase tracking-wider flex items-center gap-1.5">
              <Camera size={14} className="text-purple-600 dark:text-purple-400" /> Upload Custom Companion
            </h4>
            <button
              onClick={() => {
                setIsCreateCompanionOpen(false);
                setSettingsImageSrc(null);
                setSettingsCroppedImage(null);
                setIsCompanionPreviewing(false);
              }}
              className="w-8 h-8 rounded-full bg-gray-50 dark:bg-[#171A23] flex items-center justify-center text-gray-400 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {!settingsImageSrc ? (
            <div 
              onClick={() => settingsFileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-200 dark:border-purple-800/40 hover:border-purple-400 bg-purple-50/5 dark:bg-purple-950/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-purple-50/20 dark:hover:bg-purple-950/30 transition-colors group"
            >
              <Upload size={24} className="text-purple-400 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-[11px] font-black text-purple-600 dark:text-purple-400 mt-2">Choose Image File</span>
              <p className="text-[9px] text-gray-400 dark:text-[#8B93A7] font-bold mt-1 max-w-[200px]">
                PNG, JPG, JPEG, WebP.<br />
                Recommended: 512?512 (Transparent PNG preferred).
              </p>
            </div>
          ) : !isCompanionPreviewing ? (
            /* Step 2: Crop & Zoom Adjustments */
            <div className="space-y-4 flex flex-col items-center w-full">
              <div className="text-[10px] font-bold text-gray-500 dark:text-[#C6CBD8] text-center">
                Drag to position and adjust zoom level to crop into a square:
              </div>

              <div 
                className="w-48 h-48 bg-gray-900 rounded-[24px] relative overflow-hidden border-2 border-purple-500 cursor-move select-none"
                onMouseDown={handleSettingsMouseDown}
                onMouseMove={handleSettingsMouseMove}
                onMouseUp={handleSettingsMouseUp}
                onTouchStart={handleSettingsTouchStart}
                onTouchMove={handleSettingsTouchMove}
                onTouchEnd={handleSettingsMouseUp}
              >
                <img 
                  src={settingsImageSrc} 
                  alt="Uploaded companion" 
                  className="max-w-none absolute pointer-events-none transition-transform" 
                  style={{
                    width: `${100 * settingsZoom}%`,
                    left: `calc(50% + ${settingsDragOffset.x}px)`,
                    top: `calc(50% + ${settingsDragOffset.y}px)`,
                    transform: "translate(-50%, -50%)"
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="w-full space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-[#C6CBD8]">
                  <span>Zoom Scale</span>
                  <span>{Math.round(settingsZoom * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={settingsZoom}
                  onChange={(e) => setSettingsZoom(parseFloat(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>

              <button
                onClick={() => {
                  performSettingsCrop();
                  setIsCompanionPreviewing(true);
                }}
                className="w-full py-3 rounded-xl text-xs font-black bg-purple-600 text-white hover:bg-purple-700 cursor-pointer shadow-md"
              >
                Preview Companion 👀              </button>
            </div>
          ) : (
            /* Step 3: Animated Preview Screen with Speech Bubble */
            <div className="space-y-4 flex flex-col items-center w-full animate-fadeIn">
              {/* Speech bubble */}
              <div className="bg-purple-50 dark:bg-purple-950/80 p-3 rounded-[20px] text-xs font-black text-purple-950 dark:text-purple-200 border border-purple-100 dark:border-purple-800/40 max-w-[260px] text-center relative animate-bounce shadow-sm">
                👋 "Hi! I'll be your CashTrack companion!"
                <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-pink-50 dark:bg-pink-950 border-r border-b border-purple-100 dark:border-purple-800/40" />
              </div>

              {/* Animated companion avatar */}
              <div className="w-36 h-36 bg-purple-50/50 dark:bg-purple-950/30 rounded-[28px] border border-purple-100 dark:border-purple-800/40 p-2 flex items-center justify-center relative shadow-inner">
                {settingsCroppedImage ? (
                  <img 
                    src={settingsCroppedImage} 
                    alt="Companion preview" 
                    className="w-28 h-28 object-contain rounded-2xl select-none"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <img 
                    src={settingsImageSrc} 
                    alt="Companion preview" 
                    className="w-28 h-28 object-contain rounded-2xl select-none"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Companion Name */}
              <div className="w-full">
                <label className="text-[9px] font-black text-gray-400 dark:text-[#8B93A7] uppercase tracking-wider block mb-1 text-center">
                  Name Your Companion
                </label>
                <input 
                  type="text"
                  value={settingsCustomName}
                  onChange={(e) => setSettingsCustomName(e.target.value.slice(0, 18))}
                  placeholder="My Companion"
                  className="w-full text-center px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-[#171A23] focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Action buttons required by spec: Use This Companion, Upload Another, Cancel */}
              <div className="space-y-2 w-full pt-1">
                <button
                  onClick={saveSettingsCustomCompanion}
                  className="w-full py-3 rounded-xl text-xs font-black bg-purple-600 text-white hover:bg-purple-700 cursor-pointer shadow-md active:scale-95 transition-colors"
                >
                  Use This Companion
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsCompanionPreviewing(false);
                      setSettingsImageSrc(null);
                      setSettingsCroppedImage(null);
                      settingsFileInputRef.current?.click();
                    }}
                    className="py-2.5 rounded-xl text-[10px] font-black border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 bg-white dark:bg-[#171A23] hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Upload Another
                  </button>
                  <button
                    onClick={() => {
                      setIsCreateCompanionOpen(false);
                      setIsCompanionPreviewing(false);
                      setSettingsImageSrc(null);
                      setSettingsCroppedImage(null);
                    }}
                    className="py-2.5 rounded-xl text-[10px] font-black border border-gray-200 dark:border-white/10 text-gray-400 dark:text-[#8B93A7] bg-white dark:bg-[#171A23] hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <input 
            type="file"
            ref={settingsFileInputRef}
            onChange={handleSettingsFileChange}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
          />

        </div>
      </div>
    )}

  </>
  );
}

export default React.memo(Profile);
