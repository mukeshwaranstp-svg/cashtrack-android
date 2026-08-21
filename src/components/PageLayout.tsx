import React from "react";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  isFullScreen?: boolean;
  px?: boolean;
}

export default function PageLayout({ 
  children, 
  className = "", 
  id, 
  isFullScreen = false, 
  px = false 
}: PageLayoutProps) {
  // Use 150px bottom padding to guarantee that the last element/card scrolls completely
  // above the 80px high fixed navigation bar (which is offset by 24px from bottom = 104px total height).
  // This satisfies the 120-140px requirement with safe-area.
  const bottomPaddingClass = isFullScreen
    ? "pb-[max(140px,calc(140px+env(safe-area-inset-bottom)))]"
    : "pb-[max(150px,calc(150px+env(safe-area-inset-bottom)))]";

  // Full screen pages need top safe area spacing, regular pages already inherit from App.tsx viewport
  const topPaddingClass = isFullScreen
    ? "pt-[max(24px,env(safe-area-inset-top))]"
    : "pt-4";

  return (
    <div
      id={id}
      className={`w-full flex flex-col ${px ? "px-6" : ""} ${topPaddingClass} ${bottomPaddingClass} ${className}`}
    >
      {children}
    </div>
  );
}
