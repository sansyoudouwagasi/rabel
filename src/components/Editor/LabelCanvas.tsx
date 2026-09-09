import React, { useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import { mmToPx } from '../../utils/unitConversion';
import type { LabelSize } from '../../types/label';

interface LabelCanvasProps {
  size: LabelSize;
  backgroundColor: string;
  onCanvasReady: (canvas: fabric.Canvas) => void;
  onSelectionChange?: (selectedObject: fabric.FabricObject | null) => void;
  onObjectModified?: () => void;
}

export const LabelCanvas: React.FC<LabelCanvasProps> = ({
  size,
  backgroundColor,
  onCanvasReady,
  onSelectionChange,
  onObjectModified,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  // 内部実寸サイズ (300 DPI)
  const internalWidth = mmToPx(size.width);
  const internalHeight = mmToPx(size.height);

  useEffect(() => {
    if (!canvasElRef.current || !containerRef.current) return;

    // Fabric Canvas初期化
    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: internalWidth,
      height: internalHeight,
      backgroundColor: backgroundColor || '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;

    // スケール調整関数
    const updateScale = () => {
      if (!containerRef.current || !canvas) return;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      // 余白
      const padding = 20;
      const availableW = Math.max(containerWidth - padding * 2, 100);
      const availableH = Math.max(containerHeight - padding * 2, 100);

      const scaleX = availableW / internalWidth;
      const scaleY = availableH / internalHeight;
      const zoom = Math.min(scaleX, scaleY, 1.2); // 最大1.2倍まで

      const displayW = Math.round(internalWidth * zoom);
      const displayH = Math.round(internalHeight * zoom);

      canvas.setDimensions({ width: displayW, height: displayH });
      canvas.setZoom(zoom);
      canvas.renderAll();
    };

    updateScale();
    window.addEventListener('resize', updateScale);

    // イベントリスナー
    canvas.on('selection:created', (e) => {
      onSelectionChange?.(e.selected ? e.selected[0] : null);
    });
    canvas.on('selection:updated', (e) => {
      onSelectionChange?.(e.selected ? e.selected[0] : null);
    });
    canvas.on('selection:cleared', () => {
      onSelectionChange?.(null);
    });
    canvas.on('object:modified', () => {
      onObjectModified?.();
    });
    canvas.on('object:added', () => {
      onObjectModified?.();
    });
    canvas.on('object:removed', () => {
      onObjectModified?.();
    });

    onCanvasReady(canvas);

    return () => {
      window.removeEventListener('resize', updateScale);
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [size.width, size.height]);

  // 背景色変更
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      canvas.backgroundColor = backgroundColor || '#ffffff';
      canvas.renderAll();
    }
  }, [backgroundColor]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center p-4 bg-slate-200/70 overflow-hidden relative canvas-wrapper"
    >
      <div className="shadow-xl rounded-xs overflow-hidden border border-slate-300 bg-white">
        <canvas ref={canvasElRef} />
      </div>
    </div>
  );
};
