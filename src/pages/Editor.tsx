import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as fabric from 'fabric';
import type { LabelSize, SavedLabel } from '../types/label';
import type { Product } from '../types/product';
import { Header } from '../components/Header';
import { LabelCanvas } from '../components/Editor/LabelCanvas';
import { TextPropertyPanel } from '../components/Editor/TextPropertyPanel';
import { ShapePropertyPanel } from '../components/Editor/ShapePropertyPanel';
import { ImagePropertyPanel } from '../components/Editor/ImagePropertyPanel';
import { BackgroundPanel } from '../components/Editor/BackgroundPanel';
import { ProductSelectModal } from '../components/Editor/ProductSelectModal';
import { resizeImageFile } from '../utils/imageUtils';
import { saveLabel, deleteLabel } from '../db/labelRepository';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Type,
  Image as ImageIcon,
  Square,
  Circle as CircleIcon,
  Minus as LineIcon,
  Palette,
  Package,
  Undo2,
  Redo2,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCw,
  FlipHorizontal,
  Save,
  Check,
  Printer,
  ChevronDown,
} from 'lucide-react';

import { TEMPLATES } from '../templates/templates';
import { toVerticalText } from '../utils/textDirection';

interface EditorProps {
  initialSize: LabelSize;
  existingLabel?: SavedLabel;
  templateId?: string;
  onBack: () => void;
  onSaved?: (savedLabel: SavedLabel) => void;
  onOpenPrint?: (label: SavedLabel) => void;
}

