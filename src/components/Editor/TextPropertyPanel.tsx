import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';
import {
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Minus,
  Palette,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { toVerticalText, toHorizontalText } from '../../utils/textDirection';
import {
  LABEL_FONTS,
  ensureFontLoaded,
  findFontPreset,
  type LabelFontPreset,
} from '../../utils/fonts';
import { FontPickerModal } from './FontPickerModal';

interface TextPropertyPanelProps {
  textObject: fabric.IText;
  focusRequestId?: number;
  onUpdate: () => void;
}

const PRESET_COLORS = [
  '#1e293b', // 黒/ダークスレート
  '#dc2626', // 赤
  '#2563eb', // 青
  '#16a34a', // 緑
  '#d97706', // 琥珀/金茶
  '#7c3aed', // 紫
  '#ffffff', // 白
];

// パネル上で1タップ切り替えできる主要フォントID
const QUICK_FONT_IDS = [
  'noto-sans',
  'noto-serif',
  'zen-maru',
  'shippori-mincho',
  'yuji-syuku',
  'yuji-mai',
  'yuji-boku',
  'kiwi-maru',
  'hachi-maru-pop',
  'reggae-one',
  'dela-gothic',
];

export const TextPropertyPanel: React.FC<TextPropertyPanelProps> = ({
  textObject,
  focusRequestId,
  onUpdate,
}) => {
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false);

  const isVertical = Boolean((textObject as unknown as { isVertical?: boolean }).isVertical);

  // rawText（ユーザーが入力した生のテキスト）を取得
  const rawText =
    (textObject as unknown as { rawText?: string }).rawText ??
    (isVertical ? toHorizontalText(textObject.text || '') : textObject.text || '');

  // 別のテキストオブジェクトを選択した際・外部変更時にテキストエリア内容を同期（IME変換中は上書きしない）
  useEffect(() => {
    const el = textareaRef.current;
    if (!el || isComposingRef.current) return;
    if (el.value !== rawText) {
      el.value = rawText;
    }
  }, [textObject, rawText]);

  // キャンバス上のテキストをダブルタップした際にネイティブ入力欄へフォーカスする（Android/モバイル向け）
  useEffect(() => {
    if (!focusRequestId) return;
    const timer = setTimeout(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        const len = el.value.length;
        try {
          el.setSelectionRange(len, len);
        } catch {
          // noop
        }
      }
    }, 30);
    return () => clearTimeout(timer);
  }, [focusRequestId]);

  const currentFontSize = Math.round(textObject.fontSize || 36);
  const isBold = textObject.fontWeight === 'bold';
  const currentAlign = textObject.textAlign || 'left';
  const currentColor = (textObject.fill as string) || '#1e293b';
  const currentFontFamily = textObject.fontFamily || LABEL_FONTS[0].fontFamily;
  const currentFontPreset = findFontPreset(currentFontFamily);

  const quickFonts = QUICK_FONT_IDS.map((id) => LABEL_FONTS.find((f) => f.id === id)).filter(
    (f): f is LabelFontPreset => Boolean(f)
  );

  const commitTextToFabric = useCallback(
    (newRaw: string) => {
      const prevRaw =
        (textObject as unknown as { rawText?: string }).rawText ??
        (isVertical ? toHorizontalText(textObject.text || '') : textObject.text || '');
      if (newRaw === prevRaw) return;

      (textObject as unknown as { rawText?: string }).rawText = newRaw;

      if (isVertical) {
        textObject.set('text', toVerticalText(newRaw));
      } else {
        textObject.set('text', newRaw);
      }
      textObject.initDimensions();
      textObject.setCoords();
      onUpdate();
    },
    [textObject, isVertical, onUpdate]
  );

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = false;
    commitTextToFabric(e.currentTarget.value);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;
    // 日本語IME変換中（未確定のひらがな入力中）はFabric描画やReact親ステート更新を行わず、変換候補の確定を待つ
    if (isComposingRef.current || nativeEvent?.isComposing) {
      return;
    }
    commitTextToFabric(e.target.value);
  };

  const handleTextBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (isComposingRef.current) {
      isComposingRef.current = false;
    }
    commitTextToFabric(e.currentTarget.value);
  };

  const handleToggleDirection = (direction: 'horizontal' | 'vertical') => {
    const wantVertical = direction === 'vertical';
    if (wantVertical === isVertical) return;

    const latestRaw = textareaRef.current?.value ?? rawText;
    (textObject as unknown as { isVertical?: boolean }).isVertical = wantVertical;
    (textObject as unknown as { rawText?: string }).rawText = latestRaw;

    if (wantVertical) {
      textObject.set({
        text: toVerticalText(latestRaw),
        textAlign: 'center',
        lineHeight: 1.05,
      });
    } else {
      textObject.set({
        text: latestRaw,
        textAlign: 'left',
        lineHeight: 1.16,
      });
    }
    textObject.initDimensions();
    textObject.setCoords();
    onUpdate();
  };

  const handleFontSizeDelta = (delta: number) => {
    const newSize = Math.max(12, Math.min(200, currentFontSize + delta));
    textObject.set('fontSize', newSize);
    textObject.initDimensions();
    textObject.setCoords();
    onUpdate();
  };

  const handleToggleBold = () => {
    textObject.set('fontWeight', isBold ? 'normal' : 'bold');
    textObject.initDimensions();
    textObject.setCoords();
    onUpdate();
  };

  const handleAlignChange = (align: 'left' | 'center' | 'right') => {
    textObject.set('textAlign', align);
    onUpdate();
  };

  const handleColorChange = (color: string) => {
    textObject.set('fill', color);
    onUpdate();
  };

  const handleSelectFont = async (font: LabelFontPreset) => {
    await ensureFontLoaded(font.fontFamily, rawText || 'あいう漢字ABC123');
    textObject.set('fontFamily', font.fontFamily);
    textObject.initDimensions();
    textObject.setCoords();
    onUpdate();
  };

  return (
    <div className="bg-white p-3 border-t border-slate-200 space-y-2.5">
      {/* 文字内容入力 & 書字方向切り替え */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-bold text-slate-500">
            文字内容
          </label>
          {/* 書字方向トグル */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
            <button
              type="button"
              onClick={() => handleToggleDirection('horizontal')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                !isVertical
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              横書き
            </button>
            <button
              type="button"
              onClick={() => handleToggleDirection('vertical')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                isVertical
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              縦書き
            </button>
          </div>
        </div>

        <textarea
          ref={textareaRef}
          rows={isVertical ? 2 : 1}
          defaultValue={rawText}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          autoComplete="on"
          autoCorrect="on"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="text"
          className="w-full min-h-[40px] px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-base sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none select-text"
          placeholder={isVertical ? '縦書き文字を入力 (改行で複数列)' : '文字を入力（漢字変換対応）'}
        />
      </div>

      {/* フォントクイック選択バー + 一覧モーダル起動 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-500 shrink-0">フォント (書体):</span>
          <button
            type="button"
            onClick={() => setIsFontModalOpen(true)}
            className="flex-1 max-w-[260px] h-8 px-2.5 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 rounded-xl flex items-center justify-between gap-2 text-xs transition-all active:scale-[0.98]"
          >
            <span
              className="font-bold text-blue-900 truncate"
              style={{ fontFamily: currentFontPreset.fontFamily }}
            >
              {currentFontPreset.name}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-blue-600 shrink-0">
              すべて見る
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>

        {/* 1タップ切り替えできる書体見本チップ */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {quickFonts.map((font) => {
            const isSelected = currentFontPreset.id === font.id;
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => handleSelectFont(font)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-2xs font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/40'
                }`}
                style={{ fontFamily: font.fontFamily }}
                title={font.name}
              >
                {font.shortName}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setIsFontModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl border border-dashed border-blue-400 bg-blue-50/40 text-blue-700 text-[11px] font-bold whitespace-nowrap shrink-0 flex items-center gap-1 hover:bg-blue-50 active:scale-95"
          >
            <Sparkles className="w-3 h-3" />
            全{LABEL_FONTS.length}書体
          </button>
        </div>
      </div>

      {/* スタイル操作（サイズ、太字、揃え、文字色） */}
      <div className="flex flex-wrap items-center gap-2">
        {/* フォントサイズ */}
        <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 h-9 px-1">
          <button
            type="button"
            onClick={() => handleFontSizeDelta(-4)}
            className="w-7 h-7 flex items-center justify-center text-slate-700 hover:bg-white rounded-lg active:scale-95"
            aria-label="サイズ縮小"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-bold w-10 text-center text-slate-800">
            {currentFontSize}
          </span>
          <button
            type="button"
            onClick={() => handleFontSizeDelta(4)}
            className="w-7 h-7 flex items-center justify-center text-slate-700 hover:bg-white rounded-lg active:scale-95"
            aria-label="サイズ拡大"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 太字 */}
        <button
          type="button"
          onClick={handleToggleBold}
          className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${
            isBold
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-slate-50 border-slate-300 text-slate-700'
          }`}
          aria-label="太字"
        >
          <Bold className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* 揃え */}
        <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 p-0.5">
          <button
            type="button"
            onClick={() => handleAlignChange('left')}
            className={`w-8 h-8 flex items-center justify-center rounded-lg ${
              currentAlign === 'left' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleAlignChange('center')}
            className={`w-8 h-8 flex items-center justify-center rounded-lg ${
              currentAlign === 'center' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'
            }`}
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleAlignChange('right')}
            className={`w-8 h-8 flex items-center justify-center rounded-lg ${
              currentAlign === 'right' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'
            }`}
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* カラーパレット */}
      <div className="flex items-center gap-2 pt-0.5 overflow-x-auto pb-0.5">
        <span className="text-[11px] font-bold text-slate-500 shrink-0">文字色:</span>
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handleColorChange(color)}
            className={`w-7 h-7 rounded-full shrink-0 border-2 transition-all ${
              currentColor.toLowerCase() === color.toLowerCase()
                ? 'border-blue-600 scale-110 shadow-xs ring-2 ring-blue-500/20'
                : 'border-slate-200'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}

        {/* カラーピッカー */}
        <label className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center bg-slate-100 cursor-pointer shrink-0 relative overflow-hidden">
          <Palette className="w-4 h-4 text-slate-600" />
          <input
            type="color"
            value={currentColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      </div>

      {/* フォント一覧＆ライブプレビューモーダル */}
      <FontPickerModal
        isOpen={isFontModalOpen}
        currentFontFamily={currentFontFamily}
        previewText={rawText}
        onSelectFont={handleSelectFont}
        onClose={() => setIsFontModalOpen(false)}
      />
    </div>
  );
};
