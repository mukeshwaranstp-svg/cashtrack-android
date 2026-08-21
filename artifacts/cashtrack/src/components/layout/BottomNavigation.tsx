import { BarChart3, Home, Settings, Wrench } from 'lucide-react';
import type { Screen } from '@/types';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const NAV_ITEMS: { screen: Screen; label: string; icon: typeof Home }[] = [
  { screen: 'home', label: 'Home', icon: Home },
  { screen: 'analysis', label: 'Analysis', icon: BarChart3 },
  { screen: 'tools', label: 'Tools', icon: Wrench },
  { screen: 'settings', label: 'Settings', icon: Settings },
];

export function BottomNavigation({ activeScreen, onNavigate }: BottomNavigationProps) {
  const leftItems = NAV_ITEMS.slice(0, 2);
  const rightItems = NAV_ITEMS.slice(2);

  const renderItem = ({ screen, label, icon: Icon }: typeof NAV_ITEMS[0]) => {
    const isActive = screen === activeScreen;
    return (
      <button
        key={screen}
        type="button"
        onClick={() => onNavigate(screen)}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-bold tracking-wide transition-colors hover-elevate active-elevate-2',
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Icon className="h-5 w-5 mb-0.5" strokeWidth={isActive ? 2.25 : 1.75} />
        {label}
      </button>
    );
  };

  return (
    <nav className="border-t border-border bg-card relative z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-center justify-between px-2 h-[68px] sm:max-w-lg">
        <div className="flex flex-1 justify-evenly">
          {leftItems.map(renderItem)}
        </div>
        <div className="w-20 shrink-0" aria-hidden="true" />
        <div className="flex flex-1 justify-evenly">
          {rightItems.map(renderItem)}
        </div>
      </div>
    </nav>
  );
}
