import React from 'react';
import * as fabric from 'fabric';
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  AlignCenter,
  Rotate3d,
} from 'lucide-react';

interface ImagePropertyPanelProps {
  imageObject: fabric.FabricImage;
  canvas: fabric.Canvas | null;
  onUpdate: () => void;
}

export const ImagePropertyPanel: React.FC<ImagePropertyPanelProps> = ({
  imageObject,
  canvas,
  onUpdate,
}) => {
  const currentAngle = Math.round(imageObject.angle || 0) % 360;
  const isFlippedX = Boolean(imageObject.flipX);
  const isFlippedY = Boolean(imageObject.flipY);

  // 90度時計回り回転
  const handleRotateCw = () => {
    const newAngle = (Math.round(imageObject.angle || 0) + 90) % 360;
    imageObject.set('angle', newAngle);
    imageObject.setCoords();
    onUpdate();
  };

  // 90度反時計回り回転
  const handleRotateCcw = () => {
    const newAngle = (Math.round(imageObject.angle || 0) - 90 + 360) % 360;
    imageObject.set('angle', newAngle);
    imageObject.setCoords();
    onUpdate();
  };

  // 180度回転 (上下逆さま解消)
  const handleRotate180 = () => {
    const newAngle = (Math.round(imageObject.angle || 0) + 180) % 360;
    imageObject.set('angle', newAngle);
    imageObject.setCoords();
    onUpdate();
  };

  // 左右反転
  const handleFlipX = () => {
    imageObject.set('flipX', !isFlippedX);
    imageObject.setCoords();
    onUpdate();
  };

  // 上下反転
  const handleFlipY = () => {
    imageObject.set('flipY', !isFlippedY);
    imageObject.setCoords();
    onUpdate();
  };

  // 中央配置
  const handleCenter = () => {
    if (!canvas) return;
    const canvasW = canvas.width || 400;
    const canvasH = canvas.height || 300;
    imageObject.set({
      left: canvasW / 2,
      top: canvasH / 2,
    });
    imageObject.setCoords();
    onUpdate();
  };

  // 回転・反転リセット
  const handleReset = () => {
    imageObject.set({
      angle: 0,
      flipX: false,
      flipY: false,
    });
    imageObject.setCoords();
    onUpdate();
  };

  return (
    <div className="bg-white p-3 border-t border-slate-200 space-y-2.5 animate-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span>写真・画像の向きと配置</span>
          {currentAngle !== 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
              {currentAngle}°
            </span>
          )}
          {(isFlippedX || isFlippedY) && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              反転中
            </span>
          )}
        </span>

        {/* リセットボタン */}
        {(currentAngle !== 0 || isFlippedX || isFlippedY) && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-100 active:scale-95"
          >
            <Rotate3d className="w-3.5 h-3.5" />
            <span>向きをリセット</span>
          </button>
        )}
      </div>

      {/* 回転・反転ボタン群 */}
      <div className="grid grid-cols-5 gap-1.5">
        {/* 右90° */}
        <button
          type="button"
          onClick={handleRotateCw}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 border border-slate-200 active:scale-95 transition-all"
          title="右に90度回転"
        >
          <RotateCw className="w-4 h-4 mb-1" />
          <span className="text-[10px] font-bold leading-tight">右90°</span>
        </button>

        {/* 左90° */}
        <button
          type="button"
          onClick={handleRotateCcw}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 border border-slate-200 active:scale-95 transition-all"
          title="左に90度回転"
        >
          <RotateCcw className="w-4 h-4 mb-1" />
          <span className="text-[10px] font-bold leading-tight">左90°</span>
        </button>

        {/* 180°回転 (逆さま解消) */}
        <button
          type="button"
          onClick={handleRotate180}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 active:scale-95 transition-all font-bold"
          title="上下逆さまを解消（180度回転）"
        >
          <RotateCw className="w-4 h-4 mb-1 rotate-180" />
          <span className="text-[10px] font-bold leading-tight">180°回転</span>
        </button>

        {/* 左右反転 */}
        <button
          type="button"
          onClick={handleFlipX}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border active:scale-95 transition-all ${
            isFlippedX
              ? 'bg-blue-600 text-white border-blue-600 font-bold'
              : 'bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 border-slate-200'
          }`}
          title="左右反転（水平反転）"
        >
          <FlipHorizontal className="w-4 h-4 mb-1" />
          <span className="text-[10px] font-bold leading-tight">左右反転</span>
        </button>

        {/* 上下反転 */}
        <button
          type="button"
          onClick={handleFlipY}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border active:scale-95 transition-all ${
            isFlippedY
              ? 'bg-blue-600 text-white border-blue-600 font-bold'
              : 'bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 border-slate-200'
          }`}
          title="上下反転（垂直反転）"
        >
          <FlipVertical className="w-4 h-4 mb-1" />
          <span className="text-[10px] font-bold leading-tight">上下反転</span>
        </button>
      </div>

      {/* サブ操作行: 中央配置 */}
      <div className="flex items-center justify-end pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={handleCenter}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold active:scale-95 transition-colors"
        >
          <AlignCenter className="w-3.5 h-3.5" />
          <span>キャンバス中央に配置</span>
        </button>
      </div>
    </div>
  );
};
