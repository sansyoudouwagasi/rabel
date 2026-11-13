import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as fabric from 'fabric';
import {
  getOrientedLabelSize,
  type LabelSize,
  type LabelOrientation,
  type SavedLabel,
} from '../types/label';
import type { Product } from '../types/product';
import { Header } from '../components/Header';
import { LabelCanvas } from '../components/Editor/LabelCanvas';
import { TextPropertyPanel } from '../components/Editor/TextPropertyPanel';
import { ShapePropertyPanel } from '../components/Editor/ShapePropertyPanel';
import { ImagePropertyPanel } from '../components/Editor/ImagePropertyPanel';
import { BackgroundPanel } from '../components/Editor/BackgroundPanel';
import { ProductSelectModal } from '../components/Editor/ProductSelectModal';
import { FoodLabelModal } from '../components/Editor/FoodLabelModal';
import {
  applyFoodBackLabelToCanvas,
  extractFoodLabelDataFromCanvas,
  hasFoodBackLabelOnCanvas,
  DEFAULT_FOOD_LABEL_WITH_NUTRITION,
  DEFAULT_FOOD_LABEL_STANDARD,
  type FoodLabelData,
} from '../utils/foodLabelBuilder';
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
  RectangleHorizontal,
  RectangleVertical,
  ClipboardList,
} from 'lucide-react';

import { TEMPLATES } from '../templates/templates';
import { toVerticalText } from '../utils/textDirection';
import { DEFAULT_FONT_FAMILY, refreshCanvasFonts } from '../utils/fonts';

const CUSTOM_CANVAS_PROPS = [
  'isVertical',
  'rawText',
  'isFoodTableElement',
  'foodField',
  'foodLabelData',
];

interface EditorProps {
  initialSize: LabelSize;
  existingLabel?: SavedLabel;
  templateId?: string;
  onBack: () => void;
  onSaved?: (savedLabel: SavedLabel) => void;
  onOpenPrint?: (label: SavedLabel) => void;
}

