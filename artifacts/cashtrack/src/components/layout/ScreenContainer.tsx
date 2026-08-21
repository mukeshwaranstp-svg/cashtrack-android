import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ScreenContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a single screen's content. Handles its own vertical scrolling and
 * padding so screens don't need to repeat layout boilerplate. Bottom
 * padding leaves room for the fixed bottom navigation + FAB rendered by
 * `GlobalLayout`.
 */
export function ScreenContainer({ children, className }: ScreenContainerProps) {
  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto px-6 pt-10 pb-28 sm:px-8',
        className,
      )}
    >
      <div className="flex flex-col gap-8">{children}</div>
    </div>
  );
}
