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
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-3 sm:px-4 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-xs shrink-0 w-full">
      <div className="flex items-center min-w-8 sm:min-w-10 shrink-0">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 -ml-1 sm:-ml-2 rounded-full text-slate-700 active:bg-slate-100 touch-manipulation"
            aria-label="戻る"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {title ? (
        <h1 className="text-base font-bold text-slate-900 truncate max-w-[160px] sm:max-w-xs text-center px-1">
          {title}
        </h1>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex items-center justify-end min-w-8 sm:min-w-10 shrink-0">
        {rightAction}
      </div>
    </header>
  );
};
