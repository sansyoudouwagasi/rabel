import React from 'react';
import * as fabric from 'fabric';
import { Bold, AlignLeft, AlignCenter, AlignRight, Plus, Minus, Palette } from 'lucide-react';
import { toVerticalText, toHorizontalText } from '../../utils/textDirection';

interface TextPropertyPanelProps {
  textObject: fabric.IText;
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

export const TextPropertyPanel: React.FC<TextPropertyPanelProps> = ({
  textObject,
  onUpdate,
}) => {
  const isVertical = Boolean((textObject as unknown as { isVertical?: boolean }).isVertical);

  // rawText（ユーザーが入力した生のテキスト）を取得
  const rawText =
    (textObject as unknown as { rawText?: string }).rawText ??
    (isVertical ? toHorizontalText(textObject.text || '') : textObject.text || '');

  const currentFontSize = Math.round(textObject.fontSize || 36);
  const isBold = textObject.fontWeight === 'bold';
  const currentAlign = textObject.textAlign || 'left';
  const currentColor = (textObject.fill as string) || '#1e293b';
  const currentFontFamily = textObject.fontFamily || 'sans-serif';

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newRaw = e.target.value;
    (textObject as unknown as { rawText?: string }).rawText = newRaw;

    if (isVertical) {
      textObject.set('text', toVerticalText(newRaw));
    } else {
      textObject.set('text', newRaw);
    }
    onUpdate();
  };

  const handleToggleDirection = (direction: 'horizontal' | 'vertical') => {
    const wantVertical = direction === 'vertical';
    if (wantVertical === isVertical) return;

    (textObject as unknown as { isVertical?: boolean }).isVertical = wantVertical;
    (textObject as unknown as { rawText?: string }).rawText = rawText;

    if (wantVertical) {
      textObject.set({
        text: toVerticalText(rawText),
        textAlign: 'center',
        lineHeight: 1.05,
      });
    } else {
      textObject.set({
        text: rawText,
        textAlign: 'left',
        lineHeight: 1.16,
      });
    }
    onUpdate();
  };

  const handleFontSizeDelta = (delta: number) => {
    const newSize = Math.max(12, Math.min(200, currentFontSize + delta));
    textObject.set('fontSize', newSize);
    onUpdate();
  };

  const handleToggleBold = () => {
    textObject.set('fontWeight', isBold ? 'normal' : 'bold');
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

  const handleFontChange = (font: string) => {
    textObject.set('fontFamily', font);
    onUpdate();
  };

  return (
    <div className="bg-white p-3 border-t border-slate-200 space-y-3">
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
          rows={isVertical ? 2 : 1}
          value={rawText}
          onChange={handleTextChange}
          className="w-full min-h-[40px] px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder={isVertical ? '縦書き文字を入力 (改行で複数列)' : '文字を入力'}
        />
      </div>

      {/* スタイル操作（サイズ、太字、揃え、フォント） */}
      <div className="flex flex-wrap items-center gap-2">
        {/* フォント種類 */}
        <select
          value={currentFontFamily.includes('serif') ? 'mincho' : 'gothic'}
          onChange={(e) =>
            handleFontChange(
              e.target.value === 'mincho'
                ? '"Yu Mincho", "Hiragino Mincho ProN", serif'
                : '"Yu Gothic", "Hiragino Sans", sans-serif'
            )
          }
          className="h-9 px-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
        >
          <option value="gothic">ゴシック体</option>
          <option value="mincho">明朝体 (和風)</option>
        </select>

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
      <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
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
    </div>
  );
};
