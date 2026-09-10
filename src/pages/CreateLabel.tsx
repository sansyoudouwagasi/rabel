import React, { useState } from 'react';
import { PRESET_SIZES, type LabelSize } from '../types/label';
import { Header } from '../components/Header';
import { Check, Sparkles, SlidersHorizontal, AlertCircle } from 'lucide-react';

interface CreateLabelProps {
  onBack: () => void;
  onSelectSize: (size: LabelSize) => void;
}

export const CreateLabel: React.FC<CreateLabelProps> = ({
  onBack,
  onSelectSize,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<LabelSize>(PRESET_SIZES[2]); // デフォルト 50×30
  const [isCustom, setIsCustom] = useState(false);
  const [customWidth, setCustomWidth] = useState('50');
  const [customHeight, setCustomHeight] = useState('30');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePresetSelect = (size: LabelSize) => {
    setSelectedPreset(size);
    setIsCustom(false);
    setErrorMessage('');
  };

  const handleProceed = () => {
    if (isCustom) {
      const w = parseFloat(customWidth);
      const h = parseFloat(customHeight);

      if (isNaN(w) || isNaN(h) || w < 10 || w > 297 || h < 10 || h > 297) {
        setErrorMessage('ラベルサイズを正しく入力してください (幅・高さ: 10〜297mm)');
        return;
      }

      onSelectSize({
        width: Math.round(w),
        height: Math.round(h),
        name: `カスタム (${Math.round(w)}×${Math.round(h)}mm)`,
      });
    } else {
      onSelectSize(selectedPreset);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Header title="ラベルのサイズを選ぶ" showBack onBack={onBack} />

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* 説明バナー */}
        <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900 leading-relaxed font-medium">
            作りたいシールのサイズを選んでください。<br />
            後から文字や写真を追加できます。
          </p>
        </div>

        {/* プリセット選択 */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase px-1">
            定番サイズから選ぶ
          </h2>

          <div className="grid grid-cols-1 gap-2.5">
            {PRESET_SIZES.map((size) => {
              const isSelected = !isCustom && selectedPreset.width === size.width && selectedPreset.height === size.height;
              return (
                <button
                  key={`${size.width}x${size.height}`}
                  type="button"
                  onClick={() => handlePresetSelect(size)}
                  className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all min-h-[56px] touch-manipulation ${
                    isSelected
                      ? 'bg-blue-50/60 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="border border-dashed border-slate-400 bg-slate-100 rounded-xs flex items-center justify-center shrink-0"
                      style={{
                        width: `${Math.min(size.width * 0.8, 54)}px`,
                        height: `${Math.min(size.height * 0.8, 38)}px`,
                      }}
                    />
                    <div>
                      <span className="text-base font-bold text-slate-800">
                        {size.width} × {size.height} mm
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {size.name?.split('(')[1]?.replace(')', '') || '汎用'}
                      </p>
                    </div>
                  </div>

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* カスタムサイズ */}
        <div className="space-y-3 pt-2">
          <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase px-1">
            サイズを直接指定する
          </h2>

          <button
            type="button"
            onClick={() => {
              setIsCustom(true);
              setErrorMessage('');
            }}
            className={`w-full p-4 rounded-2xl border text-left transition-all ${
              isCustom
                ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-sm text-slate-800">カスタムサイズ</span>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                isCustom
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}>
                {isCustom && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {isCustom && (
              <div className="pt-2 border-t border-blue-100 flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    幅 (mm)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="297"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="w-full h-11 px-3 bg-white border border-slate-300 rounded-xl text-center font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="50"
                  />
                </div>
                <span className="text-slate-400 font-bold mt-5">×</span>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    高さ (mm)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="297"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="w-full h-11 px-3 bg-white border border-slate-300 rounded-xl text-center font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="30"
                  />
                </div>
              </div>
            )}
          </button>
        </div>

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 決定ボタン */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleProceed}
            className="w-full h-13 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center text-base"
          >
            このサイズでデザインに進む
          </button>
        </div>
      </main>
    </div>
  );
};
