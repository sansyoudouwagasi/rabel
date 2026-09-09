import React, { useEffect, useState } from 'react';
import type { SavedLabel } from '../types/label';
import { getRecentLabels, deleteLabel, duplicateLabel } from '../db/labelRepository';
import { LabelCard } from '../components/LabelCard';
import { ConfirmModal } from '../components/ConfirmModal';
import { Plus, Tag, Sparkles, ArrowRight } from 'lucide-react';

interface HomeProps {
  onCreateNew: () => void;
  onEditLabel: (label: SavedLabel) => void;
  onViewAllSaved: () => void;
}

export const Home: React.FC<HomeProps> = ({
  onCreateNew,
  onEditLabel,
  onViewAllSaved,
}) => {
  const [recentLabels, setRecentLabels] = useState<SavedLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [labelToDelete, setLabelToDelete] = useState<SavedLabel | null>(null);

  const loadRecent = async () => {
    setLoading(true);
    const labels = await getRecentLabels(4);
    setRecentLabels(labels);
    setLoading(false);
  };

  useEffect(() => {
    loadRecent();
  }, []);

  const handleDuplicate = async (label: SavedLabel) => {
    await duplicateLabel(label.id);
    await loadRecent();
  };

  const handleConfirmDelete = async () => {
    if (!labelToDelete) return;
    await deleteLabel(labelToDelete.id);
    setLabelToDelete(null);
    await loadRecent();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* ヒーローヘッダー */}
      <header className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-5 pt-7 pb-8 rounded-b-3xl shadow-md">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-xs">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-semibold tracking-wider text-blue-100 uppercase">
              スマホで簡単作成
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white mb-1.5">
            かんたんラベルメーカー
          </h1>
          <p className="text-xs text-blue-100/90 leading-relaxed">
            スマホで商品ラベル・値札・シールをすぐに作って、画像やPDFで保存・印刷できます。
          </p>

          {/* メインアクション：＋ 新しく作る */}
          <div className="mt-6">
            <button
              type="button"
              onClick={onCreateNew}
              className="w-full h-14 bg-white hover:bg-slate-50 text-blue-600 font-extrabold text-lg rounded-2xl shadow-lg flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all touch-manipulation cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600 stroke-[3]" />
              </div>
              <span>＋ 新しく作る</span>
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">
        {/* 最近作ったラベル */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>最近作ったラベル</span>
            </h2>
            {recentLabels.length > 0 && (
              <button
                type="button"
                onClick={onViewAllSaved}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                <span>すべて見る</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 bg-slate-200/70 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : recentLabels.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {recentLabels.map((label) => (
                <LabelCard
                  key={label.id}
                  label={label}
                  onEdit={onEditLabel}
                  onDuplicate={handleDuplicate}
                  onDelete={(l) => setLabelToDelete(l)}
                  showActions
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/80 shadow-2xs space-y-3">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">
                  まだラベルがありません
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  上の「＋ 新しく作る」ボタンから<br />最初のラベルを作ってみましょう！
                </p>
              </div>
            </div>
          )}
        </section>

        {/* 便利なポイント紹介 */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            かんたん3ステップ
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-700">
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-xs font-bold mb-1.5">
                1
              </div>
              <span className="font-bold">サイズを選ぶ</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-xs font-bold mb-1.5">
                2
              </div>
              <span className="font-bold">文字・写真を配置</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-xs font-bold mb-1.5">
                3
              </div>
              <span className="font-bold">保存・印刷</span>
            </div>
          </div>
        </section>
      </main>

      {/* 削除確認モーダル */}
      <ConfirmModal
        isOpen={Boolean(labelToDelete)}
        title="ラベルの削除"
        message={`「${labelToDelete?.name}」を完全に削除してもよろしいですか？この操作は元に戻せません。`}
        confirmText="削除する"
        onConfirm={handleConfirmDelete}
        onCancel={() => setLabelToDelete(null)}
      />
    </div>
  );
};