export const Editor: React.FC<EditorProps> = ({
  initialSize,
  existingLabel,
  templateId,
  onBack,
  onSaved,
  onOpenPrint,
}) => {
  const selectedTemplate = templateId ? TEMPLATES.find((t) => t.id === templateId) : null;

  const [labelId] = useState(
    existingLabel?.id || 'label_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
  );
  const [labelName, setLabelName] = useState(
    existingLabel?.name || (selectedTemplate ? `${selectedTemplate.name}ラベル` : '新規ラベル')
  );
  const [backgroundColor, setBackgroundColor] = useState(
    existingLabel?.backgroundColor || selectedTemplate?.backgroundColor || '#ffffff'
  );
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null);

  // 下部パネル・モーダル状態
  const [activeBottomPanel, setActiveBottomPanel] = useState<'none' | 'text_menu' | 'shape_menu' | 'bg'>('none');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [, setLastSavedAt] = useState<number | null>(existingLabel?.updatedAt || null);

  const handleDeleteCurrentLabel = async () => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    await deleteLabel(labelId);
    setIsDeleteModalOpen(false);
    onBack();
  };

  // Undo / Redo 履歴スタック (最大30件)
  const historyStack = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  const isHistoryProcessing = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const canvasRef = useRef<fabric.Canvas | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 履歴更新判定
  const updateUndoRedoState = () => {
    setCanUndo(historyIndex.current > 0);
    setCanRedo(historyIndex.current < historyStack.current.length - 1);
  };

  // 履歴に現在の状態を保存
  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isHistoryProcessing.current) return;

    const json = JSON.stringify(canvas.toObject(['isVertical', 'rawText']));
    // 直前の状態と同じなら保存しない
    if (historyIndex.current >= 0 && historyStack.current[historyIndex.current] === json) {
      return;
    }

    // 現在のインデックス以降の履歴を切り捨てて追加
    historyStack.current = historyStack.current.slice(0, historyIndex.current + 1);
    historyStack.current.push(json);

    // 最大30件
    if (historyStack.current.length > 30) {
      historyStack.current.shift();
    } else {
      historyIndex.current++;
    }

    updateUndoRedoState();
  }, []);

  // 保存処理 (手動 & 自動デバウンス)
  const performSave = useCallback(
    async (silent: boolean = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        const zoom = canvas.getZoom();
        const thumbnailUrl = canvas.toDataURL({
          format: 'png',
          multiplier: 0.5 / zoom,
        });

        const now = Date.now();
        const data: SavedLabel = {
          id: labelId,
          name: labelName.trim() || '名称未設定ラベル',
          width: initialSize.width,
          height: initialSize.height,
          createdAt: existingLabel?.createdAt || now,
          updatedAt: now,
          backgroundColor: backgroundColor,
          canvasJson: JSON.stringify(canvas.toObject(['isVertical', 'rawText'])),
          thumbnailUrl,
          paperOrientation: existingLabel?.paperOrientation || initialSize.paperOrientation,
        };

        await saveLabel(data);
        setLastSavedAt(now);
        onSaved?.(data);

        if (!silent) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      } catch (err) {
        console.error('Failed to save label', err);
      }
    },
    [labelId, labelName, initialSize, existingLabel, backgroundColor, onSaved]
  );

  // 自動保存デバウンス (1.5秒)
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = setTimeout(() => {
      performSave(true);
    }, 1500);
  }, [performSave]);

  // オブジェクト変更リスナー
  const handleObjectModified = useCallback(() => {
    pushHistory();
    triggerAutoSave();
  }, [pushHistory, triggerAutoSave]);

  // Undo 実行
  const handleUndo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndex.current <= 0) return;

    isHistoryProcessing.current = true;
    historyIndex.current--;
    const prevJson = historyStack.current[historyIndex.current];
    await canvas.loadFromJSON(JSON.parse(prevJson));
    canvas.renderAll();
    isHistoryProcessing.current = false;
    updateUndoRedoState();
    triggerAutoSave();
  };

  // Redo 実行
  const handleRedo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndex.current >= historyStack.current.length - 1) return;

    isHistoryProcessing.current = true;
    historyIndex.current++;
    const nextJson = historyStack.current[historyIndex.current];
    await canvas.loadFromJSON(JSON.parse(nextJson));
    canvas.renderAll();
    isHistoryProcessing.current = false;
    updateUndoRedoState();
    triggerAutoSave();
  };

  // Canvas準備完了
  const handleCanvasReady = useCallback(
    (canvas: fabric.Canvas) => {
      canvasRef.current = canvas;

      if (existingLabel && existingLabel.canvasJson) {
        try {
          canvas.loadFromJSON(JSON.parse(existingLabel.canvasJson)).then(() => {
            canvas.renderAll();
            pushHistory();
          });
        } catch (err) {
          console.error('Failed to load canvas json', err);
        }
      } else if (selectedTemplate) {
        // テンプレート適用
        selectedTemplate.apply(canvas, canvas.width || 300, canvas.height || 200);
        canvas.renderAll();
        pushHistory();
      } else {
        // 白紙新規作成時のデフォルトテキスト
        const text = new fabric.IText('テキスト', {
          left: (canvas.width || 300) / 2,
          top: (canvas.height || 200) / 2,
          fontSize: Math.round((canvas.height || 200) * 0.14) || 36,
          fill: '#1e293b',
          originX: 'center',
          originY: 'center',
        });
        (text as unknown as { isVertical?: boolean; rawText?: string }).isVertical = false;
        (text as unknown as { isVertical?: boolean; rawText?: string }).rawText = 'テキスト';
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
        pushHistory();
      }
    },
    [existingLabel, selectedTemplate, pushHistory]
  );

  // テキスト追加 (横書き / 縦書き)
  const handleAddText = (isVertical: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width || 300;
    const height = canvas.height || 200;

    const defaultRawText = isVertical ? '縦書き' : 'テキスト';
    const displayText = isVertical ? toVerticalText(defaultRawText) : defaultRawText;

    const text = new fabric.IText(displayText, {
      left: width / 2,
      top: height / 2,
      fontSize: Math.round(height * 0.14) || 36,
      fill: '#1e293b',
      originX: 'center',
      originY: 'center',
      textAlign: isVertical ? 'center' : 'left',
      lineHeight: isVertical ? 1.05 : 1.16,
    });

    (text as unknown as { isVertical?: boolean; rawText?: string }).isVertical = isVertical;
    (text as unknown as { isVertical?: boolean; rawText?: string }).rawText = defaultRawText;

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setSelectedObject(text);
    setActiveBottomPanel('none');
    handleObjectModified();
  };

  // 写真・画像選択
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvasRef.current) return;

    try {
      const dataUrl = await resizeImageFile(file, 1200);
      const imgEl = new Image();
      imgEl.crossOrigin = 'anonymous';
      imgEl.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const fabricImg = new fabric.FabricImage(imgEl);
        const canvasW = canvas.width || 400;
        const canvasH = canvas.height || 300;

        // Canvasの40%程度の大きさに収まるようスケール
        const maxDim = Math.min(canvasW, canvasH) * 0.45;
        const scale = maxDim / Math.max(fabricImg.width, fabricImg.height);

        fabricImg.set({
          left: canvasW / 2,
          top: canvasH / 2,
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
        });

        canvas.add(fabricImg);
        canvas.setActiveObject(fabricImg);
        canvas.renderAll();
        setSelectedObject(fabricImg);
        setActiveBottomPanel('none');
        handleObjectModified();
      };
      imgEl.src = dataUrl;
    } catch (err) {
      alert('画像の読み込みに失敗しました。');
      console.error(err);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 図形追加: 四角
  const handleAddRect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width || 300;
    const h = canvas.height || 200;

    const rect = new fabric.Rect({
      left: w / 2,
      top: h / 2,
      width: Math.round(w * 0.4),
      height: Math.round(h * 0.3),
      fill: '#f1f5f9',
      stroke: '#475569',
      strokeWidth: 3,
      originX: 'center',
      originY: 'center',
      rx: 6,
      ry: 6,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    setSelectedObject(rect);
    setActiveBottomPanel('none');
    handleObjectModified();
  };

  // 図形追加: 円
  const handleAddCircle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width || 300;
    const h = canvas.height || 200;

    const circle = new fabric.Circle({
      left: w / 2,
      top: h / 2,
      radius: Math.round(Math.min(w, h) * 0.2),
      fill: '#fee2e2',
      stroke: '#ef4444',
      strokeWidth: 3,
      originX: 'center',
      originY: 'center',
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
    setSelectedObject(circle);
    setActiveBottomPanel('none');
    handleObjectModified();
  };

  // 図形追加: 線
  const handleAddLine = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width || 300;
    const h = canvas.height || 200;

    const line = new fabric.Line([w * 0.2, h / 2, w * 0.8, h / 2], {
      stroke: '#334155',
      strokeWidth: 4,
      strokeLineCap: 'round',
    });
    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.renderAll();
    setSelectedObject(line);
    setActiveBottomPanel('none');
    handleObjectModified();
  };

  // 選択オブジェクト削除
  const handleDeleteSelected = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedObject) return;

    canvas.remove(selectedObject);
    canvas.discardActiveObject();
    canvas.renderAll();
    setSelectedObject(null);
    handleObjectModified();
  };

  // 前面へ
  const handleBringForward = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedObject) return;
    canvas.bringObjectForward(selectedObject);
    canvas.renderAll();
    handleObjectModified();
  };

  // 背面へ
  const handleSendBackward = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedObject) return;
    canvas.sendObjectBackwards(selectedObject);
    canvas.renderAll();
    handleObjectModified();
  };

  // 商品選択からの自動配置 (仕様書19節)
  const handleApplyProduct = (product: Product) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.width || 300;
    const h = canvas.height || 200;

    // 商品名
    const nameText = new fabric.IText(product.name, {
      left: w / 2,
      top: h * 0.28,
      fontSize: Math.round(h * 0.16),
      fontWeight: 'bold',
      fill: '#1e293b',
      originX: 'center',
      originY: 'center',
    });

    // 価格
    const priceText = new fabric.IText(
      product.price ? `${product.price.toLocaleString()}円` : '',
      {
        left: w / 2,
        top: h * 0.58,
        fontSize: Math.round(h * 0.2),
        fontWeight: 'bold',
        fill: '#dc2626',
        originX: 'center',
        originY: 'center',
      }
    );

    // 内容量 & 店名
    const subDetails = [
      product.volume ? `内容量: ${product.volume}` : '',
      product.shopName || '',
    ]
      .filter(Boolean)
      .join('　');

    const subText = new fabric.IText(subDetails, {
      left: w / 2,
      top: h * 0.82,
      fontSize: Math.round(h * 0.1),
      fill: '#64748b',
      originX: 'center',
      originY: 'center',
    });

    canvas.add(nameText, priceText, subText);
    canvas.renderAll();
    setIsProductModalOpen(false);
    handleObjectModified();
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  const isTextSelected = selectedObject instanceof fabric.IText;
  const isImageSelected = selectedObject instanceof fabric.FabricImage;
  const isShapeSelected =
    selectedObject &&
    !isTextSelected &&
    !isImageSelected;

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden select-none">
      {/* 非表示の写真アップロードinput */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* エディタヘッダー */}
      <Header
        title=""
        showBack
        onBack={onBack}
        rightAction={
          <div className="flex items-center gap-1.5">
            {/* Undo / Redo */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-2 text-slate-600 disabled:text-slate-300 hover:bg-slate-100 rounded-xl active:scale-95"
              title="元に戻す"
              aria-label="元に戻す"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-2 text-slate-600 disabled:text-slate-300 hover:bg-slate-100 rounded-xl active:scale-95"
              title="やり直す"
              aria-label="やり直す"
            >
              <Redo2 className="w-5 h-5" />
            </button>

            {/* 印刷・プレビューボタン */}
            {onOpenPrint && (
              <button
                type="button"
                onClick={async () => {
                  await performSave(true);
                  const now = Date.now();
                  const canvas = canvasRef.current;
                  const zoom = canvas?.getZoom() || 1;
                  const thumb = canvas?.toDataURL({
                    format: 'png',
                    multiplier: 1 / zoom,
                  });
                  onOpenPrint({
                    id: labelId,
                    name: labelName,
                    width: initialSize.width,
                    height: initialSize.height,
                    createdAt: existingLabel?.createdAt || now,
                    updatedAt: now,
                    backgroundColor,
                    canvasJson: JSON.stringify(canvas?.toObject(['isVertical', 'rawText']) || {}),
                    thumbnailUrl: thumb,
                    paperOrientation: existingLabel?.paperOrientation || initialSize.paperOrientation,
                  });
                }}
                className="h-9 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 active:scale-95"
                title="印刷"
              >
                <Printer className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">印刷</span>
              </button>
            )}

            {/* ラベル自体の削除ボタン (保存済みラベルの場合) */}
            {existingLabel && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl active:scale-95"
                title="ラベルを削除"
                aria-label="ラベルを削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* 保存ボタン */}
            <button
              type="button"
              onClick={() => performSave(false)}
              className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 active:scale-95 transition-all"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>保存済</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>保存</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {/* ラベル名とサイズ情報バー */}
      <div className="bg-white px-4 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs">
        <input
          type="text"
          value={labelName}
          onChange={(e) => {
            setLabelName(e.target.value);
            triggerAutoSave();
          }}
          className="font-bold text-slate-800 bg-transparent border-none focus:outline-hidden focus:bg-slate-50 px-2 py-1 rounded-md max-w-[200px] text-sm"
          placeholder="ラベル名を入力"
        />
        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
          {initialSize.width} × {initialSize.height} mm
        </span>
      </div>

      {/* 中央：Canvas描画領域 */}
      <div className="flex-1 relative overflow-hidden">
        <LabelCanvas
          size={initialSize}
          backgroundColor={backgroundColor}
          onCanvasReady={handleCanvasReady}
          onSelectionChange={setSelectedObject}
          onObjectModified={handleObjectModified}
        />

        {/* 選択中オブジェクトのクイック操作（前面・背面・回転・反転・削除） */}
        {selectedObject && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-2xl shadow-lg border border-slate-200">
            <button
              type="button"
              onClick={handleBringForward}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl"
              title="前面へ"
              aria-label="前面へ"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSendBackward}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl"
              title="背面へ"
              aria-label="背面へ"
            >
              <ArrowDown className="w-4 h-4" />
            </button>

            {isImageSelected && (
              <>
                <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
                <button
                  type="button"
                  onClick={() => {
                    const img = selectedObject as fabric.FabricImage;
                    const newAngle = (Math.round(img.angle || 0) + 90) % 360;
                    img.set('angle', newAngle);
                    img.setCoords();
                    canvasRef.current?.renderAll();
                    handleObjectModified();
                  }}
                  className="p-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl active:scale-95 transition-all"
                  title="右90°回転"
                  aria-label="右90°回転"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const img = selectedObject as fabric.FabricImage;
                    img.set('flipX', !img.flipX);
                    img.setCoords();
                    canvasRef.current?.renderAll();
                    handleObjectModified();
                  }}
                  className="p-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl active:scale-95 transition-all"
                  title="左右反転"
                  aria-label="左右反転"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
              </>
            )}

            <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="p-2 text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-1 font-bold text-xs"
              title="削除"
              aria-label="削除"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-[11px]">削除</span>
            </button>
          </div>
        )}
      </div>

      {/* プロパティパネル (文字選択時・画像選択時・図形選択時・背景色設定時) */}
      <div className="z-20 bg-white">
        {isTextSelected && (
          <TextPropertyPanel
            textObject={selectedObject as fabric.IText}
            onUpdate={() => {
              canvasRef.current?.renderAll();
              handleObjectModified();
            }}
          />
        )}

        {isImageSelected && (
          <ImagePropertyPanel
            imageObject={selectedObject as fabric.FabricImage}
            canvas={canvasRef.current}
            onUpdate={() => {
              canvasRef.current?.renderAll();
              handleObjectModified();
            }}
          />
        )}

        {isShapeSelected && (
          <ShapePropertyPanel
            shapeObject={selectedObject}
            onUpdate={() => {
              canvasRef.current?.renderAll();
              handleObjectModified();
            }}
          />
        )}

        {activeBottomPanel === 'bg' && (
          <BackgroundPanel
            currentBgColor={backgroundColor}
            onSelectColor={(color) => {
              setBackgroundColor(color);
              handleObjectModified();
            }}
            onClose={() => setActiveBottomPanel('none')}
          />
        )}

        {/* 文字種別選択サブポップアップ */}
        {activeBottomPanel === 'text_menu' && (
          <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-around animate-in slide-in-from-bottom-2 duration-150">
            <button
              type="button"
              onClick={() => handleAddText(false)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-700 hover:bg-slate-50 flex-1"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Type className="w-5 h-5 text-slate-800" />
              </div>
              <span className="text-[11px] font-bold">横書きテキスト</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddText(true)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-700 hover:bg-slate-50 flex-1"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <span className="font-extrabold text-sm text-blue-700 leading-none">
                  縦
                </span>
              </div>
              <span className="text-[11px] font-bold">縦書きテキスト</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveBottomPanel('none')}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 図形選択サブポップアップ */}
        {activeBottomPanel === 'shape_menu' && (
          <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-around animate-in slide-in-from-bottom-2 duration-150">
            <button
              type="button"
              onClick={handleAddRect}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-700 hover:bg-slate-50 flex-1"
            >
              <Square className="w-5 h-5 text-slate-800" />
              <span className="text-[11px] font-bold">四角形</span>
            </button>
            <button
              type="button"
              onClick={handleAddCircle}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-700 hover:bg-slate-50 flex-1"
            >
              <CircleIcon className="w-5 h-5 text-slate-800" />
              <span className="text-[11px] font-bold">円</span>
            </button>
            <button
              type="button"
              onClick={handleAddLine}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-700 hover:bg-slate-50 flex-1"
            >
              <LineIcon className="w-5 h-5 text-slate-800" />
              <span className="text-[11px] font-bold">直線</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveBottomPanel('none')}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* 下部固定メインツールバー */}
      <div className="bg-white border-t border-slate-200 z-30 pb-safe">
        <div className="flex items-center justify-around px-2 py-1.5 max-w-md mx-auto">
          {/* 文字 */}
          <button
            type="button"
            onClick={() =>
              setActiveBottomPanel(activeBottomPanel === 'text_menu' ? 'none' : 'text_menu')
            }
            className={`flex flex-col items-center justify-center p-1.5 rounded-2xl text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 min-h-[50px] min-w-[56px] active:scale-95 transition-colors ${
              activeBottomPanel === 'text_menu' ? 'bg-blue-50 text-blue-600' : ''
            }`}
          >
            <Type className="w-5 h-5" />
            <span className="text-[11px] font-bold mt-0.5">文字</span>
          </button>

          {/* 画像 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-1.5 rounded-2xl text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 min-h-[50px] min-w-[56px] active:scale-95"
          >
            <ImageIcon className="w-5 h-5 text-slate-700" />
            <span className="text-[11px] font-bold mt-0.5">画像</span>
          </button>

          {/* 図形 */}
          <button
            type="button"
            onClick={() =>
              setActiveBottomPanel(
                activeBottomPanel === 'shape_menu' ? 'none' : 'shape_menu'
              )
            }
            className={`flex flex-col items-center justify-center p-1.5 rounded-2xl min-h-[50px] min-w-[56px] active:scale-95 ${
              activeBottomPanel === 'shape_menu'
                ? 'text-blue-600 bg-blue-50/80 font-bold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Square className="w-5 h-5" />
            <span className="text-[11px] font-bold mt-0.5">図形</span>
          </button>

          {/* 背景 */}
          <button
            type="button"
            onClick={() =>
              setActiveBottomPanel(activeBottomPanel === 'bg' ? 'none' : 'bg')
            }
            className={`flex flex-col items-center justify-center p-1.5 rounded-2xl min-h-[50px] min-w-[56px] active:scale-95 ${
              activeBottomPanel === 'bg'
                ? 'text-blue-600 bg-blue-50/80 font-bold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Palette className="w-5 h-5" />
            <span className="text-[11px] font-bold mt-0.5">背景</span>
          </button>

          {/* 商品から入力 */}
          <button
            type="button"
            onClick={() => setIsProductModalOpen(true)}
            className="flex flex-col items-center justify-center p-1.5 rounded-2xl text-blue-600 hover:bg-blue-50/80 min-h-[50px] min-w-[56px] active:scale-95"
          >
            <Package className="w-5 h-5" />
            <span className="text-[11px] font-bold mt-0.5">商品</span>
          </button>
        </div>
      </div>

      {/* 商品選択モーダル */}
      <ProductSelectModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelectProduct={handleApplyProduct}
      />

      {/* ラベル削除確認モーダル */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="ラベルの削除"
        message={`「${labelName}」を完全に削除してもよろしいですか？この操作は元に戻せません。`}
        confirmText="削除する"
        onConfirm={handleDeleteCurrentLabel}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
