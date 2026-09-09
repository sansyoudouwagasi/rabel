import React from 'react';
import type { SavedLabel } from '../types/label';
import { Copy, Trash2, Printer, Edit3 } from 'lucide-react';

interface LabelCardProps {
  label: SavedLabel;
  onEdit: (label: SavedLabel) => void;
  onDuplicate?: (label: SavedLabel) => void;
  onDelete?: (label: SavedLabel) => void;
  onPrint?: (label: SavedLabel) => void;
  showActions?: boolean;
}

export const LabelCard: React.FC<LabelCardProps> = ({
  label,
  onEdit,
  onDuplicate,
  onDelete,
  onPrint,
  showActions = false,
}) => {
  const formattedDate = new Date(label.updatedAt).toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      {/* サムネイル & タップで編集 */}
      <button
        type="button"
        onClick={() => onEdit(label)}
        className="w-full text-left group flex flex-col items-center"
      >
        <div className="w-full aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-100 relative">
          {label.thumbnailUrl ? (
            <img
              src={label.thumbnailUrl}
              alt={label.name}
              className="max-h-full max-w-full object-contain shadow-xs rounded-xs"
            />
          ) : (
            <div className="text-xs text-slate-400 font-medium">プレビューなし</div>
          )}
          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-slate-900/70 text-white rounded-md">
            {label.width}×{label.height}mm
          </span>
        </div>

        <div className="w-full mt-2.5 px-0.5">
          <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">
            {label.name}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            更新: {formattedDate}
          </p>
        </div>
      </button>

      {/* アクションボタン */}
      {showActions ? (
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onEdit(label)}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs flex items-center gap-1 font-medium"
            title="編集"
          >
            <Edit3 className="w-4 h-4" />
            <span>編集</span>
          </button>

          <div className="flex items-center gap-1">
            {onDuplicate && (
              <button
                type="button"
                onClick={() => onDuplicate(label)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                title="複製"
                aria-label="複製"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            {onPrint && (
              <button
                type="button"
                onClick={() => onPrint(label)}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                title="印刷"
                aria-label="印刷"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(label)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                title="削除"
                aria-label="削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-2 text-right">
          <span className="text-[11px] text-blue-600 font-semibold group-hover:underline">
            編集する →
          </span>
        </div>
      )}
    </div>
  );
};
