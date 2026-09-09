import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  rightAction,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-xs">
      <div className="flex items-center min-w-10">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full text-slate-700 active:bg-slate-100 touch-manipulation"
            aria-label="戻る"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
      </div>

      <h1 className="text-base font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs text-center">
        {title}
      </h1>

      <div className="flex items-center justify-end min-w-10">
        {rightAction}
      </div>
    </header>
  );
};
