import type { ReactNode } from 'react';
import type { Screen } from '@/types';
import { BottomNavigation } from './BottomNavigation';
import { FloatingActionButton } from './FloatingActionButton';

interface GlobalLayoutProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onFabClick?: () => void;
  children: ReactNode;
}

/**
 * App-wide shell: fixed mobile-width frame, current screen content, the
 * floating action button, and the bottom tab bar. Screen switching is
 * plain React state passed down from `App.tsx` -- there is no router.
 */
export function GlobalLayout({
  activeScreen,
  onNavigate,
  onFabClick,
  children,
}: GlobalLayoutProps) {
  return (
    // `h-screen` (not `min-h-screen`) bounds this column to the viewport
    // height, so the ScreenContainer's `flex-1 overflow-y-auto` actually
    // scrolls its own content instead of growing the page -- otherwise the
    // bottom nav/FAB would get pushed below the fold on tall screens.
    <div className="h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-hidden sm:max-w-lg">
        {children}
        <FloatingActionButton onClick={onFabClick} />
        <BottomNavigation activeScreen={activeScreen} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
