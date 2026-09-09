import React from 'react';
import * as fabric from 'fabric';
import { Palette, Minus, Plus } from 'lucide-react';

interface ShapePropertyPanelProps {
  shapeObject: fabric.FabricObject;
  onUpdate: () => void;
}

const PRESET_FILLS = [
  '#f1f5f9', // ライトグレー
  '#fecaca', // 薄赤
  '#fed7aa', // 薄オレンジ
  '#fef08a', // 薄黄
  '#bbf7d0', // 薄緑
  '#bfdbfe', // 薄青
  '#e9d5ff', // 薄紫
  '#ffffff', // 白
  'transparent', // 透明
];

const PRESET_STROKES = [
  '#000000',
  '#475569',
  '#dc2626',
  '#2563eb',
  '#16a34a',
  '#d97706',
  'transparent',
];

export const ShapePropertyPanel: React.FC<ShapePropertyPanelProps> = ({
  shapeObject,
  onUpdate,
}) => {
  const currentFill = (shapeObject.fill as string) || 'transparent';
  const currentStroke = (shapeObject.stroke as string) || '#000000';
  const currentStrokeWidth = Math.round(shapeObject.strokeWidth || 1);

  const handleFillChange = (fill: string) => {
    shapeObject.set('fill', fill);
    onUpdate();
  };

  const handleStrokeChange = (stroke: string) => {
    shapeObject.set('stroke', stroke);
    onUpdate();
  };

  const handleStrokeWidthDelta = (delta: number) => {
    const newWidth = Math.max(0, Math.min(20, currentStrokeWidth + delta));
    shapeObject.set('strokeWidth', newWidth);
    onUpdate();
  };

  return (
    <div className="bg-white p-3 border-t border-slate-200 space-y-3">
      {/* 塗りつぶし色 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-bold text-slate-500 shrink-0">塗りの色:</span>
        {PRESET_FILLS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handleFillChange(color)}
            className={`w-6 h-6 rounded-md shrink-0 border transition-all ${
              currentFill === color
                ? 'border-blue-600 ring-2 ring-blue-500/20 scale-110'
                : 'border-slate-300'
            }`}
            style={{
              backgroundColor: color === 'transparent' ? 'white' : color,
              backgroundImage:
                color === 'transparent'
                  ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                  : 'none',
              backgroundSize: '6px 6px',
            }}
            title={color === 'transparent' ? '透明' : color}
          />
        ))}

        {/* カラーピッカー */}
        <label className="w-6 h-6 rounded-md border border-slate-300 flex items-center justify-center bg-slate-100 cursor-pointer shrink-0 relative overflow-hidden">
          <Palette className="w-3.5 h-3.5 text-slate-600" />
          <input
            type="color"
            value={currentFill === 'transparent' ? '#ffffff' : currentFill}
            onChange={(e) => handleFillChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      </div>

      {/* 枠線の色と太さ */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 overflow-x-auto flex-1">
          <span className="text-[11px] font-bold text-slate-500 shrink-0">枠線の色:</span>
          {PRESET_STROKES.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleStrokeChange(color)}
              className={`w-6 h-6 rounded-md shrink-0 border transition-all ${
                currentStroke === color
                  ? 'border-blue-600 ring-2 ring-blue-500/20 scale-110'
                  : 'border-slate-300'
              }`}
              style={{
                backgroundColor: color === 'transparent' ? 'white' : color,
                backgroundImage:
                  color === 'transparent'
                    ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                    : 'none',
                backgroundSize: '6px 6px',
              }}
            />
          ))}
        </div>

        {/* 太さ */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[11px] font-bold text-slate-500">線幅:</span>
          <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 h-8 px-1">
            <button
              type="button"
              onClick={() => handleStrokeWidthDelta(-1)}
              className="w-6 h-6 flex items-center justify-center text-slate-700 hover:bg-white rounded-md active:scale-95"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-bold w-6 text-center text-slate-800">
              {currentStrokeWidth}
            </span>
            <button
              type="button"
              onClick={() => handleStrokeWidthDelta(1)}
              className="w-6 h-6 flex items-center justify-center text-slate-700 hover:bg-white rounded-md active:scale-95"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
