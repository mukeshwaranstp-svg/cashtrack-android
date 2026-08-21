import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Home, BarChart2, Sliders, User, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Dashboard from "./components/Dashboard";
import Analysis from "./components/Analysis";
import Tools from "./components/Tools";
import Profile from "./components/Profile";
import AddExpenseModal from "./components/AddExpenseModal";
import StreakMilestoneModal from "./components/StreakMilestoneModal";
import Mascot from "./components/Mascot";
import CompanionOnboarding from "./components/CompanionOnboarding";
import { SummaryData, Streak } from "./types";
import { syncAndMigrate, flushSync, beaconFlush } from "./lib/sync";

const StreakCenter = lazy(() => import("./components/StreakCenter"));

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState(() => localStorage.getItem("cashtrack_companion_onboarded") === "true");
  const [activeTab, setActiveTab] = useState<"home" | "analysis" | "tools" | "profile">("home");
  const [isStreakScreenOpen, setIsStreakScreenOpen] = useState(false);
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncDone, setSyncDone] = useState(false);

  // Profile picture state for nav sync
  const [profilePic, setProfilePic] = useState<string | null>(() => localStorage.getItem("cashtrack_profile_pic"));

  // 60 FPS Scroll Performance Listener
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null;
    let rAFId: number | null = null;

    const mainEl = document.querySelector("main");

    const handleScroll = () => {
      if (rAFId !== null) return;
      rAFId = requestAnimationFrame(() => {
        rAFId = null;
        if (!document.body.classList.contains("is-scrolling")) {
          document.body.classList.add("is-scrolling");
        }
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          document.body.classList.remove("is-scrolling");
        }, 150);
      });
    };

    mainEl?.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      mainEl?.removeEventListener("scroll", handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (rAFId !== null) cancelAnimationFrame(rAFId);
    };
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setProfilePic(localStorage.getItem("cashtrack_profile_pic"));
    };
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<"home" | "analysis" | "tools" | "profile">;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    const handleOpenAdd = () => {
      setIsAddOpen(true);
    };

    window.addEventListener("cashtrack_profile_pic_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("cashtrack_navigate" as any, handleNavigate);
    window.addEventListener("cashtrack_open_add_expense", handleOpenAdd);

    return () => {
      window.removeEventListener("cashtrack_profile_pic_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("cashtrack_navigate" as any, handleNavigate);
      window.removeEventListener("cashtrack_open_add_expense", handleOpenAdd);
    };
  }, []);

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isMilestoneOpen, setIsMilestoneOpen] = useState(false);
  const [milestoneValue, setMilestoneValue] = useState(0);

  const fetchSummaryData = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    let attempts = 0;
    const maxAttempts = 5;
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    while (attempts < maxAttempts) {
      try {
        const res = await fetch(`/api/summary?today=${today}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setLoading(false);
          return;
        } else {
          console.warn(`Fetch summary metrics returned status ${res.status}. Retrying...`);
        }
      } catch (e) {
        console.error(`Attempt ${attempts + 1} to fetch summary metrics failed:`, e);
      }
      attempts++;
      if (attempts < maxAttempts) {
        await delay(500 * attempts);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  // Startup sync + one-time localStorage -> cloud migration. The app render
  // waits on syncDone so every component reads fresh (cloud-hydrated) state.
  useEffect(() => {
    let cancelled = false;
    syncAndMigrate()
      .catch((e) => console.warn("CashTrack initial sync failed:", e))
      .finally(() => {
        if (!cancelled) {
          setIsOnboarded(localStorage.getItem("cashtrack_companion_onboarded") === "true");
          setSyncDone(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Periodic + unload flushing so local changes reach the cloud.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") flushSync();
    }, 30000);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushSync();
    };
    const onUnload = () => beaconFlush();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onUnload);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onUnload);
    };
  }, []);

  const handleOpenAddExpense = useCallback(() => setIsAddOpen(true), []);
  const handleOpenStreakCenter = useCallback(() => setIsStreakScreenOpen(true), []);
  const handleNavigateTab = useCallback((tab: "home" | "analysis" | "tools" | "profile") => setActiveTab(tab), []);
  const handleCloseStreakCenter = useCallback(() => setIsStreakScreenOpen(false), []);
  const handleCloseAddModal = useCallback(() => setIsAddOpen(false), []);
  const handleCloseMilestoneModal = useCallback(() => setIsMilestoneOpen(false), []);

  useEffect(() => {
    if (data) {
      const isOver = data.totalSpend > data.monthlyBudget;
      const budgetTriggered = sessionStorage.getItem("cashtrack_budget_status_triggered");
      
      if (!budgetTriggered) {
        sessionStorage.setItem("cashtrack_budget_status_triggered", "true");
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("cashtrack_companion_trigger", {
            detail: { type: isOver ? "exceed_budget" : "under_budget" }
          }));
        }, 2000);
      }
    }
  }, [data]);

  const handleAddExpenseSuccess = (updatedStreak: Streak, milestoneReached: boolean, milestoneVal: number) => {
    const hasLoggedBefore = localStorage.getItem("cashtrack_first_expense_logged");
    
    fetchSummaryData();
    
    if (milestoneReached) {
      setMilestoneValue(milestoneVal);
      setIsMilestoneOpen(true);
    }

    setTimeout(() => {
      if (updatedStreak.current_streak % 7 === 0 && updatedStreak.current_streak > 0) {
        window.dispatchEvent(new CustomEvent("cashtrack_companion_trigger", { detail: { type: "streak_7" } }));
      } else if (!hasLoggedBefore) {
        localStorage.setItem("cashtrack_first_expense_logged", "true");
        window.dispatchEvent(new CustomEvent("cashtrack_companion_trigger", { detail: { type: "log_expense" } }));
      } else {
        window.dispatchEvent(new CustomEvent("cashtrack_companion_trigger", { detail: { type: "log_expense" } }));
      }
    }, 800);
  };

  if (!syncDone) {
    return (
      <div className="min-h-dvh bg-[#F8F8FA] dark:bg-[#0F1117] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 border-[3.5px] border-[#ECECEC] dark:border-white/10 border-t-[#FF5CA8] rounded-full animate-spin" />
            <div className="absolute w-6 h-6 bg-[#FF5CA8]/10 rounded-full animate-ping" />
          </div>
          <p className="text-xs font-semibold text-[#707070] dark:text-[#8B93A7] tracking-wide animate-pulse">Syncing premium ledger...</p>
        </div>
      </div>
    );
  }

  if (!isOnboarded) {
    return <CompanionOnboarding onComplete={() => setIsOnboarded(true)} />;
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#F8F8FA] dark:bg-[#0F1117] text-[#111111] dark:text-[#FFFFFF] flex flex-col items-center selection:bg-[#FF5CA8]/15 selection:text-[#FF5CA8] w-full transition-colors duration-300">
      {/* Centered viewport container */}
      <div className={`w-full max-w-lg h-dvh overflow-hidden bg-[#F8F8FA] dark:bg-[#0F1117] flex flex-col justify-between px-6 pt-2 relative transition-colors duration-300 ${
        isStreakScreenOpen ? "fixed inset-0 overflow-hidden pointer-events-none opacity-0 select-none" : ""
      }`}>
        
        {/* Main viewport area */}
        <main className="flex-1 min-h-0 overflow-y-auto scroll-container overscroll-contain">          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[80dvh] space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 border-[3.5px] border-[#ECECEC] dark:border-white/10 border-t-[#FF5CA8] rounded-full animate-spin" />
                <div className="absolute w-6 h-6 bg-[#FF5CA8]/10 rounded-full animate-ping" />
              </div>
              <p className="text-xs font-semibold text-[#707070] dark:text-[#8B93A7] tracking-wide animate-pulse">Syncing premium ledger...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                {activeTab === "home" && (
                  <Dashboard
                    data={data}
                    onRefresh={fetchSummaryData}
                    onOpenAddExpense={handleOpenAddExpense}
                    onNavigate={handleNavigateTab}
                    onOpenStreakCenter={handleOpenStreakCenter}
                  />
                )}
                {activeTab === "analysis" && (
                  <Analysis data={data} onRefresh={fetchSummaryData} />
                )}
                {activeTab === "tools" && (
                  <Tools 
                    data={data} 
                    onRefresh={fetchSummaryData} 
                    onOpenAddExpense={handleOpenAddExpense}
                    onNavigate={handleNavigateTab}
                  />
                )}
                {activeTab === "profile" && (
                  <Profile data={data} onRefresh={fetchSummaryData} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* ================= FIXED FLOATING NAVIGATION BAR ================= */}
        <nav className="fixed bottom-6 left-6 right-6 max-w-[calc(100%-3rem)] md:max-w-[400px] mx-auto h-20 bg-white dark:bg-[#171A23] border border-[#ECECEC]/80 dark:border-white/10 rounded-[32px] flex justify-around items-center px-4 z-40 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-colors duration-300">
          {/* Tab 1: Home */}
          <button
            onClick={() => handleNavigateTab("home")}
            className="flex flex-col items-center justify-center w-12 h-12 relative cursor-pointer group outline-none"
            title="Dashboard"
          >
            <Home 
              size={20} 
              className={`transition-colors duration-300 relative z-10 ${
                activeTab === "home" ? "text-[#FF5CA8] scale-110" : "text-[#707070] dark:text-[#8B93A7] group-hover:text-[#111111] dark:group-hover:text-white"
              }`} 
              strokeWidth={activeTab === "home" ? 2.2 : 1.8}
            />
            {activeTab === "home" && (
              <motion.span 
                layoutId="active-indicator"
                className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#FF5CA8]"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
          </button>

          {/* Tab 2: Analysis */}
          <button
            onClick={() => handleNavigateTab("analysis")}
            className="flex flex-col items-center justify-center w-12 h-12 relative cursor-pointer group outline-none"
            title="Analysis"
          >
            <BarChart2 
              size={20} 
              className={`transition-colors duration-300 relative z-10 ${
                activeTab === "analysis" ? "text-[#FF5CA8] scale-110" : "text-[#707070] dark:text-[#8B93A7] group-hover:text-[#111111] dark:group-hover:text-white"
              }`} 
              strokeWidth={activeTab === "analysis" ? 2.2 : 1.8}
            />
            {activeTab === "analysis" && (
              <motion.span 
                layoutId="active-indicator"
                className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#FF5CA8]"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
          </button>

          {/* Center Floating Action Button (FAB) slot */}
          <div className="relative -top-5 flex justify-center items-center w-16">
            <button
              onClick={handleOpenAddExpense}
              className="w-14 h-14 bg-[#FF5CA8] hover:bg-[#ff4497] text-white rounded-full flex items-center justify-center shadow-[0_10px_24px_rgba(255,92,168,0.35)] border-4 border-[#F8F8FA] dark:border-[#0F1117] transition-colors duration-300 active:scale-90 cursor-pointer outline-none"
              title="Add Expense"
            >
              <Plus size={26} strokeWidth={2.5} />
            </button>
          </div>

          {/* Tab 3: Tools */}
          <button
            onClick={() => handleNavigateTab("tools")}
            className="flex flex-col items-center justify-center w-12 h-12 relative cursor-pointer group outline-none"
            title="Tools"
          >
            <Sliders 
              size={20} 
              className={`transition-colors duration-300 relative z-10 ${
                activeTab === "tools" ? "text-[#FF5CA8] scale-110" : "text-[#707070] dark:text-[#8B93A7] group-hover:text-[#111111] dark:group-hover:text-white"
              }`} 
              strokeWidth={activeTab === "tools" ? 2.2 : 1.8}
            />
            {activeTab === "tools" && (
              <motion.span 
                layoutId="active-indicator"
                className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#FF5CA8]"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
          </button>

          {/* Tab 4: Profile */}
          <button
            onClick={() => handleNavigateTab("profile")}
            className="flex flex-col items-center justify-center w-12 h-12 relative cursor-pointer group outline-none"
            title="Profile & Settings"
          >
            {profilePic ? (
              <div className={`w-6 h-6 rounded-full border-2 transition-colors duration-300 relative z-10 overflow-hidden ${
                activeTab === "profile" ? "border-[#FF5CA8] scale-110" : "border-[#707070] dark:border-[#8B93A7] group-hover:border-[#111111] dark:group-hover:border-white"
              }`}>
                <motion.img
                  key={profilePic}
                  src={profilePic}
                  alt="Profile"
                  loading="lazy"
                  width={24}
                  height={24}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            ) : (
              <User 
                size={20} 
                className={`transition-colors duration-300 relative z-10 ${
                  activeTab === "profile" ? "text-[#FF5CA8] scale-110" : "text-[#707070] dark:text-[#8B93A7] group-hover:text-[#111111] dark:group-hover:text-white"
                }`} 
                strokeWidth={activeTab === "profile" ? 2.2 : 1.8}
              />
            )}
            {activeTab === "profile" && (
              <motion.span 
                layoutId="active-indicator"
                className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#FF5CA8]"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
          </button>
        </nav>
      </div>

      {/* Streak Center Screen */}
      <AnimatePresence>
        {isStreakScreenOpen && (
          <Suspense fallback={
            <div className="fixed inset-0 bg-[#F8F8FA] z-50 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#ECECEC] border-t-[#FF5CA8] rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase text-[#707070] tracking-wider font-sans">Opening Streak Center...</p>
            </div>
          }>
            <StreakCenter
              onClose={() => setIsStreakScreenOpen(false)}
              onRefresh={fetchSummaryData}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Overlays / Bottom Sheet Modals */}
      <AddExpenseModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleAddExpenseSuccess}
      />

      <StreakMilestoneModal
        isOpen={isMilestoneOpen}
        onClose={() => setIsMilestoneOpen(false)}
        milestoneValue={milestoneValue}
      />



    </div>
  );
}
