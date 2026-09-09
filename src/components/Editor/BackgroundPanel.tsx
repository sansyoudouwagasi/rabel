import React from 'react';
import { Palette, X } from 'lucide-react';

interface BackgroundPanelProps {
  currentBgColor: string;
  onSelectColor: (color: string) => void;
  onClose: () => void;
}

const BG_PRESETS = [
  { label: '白', value: '#ffffff' },
  { label: 'ベージュ', value: '#fdf6e2' },
  { label: '薄灰', value: '#f1f5f9' },
  { label: '薄赤', value: '#fff1f2' },
  { label: '薄青', value: '#f0f9ff' },
  { label: '薄緑', value: '#f0fdf4' },
  { label: '黒', value: '#1e293b' },
  { label: '赤', value: '#b91c1c' },
  { label: '紺', value: '#1e3a8a' },
  { label: '深緑', value: '#14532d' },
];

export const BackgroundPanel: React.FC<BackgroundPanelProps> = ({
  currentBgColor,
  onSelectColor,
  onClose,
}) => {
  return (
    <div className="bg-white p-3 border-t border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-700">背景色の設定</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {BG_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onSelectColor(preset.value)}
            className={`flex flex-col items-center gap-1 shrink-0 p-1 rounded-xl transition-all ${
              currentBgColor.toLowerCase() === preset.value.toLowerCase()
                ? 'bg-blue-50 ring-2 ring-blue-500'
                : 'hover:bg-slate-50'
            }`}
          >
            <div
              className="w-7 h-7 rounded-lg border border-slate-300 shadow-2xs"
              style={{ backgroundColor: preset.value }}
            />
            <span className="text-[10px] text-slate-600 font-medium">
              {preset.label}
            </span>
          </button>
        ))}

        {/* カラーピッカー */}
        <label className="flex flex-col items-center gap-1 shrink-0 p-1 rounded-xl cursor-pointer hover:bg-slate-50 relative">
          <div className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center bg-gradient-to-tr from-rose-400 via-amber-300 to-sky-400">
            <Palette className="w-4 h-4 text-white drop-shadow-xs" />
          </div>
          <span className="text-[10px] text-slate-600 font-medium">自由色</span>
          <input
            type="color"
            value={currentBgColor}
            onChange={(e) => onSelectColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
