import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
}

export function FloatingActionButton({
  onClick,
  className,
  'aria-label': ariaLabel = 'Add transaction',
}: FloatingActionButtonProps) {
  return (
    <div className={cn('absolute bottom-[22px] left-1/2 -translate-x-1/2 z-50', className)}>
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-[0_8px_16px_rgba(230,57,70,0.25)] transition-transform hover-elevate active-elevate-2 active:scale-[0.97]"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>
    </div>
  );
}
