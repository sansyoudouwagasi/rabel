import React, { useEffect, useState } from 'react';
import type { SavedLabel } from '../types/label';
import { getAllLabels, deleteLabel, duplicateLabel } from '../db/labelRepository';
import { Header } from '../components/Header';
import { LabelCard } from '../components/LabelCard';
import { Plus, FolderHeart } from 'lucide-react';

import { ConfirmModal } from '../components/ConfirmModal';

interface SavedLabelsProps {
  onCreateNew: () => void;
  onEditLabel: (label: SavedLabel) => void;
  onPrintLabel: (label: SavedLabel) => void;
}

export const SavedLabels: React.FC<SavedLabelsProps> = ({
  onCreateNew,
  onEditLabel,
  onPrintLabel,
}) => {
  const [labels, setLabels] = useState<SavedLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [labelToDelete, setLabelToDelete] = useState<SavedLabel | null>(null);

  const loadLabels = async () => {
    setLoading(true);
    const list = await getAllLabels();
    setLabels(list);
    setLoading(false);
  };

  useEffect(() => {
    loadLabels();
  }, []);

  const handleDuplicate = async (label: SavedLabel) => {
    await duplicateLabel(label.id);
    await loadLabels();
  };

  const handleConfirmDelete = async () => {
    if (!labelToDelete) return;
    await deleteLabel(labelToDelete.id);
    setLabelToDelete(null);
    await loadLabels();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Header
        title="保存したラベル"
        rightAction={
          <button
            type="button"
            onClick={onCreateNew}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"
            title="新規作成"
            aria-label="新規作成"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <main className="max-w-md mx-auto p-4 space-y-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-slate-200/70 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : labels.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {labels.map((label) => (
              <LabelCard
                key={label.id}
                label={label}
                onEdit={onEditLabel}
                onDuplicate={handleDuplicate}
                onDelete={(l) => setLabelToDelete(l)}
                onPrint={onPrintLabel}
                showActions
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-2xs space-y-4 my-8">
            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
              <FolderHeart className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                保存されたラベルはありません
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                作成したラベルはここに保存され、<br />
                いつでも再編集や複製・印刷ができます。
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={onCreateNew}
                className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>新しいラベルを作る</span>
              </button>
            </div>
          </div>
        )}
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
