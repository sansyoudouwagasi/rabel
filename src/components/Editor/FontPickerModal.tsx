import React, { useState } from 'react';
import { X, Check, Loader2, Type, Sparkles } from 'lucide-react';
import {
  FONT_CATEGORIES,
  LABEL_FONTS,
  findFontPreset,
  type FontCategory,
  type LabelFontPreset,
} from '../../utils/fonts';

interface FontPickerModalProps {
  isOpen: boolean;
  currentFontFamily?: string;
  previewText: string;
  onSelectFont: (font: LabelFontPreset) => Promise<void> | void;
  onClose: () => void;
}

const DEFAULT_SAMPLE = 'クッキー・焼菓子 120円';

export const FontPickerModal: React.FC<FontPickerModalProps> = ({
  isOpen,
  currentFontFamily,
  previewText,
  onSelectFont,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<FontCategory>('all');
  const [customPreview, setCustomPreview] = useState<string>('');
  const [loadingFontId, setLoadingFontId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPreset = findFontPreset(currentFontFamily);
  const filteredFonts =
    activeCategory === 'all'
      ? LABEL_FONTS
      : LABEL_FONTS.filter((f) => f.category === activeCategory);

  const cleanedLabelText = previewText.replace(/\s+/g, ' ').trim();
  const displayPreview = customPreview.trim() || cleanedLabelText || DEFAULT_SAMPLE;

  const handleChoose = async (font: LabelFontPreset) => {
    setLoadingFontId(font.id);
    try {
      await onSelectFont(font);
      onClose();
    } finally {
      setLoadingFontId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[88dvh] overflow-hidden">
        {/* ヘッダー */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-sm">
              Aa
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">フォント（書体）を選ぶ</h2>
              <p className="text-[10px] text-slate-500">
                文字の見本を見ながらお好みの書体をタップしてください（商用利用可）
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* プレビュー文字テスト欄 */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-100 shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Type className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customPreview}
                onChange={(e) => setCustomPreview(e.target.value)}
                placeholder={`見本文字を変更 (現在: ${cleanedLabelText || DEFAULT_SAMPLE})`}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {customPreview && (
              <button
                type="button"
                onClick={() => setCustomPreview('')}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 px-2 py-1"
              >
                リセット
              </button>
            )}
          </div>

          {/* カテゴリフィルター */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {FONT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* フォントカード一覧 */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-slate-50">
          {filteredFonts.map((font) => {
            const isSelected = currentPreset.id === font.id;
            const isLoading = loadingFontId === font.id;

            return (
              <button
                key={font.id}
                type="button"
                disabled={loadingFontId !== null}
                onClick={() => handleChoose(font)}
                className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all active:scale-[0.99] flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-600 shadow-xs ring-2 ring-blue-500/15'
                    : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-extrabold text-slate-800 truncate">
                      {font.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                      {font.tag}
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    {isLoading ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        読込中
                      </span>
                    ) : isSelected ? (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                        <Check className="w-3.5 h-3.5" />
                        選択中
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* 実際のフォントでの見本プレビュー */}
                <div
                  className="w-full px-3 py-2 bg-slate-50/90 border border-slate-200/80 rounded-xl text-xl sm:text-2xl text-slate-900 truncate leading-snug"
                  style={{ fontFamily: font.fontFamily }}
                >
                  {displayPreview}
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">{font.description}</p>
              </button>
            );
          })}

          <div className="pt-1 pb-2 text-center">
            <p className="inline-flex items-center gap-1 text-[10px] text-slate-400">
              <Sparkles className="w-3 h-3" />
              すべての収録書体は商用印刷・ラベル販売にも安心してご利用いただけます
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

