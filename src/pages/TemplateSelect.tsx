import React, { useState } from 'react';
import {
  getOrientedLabelSize,
  type LabelSize,
  type LabelOrientation,
} from '../types/label';
import { TEMPLATES, type LabelTemplate } from '../templates/templates';
import { Header } from '../components/Header';
import {
  Sparkles,
  FileText,
  RectangleHorizontal,
  RectangleVertical,
} from 'lucide-react';

interface TemplateSelectProps {
  size: LabelSize;
  onBack: () => void;
  onChangeSize?: (newSize: LabelSize) => void;
  onSelectTemplate: (template: LabelTemplate | null, finalSize: LabelSize) => void;
}

type CategoryTab = 'all' | 'simple' | 'japanese' | 'product' | 'promo';

export const TemplateSelect: React.FC<TemplateSelectProps> = ({
  size,
  onBack,
  onChangeSize,
  onSelectTemplate,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('all');
  const [currentSize, setCurrentSize] = useState<LabelSize>(size);

  const isPortrait =
    currentSize.labelOrientation === 'portrait' || currentSize.height > currentSize.width;

  const landscapeSize = getOrientedLabelSize(currentSize, 'landscape');
  const portraitSize = getOrientedLabelSize(currentSize, 'portrait');

  const handleOrientationChange = (orientation: LabelOrientation) => {
    const updated = getOrientedLabelSize(currentSize, orientation);
    setCurrentSize(updated);
    onChangeSize?.(updated);
  };

  const categories = [
    { id: 'all' as const, label: 'すべて' },
    { id: 'simple' as const, label: 'シンプル' },
    { id: 'japanese' as const, label: '和風' },
    { id: 'product' as const, label: '商品・値札' },
    { id: 'promo' as const, label: 'SALE・販促' },
  ];

  const filteredTemplates = activeCategory === 'all'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Header title="向きとデザインを選ぶ" showBack onBack={onBack} />

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* ラベルの向き（横向き / 縦向き）選択カード */}
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-3.5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {isPortrait ? (
                <RectangleVertical className="w-4 h-4 text-blue-600" />
              ) : (
                <RectangleHorizontal className="w-4 h-4 text-blue-600" />
              )}
              <span className="text-xs font-extrabold text-slate-800">
                編集するラベルの向き
              </span>
            </div>
            <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {isPortrait ? '縦向き' : '横向き'} ({currentSize.width} × {currentSize.height} mm)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleOrientationChange('landscape')}
              className={`py-2.5 px-3 rounded-xl border-2 text-left transition-all flex items-center gap-2.5 touch-manipulation ${
                !isPortrait
                  ? 'bg-blue-50/90 border-blue-600 text-blue-900 shadow-2xs ring-2 ring-blue-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-8 h-6 rounded-xs border-2 flex flex-col items-center justify-center gap-0.5 shrink-0 ${
                  !isPortrait
                    ? 'bg-white border-blue-600 text-blue-600'
                    : 'bg-white border-slate-400 text-slate-400'
                }`}
              >
                <div className="w-4 h-0.5 bg-current rounded-full" />
                <div className="w-3 h-0.5 bg-current rounded-full opacity-70" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold leading-tight">横向きで編集</div>
                <div className="text-[10px] opacity-80 font-semibold mt-0.5">
                  {landscapeSize.width} × {landscapeSize.height} mm
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleOrientationChange('portrait')}
              className={`py-2.5 px-3 rounded-xl border-2 text-left transition-all flex items-center gap-2.5 touch-manipulation ${
                isPortrait
                  ? 'bg-blue-50/90 border-blue-600 text-blue-900 shadow-2xs ring-2 ring-blue-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="w-8 h-7 flex items-center justify-center shrink-0">
                <div
                  className={`w-5.5 h-7 rounded-xs border-2 flex items-center justify-center gap-0.5 ${
                    isPortrait
                      ? 'bg-white border-blue-600 text-blue-600'
                      : 'bg-white border-slate-400 text-slate-400'
                  }`}
                >
                  <div className="w-0.5 h-4 bg-current rounded-full opacity-70" />
                  <div className="w-0.5 h-4.5 bg-current rounded-full" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold leading-tight">縦向きで編集</div>
                <div className="text-[10px] opacity-80 font-semibold mt-0.5">
                  {portraitSize.width} × {portraitSize.height} mm
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* カテゴリタブ */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 白紙から作るカード */}
        <button
          type="button"
          onClick={() => onSelectTemplate(null, currentSize)}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/30 text-left transition-all flex items-center justify-between group touch-manipulation"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600 flex items-center justify-center transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 group-hover:text-blue-600">
                白紙から自分で作る ({isPortrait ? '縦向き' : '横向き'})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentSize.width}×{currentSize.height}mm の白紙に文字や写真を自由配置
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0">
            編集へ →
          </span>
        </button>

        {/* テンプレートカード一覧 */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectTemplate(template, currentSize)}
              className="bg-white rounded-2xl p-3 border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between group touch-manipulation"
            >
              {/* プレビュー風ボックス (選択中の向きに合わせて横長/縦長で表示) */}
              <div className="w-full h-28 bg-slate-100/80 rounded-xl flex items-center justify-center p-2 overflow-hidden">
                <div
                  className={`${
                    isPortrait ? 'w-16 h-24' : 'w-full h-20'
                  } rounded-lg border border-slate-300/90 p-1.5 flex flex-col items-center justify-center relative overflow-hidden shadow-xs group-hover:scale-[1.03] transition-all`}
                  style={{ backgroundColor: template.backgroundColor }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-400 mb-0.5 opacity-50 shrink-0" />
                  <span
                    className={`text-[10px] font-bold text-center line-clamp-2 px-1 leading-tight ${
                      template.backgroundColor === '#0f172a' ? 'text-slate-100' : 'text-slate-700'
                    }`}
                  >
                    {template.name}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold mt-0.5 ${
                      template.backgroundColor === '#0f172a' ? 'text-amber-400' : 'text-red-600'
                    }`}
                  >
                    ¥280
                  </span>
                </div>
              </div>

              <div className="mt-2.5 px-0.5">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-bold text-xs text-slate-800 group-hover:text-blue-600 truncate">
                    {template.name}
                  </h4>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-slate-100 text-slate-500 shrink-0">
                    {isPortrait ? '縦' : '横'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {template.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};
