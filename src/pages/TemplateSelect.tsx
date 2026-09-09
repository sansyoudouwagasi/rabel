import React, { useState } from 'react';
import type { LabelSize } from '../types/label';
import { TEMPLATES, type LabelTemplate } from '../templates/templates';
import { Header } from '../components/Header';
import { Sparkles, FileText } from 'lucide-react';

interface TemplateSelectProps {
  size: LabelSize;
  onBack: () => void;
  onSelectTemplate: (template: LabelTemplate | null) => void;
}

type CategoryTab = 'all' | 'simple' | 'japanese' | 'product' | 'promo';

export const TemplateSelect: React.FC<TemplateSelectProps> = ({
  size,
  onBack,
  onSelectTemplate,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('all');

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
      <Header title="デザインを選ぶ" showBack onBack={onBack} />

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* サブヘッダー */}
        <div className="flex items-center justify-between px-1">
          <div>
            <span className="text-xs font-bold text-slate-500">選択中サイズ:</span>
            <span className="text-xs font-extrabold text-blue-600 ml-1.5 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              {size.width} × {size.height} mm
            </span>
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
          onClick={() => onSelectTemplate(null)}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/30 text-left transition-all flex items-center justify-between group touch-manipulation"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600 flex items-center justify-center transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 group-hover:text-blue-600">
                白紙から自分で作る
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                文字や写真をご自身で自由に配置します
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
            選択 →
          </span>
        </button>

        {/* テンプレートカード一覧 */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectTemplate(template)}
              className="bg-white rounded-2xl p-3 border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between group touch-manipulation"
            >
              {/* プレビュー風ボックス */}
              <div
                className="w-full aspect-[4/3] rounded-xl border border-slate-200/80 p-2 flex flex-col items-center justify-center relative overflow-hidden shadow-2xs group-hover:scale-[1.02] transition-transform"
                style={{ backgroundColor: template.backgroundColor }}
              >
                <Sparkles className="w-4 h-4 text-slate-400 mb-1 opacity-50" />
                <span className="text-[11px] font-bold text-slate-700 text-center line-clamp-1 px-1">
                  {template.name}
                </span>
                <span className="text-[10px] text-red-600 font-extrabold mt-0.5">
                  ¥280
                </span>
              </div>

              <div className="mt-2.5 px-0.5">
                <h4 className="font-bold text-xs text-slate-800 group-hover:text-blue-600 truncate">
                  {template.name}
                </h4>
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