// ズーム倍率を除いた論理キャンバスサイズ（300 DPI基準座標）を取得
function getLogicalCanvasSize(canvas: fabric.Canvas): { width: number; height: number } {
  const zoom = canvas.getZoom() || 1;
  return {
    width: Math.round((canvas.width || 300) / zoom),
    height: Math.round((canvas.height || 200) / zoom),
  };
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

  const [currentSize, setCurrentSize] = useState<LabelSize>(initialSize);
  const isPortraitLabel =
    currentSize.labelOrientation === 'portrait' || currentSize.height > currentSize.width;

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
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [foodModalData, setFoodModalData] = useState<FoodLabelData>(
    selectedTemplate?.id === 'food-back-standard'
      ? DEFAULT_FOOD_LABEL_STANDARD
      : DEFAULT_FOOD_LABEL_WITH_NUTRITION
  );
  const [isFoodLabelActive, setIsFoodLabelActive] = useState<boolean>(
    Boolean(selectedTemplate?.isFoodBackLabel)
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isOrientationModalOpen, setIsOrientationModalOpen] = useState<boolean>(
    initialSize.width !== initialSize.height
  );
  const [hasUserEdited, setHasUserEdited] = useState<boolean>(Boolean(existingLabel));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [, setLastSavedAt] = useState<number | null>(existingLabel?.updatedAt || null);
  const [focusTextPanelSeq, setFocusTextPanelSeq] = useState(0);

  // 編集中にラベルの向き（横向き⇔縦向き）を切り替えた際のキャンバス引き継ぎ用Ref
  const pendingOrientationJsonRef = useRef<string | null>(null);
  const pendingFoodDataRef = useRef<FoodLabelData | null>(null);
  const shouldReapplyTemplateRef = useRef<boolean>(false);
  const isLabelNameComposingRef = useRef<boolean>(false);
  const labelNameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (
      labelNameInputRef.current &&
      !isLabelNameComposingRef.current &&
      labelNameInputRef.current.value !== labelName
    ) {
      labelNameInputRef.current.value = labelName;
    }
  }, [labelName]);

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

    const json = JSON.stringify(canvas.toObject(CUSTOM_CANVAS_PROPS));
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
    async (silent: boolean = false, sizeOverride?: LabelSize) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const targetSize = sizeOverride || currentSize;

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
          width: targetSize.width,
          height: targetSize.height,
          createdAt: existingLabel?.createdAt || now,
          updatedAt: now,
          backgroundColor: backgroundColor,
          canvasJson: JSON.stringify(canvas.toObject(CUSTOM_CANVAS_PROPS)),
          thumbnailUrl,
          labelOrientation:
            targetSize.labelOrientation ||
            (targetSize.height > targetSize.width ? 'portrait' : 'landscape'),
          paperOrientation: targetSize.paperOrientation || existingLabel?.paperOrientation,
          sheetLayout: targetSize.sheetLayout || existingLabel?.sheetLayout,
          formatType: targetSize.formatType || existingLabel?.formatType,
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
    [labelId, labelName, currentSize, existingLabel, backgroundColor, onSaved]
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
    setHasUserEdited(true);
    pushHistory();
    triggerAutoSave();
  }, [pushHistory, triggerAutoSave]);

  // 食品表示（裏ラベル）入力・編集モーダルを開く
  const handleOpenFoodModal = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const extracted = extractFoodLabelDataFromCanvas(canvas);
      if (extracted) {
        setFoodModalData(extracted);
      }
    }
    setActiveBottomPanel('none');
    setIsFoodModalOpen(true);
  };

  // 食品表示（裏ラベル）データをキャンバスへ反映
  const handleApplyFoodModal = (data: FoodLabelData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width: logicalW, height: logicalH } = getLogicalCanvasSize(canvas);
    applyFoodBackLabelToCanvas(canvas, logicalW, logicalH, data);
    setFoodModalData(data);
    setIsFoodLabelActive(true);
    setIsFoodModalOpen(false);
    setSelectedObject(null);
    if (
      data.productTitle &&
      (labelName === '新規ラベル' ||
        labelName === '食品裏ラベル (栄養成分付)ラベル' ||
        labelName === '食品裏ラベル (一括表示)ラベル')
    ) {
      setLabelName(`${data.productTitle} 裏ラベル`);
    }
    handleObjectModified();
  };

  // ラベル自体の向き（横向き / 縦向き）を切り替え
  const handleSwitchLabelOrientation = (targetOrientation: LabelOrientation) => {
    const currentOrientation: LabelOrientation = isPortraitLabel ? 'portrait' : 'landscape';
    if (targetOrientation === currentOrientation) {
      setIsOrientationModalOpen(false);
      return;
    }

    const canvas = canvasRef.current;
    const nextSize = getOrientedLabelSize(currentSize, targetOrientation);

    // 食品裏ラベルが含まれる場合は、新しい縦横サイズに合わせて表組みと改行を自動再レイアウトする
    if (canvas && hasFoodBackLabelOnCanvas(canvas)) {
      const extracted = extractFoodLabelDataFromCanvas(canvas);
      if (extracted) {
        pendingFoodDataRef.current = extracted;
        pendingOrientationJsonRef.current = null;
        shouldReapplyTemplateRef.current = false;
        setSelectedObject(null);
        setCurrentSize(nextSize);
        setIsOrientationModalOpen(false);
        return;
      }
    }

    // 新規作成直後でまだ手動編集していない場合は、新しい向きのキャンバスでテンプレート/白紙を初期生成し直す
    if (!hasUserEdited && !existingLabel) {
      shouldReapplyTemplateRef.current = true;
      pendingOrientationJsonRef.current = null;
      setSelectedObject(null);
      setCurrentSize(nextSize);
      setIsOrientationModalOpen(false);
      return;
    }

    if (canvas) {
      const { width: oldW, height: oldH } = getLogicalCanvasSize(canvas);
      const newW = oldH;
      const newH = oldW;

      // キャンバス内の各オブジェクトを新しい縦横比率に合わせて再配置
      canvas.getObjects().forEach((obj) => {
        // 外枠Rect（枠線テンプレートなど）の判定
        if (
          obj instanceof fabric.Rect &&
          obj.fill === 'transparent' &&
          (obj.width || 0) >= oldW * 0.75 &&
          (obj.height || 0) >= oldH * 0.75
        ) {
          const padX = obj.left || 16;
          const padY = obj.top || 16;
          obj.set({
            width: Math.max(20, newW - padX * 2),
            height: Math.max(20, newH - padY * 2),
          });
        } else if (
          obj instanceof fabric.Rect &&
          Math.abs(obj.left || 0) <= 2 &&
          (obj.width || 0) >= oldW * 0.95
        ) {
          // 横幅いっぱいの帯Rect
          obj.set({
            left: 0,
            top: ((obj.top || 0) / oldH) * newH,
            width: newW,
            height: ((obj.height || 0) / oldH) * newH,
          });
        } else {
          obj.set({
            left: Math.round(((obj.left || 0) / oldW) * newW),
            top: Math.round(((obj.top || 0) / oldH) * newH),
          });
        }
        obj.setCoords();
      });

      pendingOrientationJsonRef.current = JSON.stringify(
        canvas.toObject(CUSTOM_CANVAS_PROPS)
      );
    }

    setSelectedObject(null);
    setCurrentSize(nextSize);
    setIsOrientationModalOpen(false);
  };

  // Undo 実行
  const handleUndo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndex.current <= 0) return;

    isHistoryProcessing.current = true;
    historyIndex.current--;
    const prevJson = historyStack.current[historyIndex.current];
    await canvas.loadFromJSON(JSON.parse(prevJson));
    await refreshCanvasFonts(canvas);
    canvas.renderAll();
    setIsFoodLabelActive(hasFoodBackLabelOnCanvas(canvas));
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
    await refreshCanvasFonts(canvas);
    canvas.renderAll();
    setIsFoodLabelActive(hasFoodBackLabelOnCanvas(canvas));
    isHistoryProcessing.current = false;
    updateUndoRedoState();
    triggerAutoSave();
  };

  // Canvas準備完了
  const handleCanvasReady = useCallback(
    (canvas: fabric.Canvas) => {
      canvasRef.current = canvas;
      const { width: logicalW, height: logicalH } = getLogicalCanvasSize(canvas);

      // モバイル(Android等)ではFabricの1px非表示textarea経由だとIMEの漢字変換が中断されるため、
      // キャンバス直接編集ではなくプロパティパネル側の標準<textarea>へフォーカスを誘導する
      const isTouchOrMobile =
        typeof window !== 'undefined' &&
        (window.matchMedia?.('(pointer: coarse)').matches ||
          /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

      canvas.on('text:editing:entered', (opt) => {
        const target = (opt as { target?: fabric.FabricObject }).target;
        if (!(target instanceof fabric.IText)) return;

        if (isTouchOrMobile) {
          setTimeout(() => {
            if (target.isEditing) {
              target.exitEditing();
            }
            canvas.setActiveObject(target);
            canvas.renderAll();
            setSelectedObject(target);
            setFocusTextPanelSeq((n) => n + 1);
          }, 0);
        }
      });

      canvas.on('text:changed', (opt) => {
        const target = (opt as { target?: fabric.FabricObject }).target;
        if (!(target instanceof fabric.IText)) return;
        const ext = target as unknown as { rawText?: string; isVertical?: boolean };
        if (!ext.isVertical) {
          ext.rawText = target.text || '';
        }
      });

      // 食品裏ラベルの向き切り替えに伴う表組み再レイアウト
      if (pendingFoodDataRef.current) {
        const foodData = pendingFoodDataRef.current;
        pendingFoodDataRef.current = null;
        applyFoodBackLabelToCanvas(canvas, logicalW, logicalH, foodData);
        setIsFoodLabelActive(true);
        refreshCanvasFonts(canvas);
        historyStack.current = [];
        historyIndex.current = -1;
        pushHistory();
        triggerAutoSave();
        return;
      }

      // 編集中に横向き⇔縦向きを切り替えた直後の復元
      if (pendingOrientationJsonRef.current) {
        const jsonStr = pendingOrientationJsonRef.current;
        pendingOrientationJsonRef.current = null;
        canvas
          .loadFromJSON(JSON.parse(jsonStr))
          .then(async () => {
            await refreshCanvasFonts(canvas);
            canvas.renderAll();
            setIsFoodLabelActive(hasFoodBackLabelOnCanvas(canvas));
            historyStack.current = [];
            historyIndex.current = -1;
            pushHistory();
            triggerAutoSave();
          })
          .catch((err) => {
            console.error('Failed to restore oriented canvas json', err);
          });
        return;
      }

      if (existingLabel && existingLabel.canvasJson && !shouldReapplyTemplateRef.current) {
        try {
          canvas.loadFromJSON(JSON.parse(existingLabel.canvasJson)).then(async () => {
            await refreshCanvasFonts(canvas);
            canvas.renderAll();
            setIsFoodLabelActive(hasFoodBackLabelOnCanvas(canvas));
            pushHistory();
          });
        } catch (err) {
          console.error('Failed to load canvas json', err);
        }
      } else if (selectedTemplate) {
        shouldReapplyTemplateRef.current = false;
        // テンプレート適用
        selectedTemplate.apply(canvas, logicalW, logicalH);
        canvas.renderAll();
        setIsFoodLabelActive(Boolean(selectedTemplate.isFoodBackLabel));
        refreshCanvasFonts(canvas);
        historyStack.current = [];
        historyIndex.current = -1;
        pushHistory();
      } else {
        shouldReapplyTemplateRef.current = false;
        // 白紙新規作成時のデフォルトテキスト
        const base = Math.min(logicalW, logicalH);
        const text = new fabric.IText('テキスト', {
          left: logicalW / 2,
          top: logicalH / 2,
          fontSize: Math.round(base * 0.14) || 36,
          fontFamily: DEFAULT_FONT_FAMILY,
          fill: '#1e293b',
          originX: 'center',
          originY: 'center',
        });
        (text as unknown as { isVertical?: boolean; rawText?: string }).isVertical = false;
        (text as unknown as { isVertical?: boolean; rawText?: string }).rawText = 'テキスト';
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
        refreshCanvasFonts(canvas);
        historyStack.current = [];
        historyIndex.current = -1;
        pushHistory();
      }
    },
    [existingLabel, selectedTemplate, pushHistory, triggerAutoSave]
  );

  // テキスト追加 (横書き / 縦書き)
  const handleAddText = (isVertical: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = getLogicalCanvasSize(canvas);
    const base = Math.min(width, height);

    const defaultRawText = isVertical ? '縦書き' : 'テキスト';
    const displayText = isVertical ? toVerticalText(defaultRawText) : defaultRawText;

    const text = new fabric.IText(displayText, {
      left: width / 2,
      top: height / 2,
      fontSize: Math.round(base * 0.14) || 36,
      fontFamily: DEFAULT_FONT_FAMILY,
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
        const { width: canvasW, height: canvasH } = getLogicalCanvasSize(canvas);

        // Canvasの45%程度の大きさに収まるようスケール
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
    const { width: w, height: h } = getLogicalCanvasSize(canvas);

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
    const { width: w, height: h } = getLogicalCanvasSize(canvas);

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
    const { width: w, height: h } = getLogicalCanvasSize(canvas);

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

    const { width: w, height: h } = getLogicalCanvasSize(canvas);

    // 食品裏ラベルが配置されている場合は、表の各項目へ商品データを自動反映する
    if (hasFoodBackLabelOnCanvas(canvas)) {
      const currentData = extractFoodLabelDataFromCanvas(canvas) || foodModalData;
      const nextData: FoodLabelData = {
        ...currentData,
        productTitle: product.name || currentData.productTitle,
        showProductTitle: true,
        ingredients: product.ingredients || currentData.ingredients,
        volume: product.volume || currentData.volume,
        expiry: product.expiry || currentData.expiry,
        storage: product.storage || currentData.storage,
        manufacturer: product.shopName || currentData.manufacturer,
      };
      applyFoodBackLabelToCanvas(canvas, w, h, nextData);
      setFoodModalData(nextData);
      setIsFoodLabelActive(true);
      setIsProductModalOpen(false);
      handleObjectModified();
      return;
    }

    const base = Math.min(w, h);

    // 商品名
    const nameText = new fabric.IText(product.name, {
      left: w / 2,
      top: h * 0.28,
      fontSize: Math.round(base * 0.15),
      fontWeight: 'bold',
      fill: '#1e293b',
      originX: 'center',
      originY: 'center',
    });
    (nameText as unknown as { isVertical?: boolean; rawText?: string }).isVertical = false;
    (nameText as unknown as { isVertical?: boolean; rawText?: string }).rawText = product.name;

    // 価格
    const priceStr = product.price ? `${product.price.toLocaleString()}円` : '';
    const priceText = new fabric.IText(priceStr, {
      left: w / 2,
      top: h * 0.58,
      fontSize: Math.round(base * 0.19),
      fontWeight: 'bold',
      fill: '#dc2626',
      originX: 'center',
      originY: 'center',
    });
    (priceText as unknown as { isVertical?: boolean; rawText?: string }).isVertical = false;
    (priceText as unknown as { isVertical?: boolean; rawText?: string }).rawText = priceStr;

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
      fontSize: Math.round(base * 0.095),
      fill: '#64748b',
      originX: 'center',
      originY: 'center',
    });
    (subText as unknown as { isVertical?: boolean; rawText?: string }).isVertical = false;
    (subText as unknown as { isVertical?: boolean; rawText?: string }).rawText = subDetails;

    canvas.add(nameText, priceText, subText);
    canvas.renderAll();
    setIsProductModalOpen(false);
    handleObjectModified();
  };

  // 画面マウント時に最上部スクロールを強制（スクロール位置引き継ぎによるヘッダー消失を防止）
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

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
    <div className="fixed inset-0 h-dvh w-full flex flex-col bg-slate-100 overflow-hidden z-10">
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
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Undo / Redo */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-1.5 sm:p-2 text-slate-600 disabled:text-slate-300 hover:bg-slate-100 rounded-xl active:scale-95 shrink-0"
              title="元に戻す"
              aria-label="元に戻す"
            >
              <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-1.5 sm:p-2 text-slate-600 disabled:text-slate-300 hover:bg-slate-100 rounded-xl active:scale-95 shrink-0"
              title="やり直す"
              aria-label="やり直す"
            >
              <Redo2 className="w-4 h-4 sm:w-5 sm:h-5" />
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
                    width: currentSize.width,
                    height: currentSize.height,
                    createdAt: existingLabel?.createdAt || now,
                    updatedAt: now,
                    backgroundColor,
                    canvasJson: JSON.stringify(canvas?.toObject(CUSTOM_CANVAS_PROPS) || {}),
                    thumbnailUrl: thumb,
                    labelOrientation: isPortraitLabel ? 'portrait' : 'landscape',
                    paperOrientation: currentSize.paperOrientation || existingLabel?.paperOrientation,
                    sheetLayout: currentSize.sheetLayout || existingLabel?.sheetLayout,
                    formatType: currentSize.formatType || existingLabel?.formatType,
                  });
                }}
                className="h-8 sm:h-9 px-2 sm:px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 active:scale-95 shrink-0"
                title="印刷"
              >
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                <span>印刷</span>
              </button>
            )}

            {/* ラベル自体の削除ボタン (保存済みラベルの場合) */}
            {existingLabel && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl active:scale-95 shrink-0"
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
              className="h-8 sm:h-9 px-2.5 sm:px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 active:scale-95 transition-all shrink-0"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>保存済</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>保存</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {/* ラベル名・ラベルの向き切り替え・サイズ情報バー */}
      <div className="bg-white px-2.5 sm:px-4 py-1.5 border-b border-slate-200 flex items-center justify-between gap-2 text-xs shrink-0 w-full">
        <input
          ref={labelNameInputRef}
          type="text"
          defaultValue={labelName}
          autoComplete="on"
          autoCorrect="on"
          autoCapitalize="none"
          spellCheck={false}
          onCompositionStart={() => {
            isLabelNameComposingRef.current = true;
          }}
          onCompositionEnd={(e) => {
            isLabelNameComposingRef.current = false;
            setLabelName(e.currentTarget.value);
            triggerAutoSave();
          }}
          onChange={(e) => {
            if (isLabelNameComposingRef.current) return;
            setLabelName(e.target.value);
            triggerAutoSave();
          }}
          onBlur={(e) => {
            isLabelNameComposingRef.current = false;
            setLabelName(e.target.value);
          }}
          className="font-bold text-slate-800 bg-transparent border-none focus:outline-hidden focus:bg-slate-50 px-1.5 py-1 rounded-md min-w-0 flex-1 max-w-[160px] sm:max-w-[220px] text-xs sm:text-sm select-text"
          placeholder="ラベル名を入力"
        />

        <div className="flex items-center gap-1.5 shrink-0">
          {/* ラベル自体の向き（横長 / 縦長）切り替えトグル */}
          {currentSize.width !== currentSize.height && (
            <div
              className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200"
              role="group"
              aria-label="ラベル1枚の向き"
            >
              <button
                type="button"
                onClick={() => handleSwitchLabelOrientation('landscape')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                  !isPortraitLabel
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="用紙縦向き / ラベル1枚は横長"
              >
                <RectangleHorizontal className="w-3.5 h-3.5" />
                <span>ラベル横長</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchLabelOrientation('portrait')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                  isPortraitLabel
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="用紙横向き / ラベル1枚は縦長"
              >
                <RectangleVertical className="w-3.5 h-3.5" />
                <span>ラベル縦長</span>
              </button>
            </div>
          )}

          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md shrink-0">
            {currentSize.width}×{currentSize.height}mm
          </span>
        </div>
      </div>

      {/* 食品裏ラベル専用：消費期限・原材料などの一括入力バー（キャンバスに被らない上部固定バー） */}
      {isFoodLabelActive && (
        <div className="bg-amber-50/90 border-b border-amber-200 px-3 py-1.5 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] font-bold text-amber-900 truncate">
            食品表示枠：各項目をまとめて入力できます
          </span>
          <button
            type="button"
            onClick={handleOpenFoodModal}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
          >
            <ClipboardList className="w-3.5 h-3.5 shrink-0" />
            <span>消費期限・原材料などを入力・編集</span>
          </button>
        </div>
      )}

      {/* 中央：Canvas描画領域 */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <LabelCanvas
          size={currentSize}
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
      <div className="z-20 bg-white shrink-0">
        {isTextSelected && (
          <TextPropertyPanel
            textObject={selectedObject as fabric.IText}
            focusRequestId={focusTextPanelSeq}
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
      <div className="bg-white border-t border-slate-200 z-30 pb-safe shrink-0">
        <div className="flex items-center justify-around px-1.5 py-1.5 max-w-md mx-auto">
          {/* 食品裏ラベル一括入力・編集 */}
          <button
            type="button"
            onClick={handleOpenFoodModal}
            className={`flex flex-col items-center justify-center p-1.5 rounded-2xl min-h-[50px] min-w-[52px] active:scale-95 transition-colors ${
              isFoodLabelActive
                ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold'
                : 'text-amber-700 hover:bg-amber-50/70'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">食品表示</span>
          </button>

          {/* 文字 */}
          <button
            type="button"
            onClick={() =>
              setActiveBottomPanel(activeBottomPanel === 'text_menu' ? 'none' : 'text_menu')
            }
            className={`flex flex-col items-center justify-center p-1.5 rounded-2xl text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 min-h-[50px] min-w-[52px] active:scale-95 transition-colors ${
              activeBottomPanel === 'text_menu' ? 'bg-blue-50 text-blue-600' : ''
            }`}
          >
            <Type className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">文字</span>
          </button>

          {/* 画像 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-1.5 rounded-2xl text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 min-h-[50px] min-w-[52px] active:scale-95"
          >
            <ImageIcon className="w-5 h-5 text-slate-700" />
            <span className="text-[10px] font-bold mt-0.5">画像</span>
          </button>

          {/* 図形 */}
          <button
            type="button"
            onClick={() =>
              setActiveBottomPanel(
                activeBottomPanel === 'shape_menu' ? 'none' : 'shape_menu'
              )
            }
            className={`flex flex-col items-center justify-center p-1.5 rounded-2xl min-h-[50px] min-w-[52px] active:scale-95 ${
              activeBottomPanel === 'shape_menu'
                ? 'text-blue-600 bg-blue-50/80 font-bold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Square className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">図形</span>
          </button>

          {/* 背景 */}
          <button
            type="button"
            onClick={() =>
              setActiveBottomPanel(activeBottomPanel === 'bg' ? 'none' : 'bg')
            }
            className={`flex flex-col items-center justify-center p-1.5 rounded-2xl min-h-[50px] min-w-[52px] active:scale-95 ${
              activeBottomPanel === 'bg'
                ? 'text-blue-600 bg-blue-50/80 font-bold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Palette className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">背景</span>
          </button>

          {/* 商品から入力 */}
          <button
            type="button"
            onClick={() => setIsProductModalOpen(true)}
            className="flex flex-col items-center justify-center p-1.5 rounded-2xl text-blue-600 hover:bg-blue-50/80 min-h-[50px] min-w-[52px] active:scale-95"
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">商品</span>
          </button>
        </div>
      </div>

      {/* 食品裏ラベル専用：消費期限・原材料・一括表示入力モーダル */}
      <FoodLabelModal
        isOpen={isFoodModalOpen}
        initialData={foodModalData}
        onClose={() => setIsFoodModalOpen(false)}
        onApply={handleApplyFoodModal}
      />

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

      {/* ラベル編集開始時の「横長ラベル(用紙縦) / 縦長ラベル(用紙横)」選択モーダル */}
      {isOrientationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="text-center space-y-1">
              <span className="inline-block text-[11px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                編集するラベルの形を確認
              </span>
              <h2 className="text-base font-extrabold text-slate-800">
                どちらの向きで編集しますか？
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                用紙を横向きにして使う場合（24面等）は、ラベル1枚が「縦長」になります。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* 用紙：縦向き → ラベル1枚：横長 */}
              <button
                type="button"
                onClick={() => handleSwitchLabelOrientation('landscape')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-between gap-2.5 transition-all active:scale-95 touch-manipulation ${
                  !isPortraitLabel
                    ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50/30'
                }`}
              >
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                  用紙：縦向き (3×8等)
                </span>
                <div className="h-14 flex items-center justify-center">
                  <div
                    className={`w-16 h-11 rounded-lg border-2 flex flex-col items-center justify-center gap-1 shadow-2xs ${
                      !isPortraitLabel
                        ? 'bg-white border-blue-600 text-blue-600'
                        : 'bg-white border-slate-400 text-slate-500'
                    }`}
                  >
                    <div className="w-9 h-1 bg-current rounded-full" />
                    <div className="w-6 h-1 bg-current rounded-full opacity-60" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-extrabold text-slate-800">ラベル1枚：横長</div>
                  <div className="text-[11px] font-bold text-blue-600 mt-0.5">
                    {Math.max(currentSize.width, currentSize.height)} ×{' '}
                    {Math.min(currentSize.width, currentSize.height)} mm
                  </div>
                </div>
              </button>

              {/* 用紙：横向き → ラベル1枚：縦長 */}
              <button
                type="button"
                onClick={() => handleSwitchLabelOrientation('portrait')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-between gap-2.5 transition-all active:scale-95 touch-manipulation ${
                  isPortraitLabel
                    ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50/30'
                }`}
              >
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-800">
                  用紙：横向き (8×3等)
                </span>
                <div className="h-14 flex items-center justify-center">
                  <div
                    className={`w-11 h-16 rounded-lg border-2 flex items-center justify-center gap-1 shadow-2xs ${
                      isPortraitLabel
                        ? 'bg-white border-blue-600 text-blue-600'
                        : 'bg-white border-slate-400 text-slate-500'
                    }`}
                  >
                    <div className="w-1 h-8 bg-current rounded-full opacity-60" />
                    <div className="w-1 h-10 bg-current rounded-full" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-extrabold text-slate-800">ラベル1枚：縦長</div>
                  <div className="text-[11px] font-bold text-blue-600 mt-0.5">
                    {Math.min(currentSize.width, currentSize.height)} ×{' '}
                    {Math.max(currentSize.width, currentSize.height)} mm
                  </div>
                </div>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              ※ 編集画面の上部バーから、あとでいつでも切り替えられます
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
