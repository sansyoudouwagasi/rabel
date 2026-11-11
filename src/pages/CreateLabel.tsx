import React, { useState } from 'react';
import {
  PRESET_SIZES,
  A4_SHEET_PRESETS,
  getOrientedLabelSize,
  isSheet24Size,
  isSheet44Size,
  type LabelSize,
  type LabelOrientation,
} from '../types/label';
import { Header } from '../components/Header';
import {
  Check,
  Sparkles,
  SlidersHorizontal,
  AlertCircle,
  FileText,
  LayoutGrid,
  RectangleHorizontal,
  RectangleVertical,
} from 'lucide-react';

interface CreateLabelProps {
  initialSize?: LabelSize;
  onBack: () => void;
  onSelectSize: (size: LabelSize) => void;
}

export const CreateLabel: React.FC<CreateLabelProps> = ({
  initialSize,
  onBack,
  onSelectSize,
}) => {
  // ラベル自体の向き（横向き / 縦向き）
  const initialLabelOrientation: LabelOrientation = initialSize
    ? initialSize.labelOrientation || (initialSize.height > initialSize.width ? 'portrait' : 'landscape')
    : 'landscape';

  const [labelOrientation, setLabelOrientation] = useState<LabelOrientation>(initialLabelOrientation);

  // A4 用紙の向き（汎用・カスタム時の面付け用）
  const [paperOrientation, setPaperOrientation] = useState<'portrait' | 'landscape'>(
    initialSize?.paperOrientation || 'portrait'
  );

  // 初期選択プリセットの復元
  const [selectedPreset, setSelectedPreset] = useState<LabelSize>(() => {
    if (initialSize && initialSize.formatType !== 'custom') {
      return getOrientedLabelSize(initialSize, initialLabelOrientation);
    }
    return getOrientedLabelSize(A4_SHEET_PRESETS[0], initialLabelOrientation);
  });

  const [isCustom, setIsCustom] = useState(initialSize?.formatType === 'custom');
  const [customWidth, setCustomWidth] = useState(
    initialSize?.formatType === 'custom' ? String(initialSize.width) : '50'
  );
  const [customHeight, setCustomHeight] = useState(
    initialSize?.formatType === 'custom' ? String(initialSize.height) : '30'
  );
  const [errorMessage, setErrorMessage] = useState('');

  // A4フルサイズオブジェクト (ラベルの向きに連動)
  const fullA4Size: LabelSize = getOrientedLabelSize(
    { width: 297, height: 210, name: 'A4横 1枚全面 (297×210mm)', formatType: 'full_a4' },
    labelOrientation
  );

  const isFullA4Selected =
    !isCustom &&
    (selectedPreset.formatType === 'full_a4' ||
      (Math.max(selectedPreset.width, selectedPreset.height) === 297 &&
        Math.min(selectedPreset.width, selectedPreset.height) === 210));

  // ラベル自体の向き（横向き / 縦向き）切り替え
  const handleLabelOrientationChange = (orientation: LabelOrientation) => {
    setLabelOrientation(orientation);
    setSelectedPreset((prev) => getOrientedLabelSize(prev, orientation));

    // カスタム寸法も向きに合わせて幅・高さを入れ替え
    const w = parseFloat(customWidth);
    const h = parseFloat(customHeight);
    if (!isNaN(w) && !isNaN(h)) {
      const longSide = Math.max(w, h);
      const shortSide = Math.min(w, h);
      if (orientation === 'landscape') {
        setCustomWidth(String(longSide));
        setCustomHeight(String(shortSide));
      } else {
        setCustomWidth(String(shortSide));
        setCustomHeight(String(longSide));
      }
    }
  };

  // A4用紙の向き切り替え（汎用サイズ・全面用）
  const handlePaperOrientationChange = (orientation: 'portrait' | 'landscape') => {
    setPaperOrientation(orientation);
    if (isFullA4Selected) {
      setLabelOrientation(orientation);
      setSelectedPreset(
        getOrientedLabelSize(
          { width: 297, height: 210, name: 'A4 1枚全面', formatType: 'full_a4' },
          orientation
        )
      );
    }
  };

  const handlePresetSelect = (basePreset: LabelSize) => {
    const oriented = getOrientedLabelSize(basePreset, labelOrientation);
    setSelectedPreset(oriented);
    if (oriented.paperOrientation) {
      setPaperOrientation(oriented.paperOrientation);
    }
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

      const finalW = Math.round(w);
      const finalH = Math.round(h);
      const actualOrientation: LabelOrientation = finalH > finalW ? 'portrait' : 'landscape';

      onSelectSize({
        width: finalW,
        height: finalH,
        name: `カスタム (${finalW}×${finalH}mm)`,
        labelOrientation: actualOrientation,
        paperOrientation,
        formatType: 'custom',
      });
    } else {
      const oriented = getOrientedLabelSize(selectedPreset, labelOrientation);
      onSelectSize({
        ...oriented,
        paperOrientation: oriented.sheetLayout
          ? oriented.paperOrientation
          : oriented.formatType === 'full_a4'
          ? labelOrientation
          : paperOrientation,
      });
    }
  };

  // 現在選択されている実効サイズのプレビュー文字列
  const currentActiveWidth = isCustom ? customWidth || '?' : selectedPreset.width;
  const currentActiveHeight = isCustom ? customHeight || '?' : selectedPreset.height;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Header title="ラベルの向き・サイズを選ぶ" showBack onBack={onBack} />

      <main className="max-w-md mx-auto p-4 space-y-5">
        {/* 説明バナー */}
        <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-3.5 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900 leading-relaxed font-medium">
            最初にラベル自体の向き（横向き・縦向き）を選び、使用するラベルサイズを選択してください。
          </p>
        </div>

        {/* 0. ラベル自体の向きを選ぶ (横向き / 縦向き) */}
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {labelOrientation === 'landscape' ? (
                <RectangleHorizontal className="w-4 h-4 text-blue-600" />
              ) : (
                <RectangleVertical className="w-4 h-4 text-blue-600" />
              )}
              <h2 className="text-xs font-extrabold text-slate-800 tracking-wide">
                1. ラベル自体の向きを選ぶ
              </h2>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {labelOrientation === 'landscape' ? '横向き（横長）' : '縦向き（縦長）'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* 横向きボタン */}
            <button
              type="button"
              onClick={() => handleLabelOrientationChange('landscape')}
              className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 touch-manipulation ${
                labelOrientation === 'landscape'
                  ? 'bg-blue-50/90 border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-11 h-8 rounded-md border-2 flex flex-col items-center justify-center gap-0.5 shrink-0 ${
                  labelOrientation === 'landscape'
                    ? 'bg-white border-blue-600 text-blue-600 shadow-2xs'
                    : 'bg-white border-slate-400 text-slate-400'
                }`}
              >
                <div className="w-6 h-0.5 bg-current rounded-full" />
                <div className="w-4 h-0.5 bg-current rounded-full opacity-70" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-800">横向き</div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  横に長い標準ラベル
                </div>
              </div>
            </button>

            {/* 縦向きボタン */}
            <button
              type="button"
              onClick={() => handleLabelOrientationChange('portrait')}
              className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 touch-manipulation ${
                labelOrientation === 'portrait'
                  ? 'bg-blue-50/90 border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-11 h-9 flex items-center justify-center shrink-0">
                <div
                  className={`w-7 h-9 rounded-md border-2 flex items-center justify-center gap-0.5 ${
                    labelOrientation === 'portrait'
                      ? 'bg-white border-blue-600 text-blue-600 shadow-2xs'
                      : 'bg-white border-slate-400 text-slate-400'
                  }`}
                >
                  <div className="w-0.5 h-5 bg-current rounded-full opacity-70" />
                  <div className="w-0.5 h-6 bg-current rounded-full" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-800">縦向き</div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  縦長・縦書きにも最適
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 1. 市販 A4規格ラベルシール (24面 / 44面) - 推奨フォーマット */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-700 tracking-wider">
                2. A4規格ラベルシートから選ぶ
              </h2>
            </div>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              エーワン等の定番用紙
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {A4_SHEET_PRESETS.map((basePreset) => {
              const preset = getOrientedLabelSize(basePreset, labelOrientation);
              const is24 = isSheet24Size(preset.width, preset.height, preset.formatType);
              const isSelected =
                !isCustom &&
                ((is24 && isSheet24Size(selectedPreset.width, selectedPreset.height, selectedPreset.formatType)) ||
                  (!is24 && isSheet44Size(selectedPreset.width, selectedPreset.height, selectedPreset.formatType)));

              const isPortrait = labelOrientation === 'portrait';

              return (
                <button
                  key={basePreset.formatType}
                  type="button"
                  onClick={() => handlePresetSelect(basePreset)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all min-h-[72px] touch-manipulation ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* A4シートのミニチュアグラフィック */}
                    <div
                      className={`${
                        isPortrait ? 'w-14 h-11' : 'w-11 h-14'
                      } bg-white border border-slate-300 rounded-xs p-0.5 flex flex-col justify-between shadow-xs shrink-0 transition-all`}
                    >
                      <div
                        className={`w-full h-full grid ${
                          is24
                            ? isPortrait
                              ? 'grid-cols-8 grid-rows-3'
                              : 'grid-cols-3 grid-rows-8'
                            : isPortrait
                            ? 'grid-cols-11 grid-rows-4'
                            : 'grid-cols-4 grid-rows-11'
                        } gap-[1px] bg-slate-200 p-[1px]`}
                      >
                        {Array.from({ length: is24 ? 24 : 44 }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`rounded-[0.5px] ${
                              isSelected ? 'bg-blue-500' : 'bg-white'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="text-base font-extrabold text-slate-800">
                          {preset.width} × {preset.height} mm
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {is24 ? '24面' : '44面'} ({isPortrait ? '縦向き' : '横向き'})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        {is24
                          ? isPortrait
                            ? '縦長ラベル編集 (33.9×66mm) / 24面用紙対応'
                            : '上余白 12.9mm / 左余白 6mm (3列×8行)'
                          : isPortrait
                          ? '縦長ラベル編集 (25.4×48.3mm) / 44面用紙対応'
                          : '上余白 8.8mm / 左余白 8.4mm (4列×11行)'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {is24
                          ? '標準宛名・商品パッケージ・和菓子帯シール等'
                          : 'バーコード・価格表示・小型商品シール等'}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 定番ラベルシール (A4用紙に面付け) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              汎用ラベルサイズから選ぶ ({labelOrientation === 'portrait' ? '縦向き' : '横向き'})
            </h2>
            <span className="text-[11px] text-slate-400">
              自動余白でA4に均等配置
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {PRESET_SIZES.map((baseSize) => {
              const size = getOrientedLabelSize(baseSize, labelOrientation);
              const isSelected =
                !isCustom &&
                selectedPreset.width === size.width &&
                selectedPreset.height === size.height &&
                !selectedPreset.sheetLayout &&
                selectedPreset.formatType === 'preset';

              return (
                <button
                  key={`${baseSize.width}x${baseSize.height}`}
                  type="button"
                  onClick={() => handlePresetSelect(baseSize)}
                  className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all min-h-[56px] touch-manipulation ${
                    isSelected
                      ? 'bg-blue-50/60 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="border border-dashed border-slate-400 bg-slate-100 rounded-xs flex items-center justify-center shrink-0 transition-all"
                      style={{
                        width: `${Math.min(size.width * 0.75, 54)}px`,
                        height: `${Math.min(size.height * 0.75, 54)}px`,
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-800">
                          {size.width} × {size.height} mm
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {labelOrientation === 'portrait' ? '縦向き' : '横向き'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {baseSize.name?.split('(')[1]?.replace(')', '') || '汎用'}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. A4 1枚全面カード */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase px-1">
            A4用紙 1枚全面で作成
          </h2>

          <button
            type="button"
            onClick={() => handlePresetSelect(fullA4Size)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all min-h-[56px] touch-manipulation ${
              isFullA4Selected
                ? 'bg-blue-50/60 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="border-2 border-dashed border-blue-400 bg-blue-50/50 rounded-xs flex items-center justify-center shrink-0 transition-all"
                style={{
                  width: labelOrientation === 'landscape' ? '48px' : '34px',
                  height: labelOrientation === 'landscape' ? '34px' : '48px',
                }}
              >
                <span className="text-[9px] font-bold text-blue-600">A4</span>
              </div>
              <div>
                <span className="text-base font-bold text-slate-800">
                  {fullA4Size.width} × {fullA4Size.height} mm
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {labelOrientation === 'landscape'
                    ? 'A4横 1枚全面 (POP・チラシ・案内板)'
                    : 'A4縦 1枚全面 (ポスター・メニュー表)'}
                </p>
              </div>
            </div>

            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                isFullA4Selected
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {isFullA4Selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </button>
        </div>

        {/* 4. カスタムサイズ */}
        <div className="space-y-2 pt-1">
          <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase px-1">
            ラベル寸法を直接指定する
          </h2>

          <div
            onClick={() => {
              if (!isCustom) {
                setIsCustom(true);
                setErrorMessage('');
              }
            }}
            className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              isCustom
                ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-sm text-slate-800">カスタム寸法</span>
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                  isCustom
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isCustom && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {isCustom && (
              <div className="pt-2 border-t border-blue-100 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      幅 (mm)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="297"
                      value={customWidth}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomWidth(val);
                        const w = parseFloat(val);
                        const h = parseFloat(customHeight);
                        if (!isNaN(w) && !isNaN(h)) {
                          setLabelOrientation(h > w ? 'portrait' : 'landscape');
                        }
                      }}
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
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomHeight(val);
                        const w = parseFloat(customWidth);
                        const h = parseFloat(val);
                        if (!isNaN(w) && !isNaN(h)) {
                          setLabelOrientation(h > w ? 'portrait' : 'landscape');
                        }
                      }}
                      className="w-full h-11 px-3 bg-white border border-slate-300 rounded-xl text-center font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="30"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  上部の「横向き / 縦向き」ボタンで幅と高さを簡単に入れ替えられます
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 5. A4 用紙の向き選択（汎用サイズ・カスタム寸法の印刷用） */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">印刷するA4用紙の向き</span>
            </div>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              {paperOrientation === 'landscape' ? 'A4 横向き (297×210mm)' : 'A4 縦向き (210×297mm)'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handlePaperOrientationChange('portrait')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                paperOrientation === 'portrait'
                  ? 'bg-white text-blue-600 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-3.5 h-4.5 border-2 border-current rounded-xs shrink-0" />
              <span>縦向き (210×297)</span>
            </button>

            <button
              type="button"
              onClick={() => handlePaperOrientationChange('landscape')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                paperOrientation === 'landscape'
                  ? 'bg-white text-blue-600 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-4.5 h-3.5 border-2 border-current rounded-xs shrink-0" />
              <span>横向き (297×210)</span>
            </button>
          </div>
        </div>

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 決定ボタン */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleProceed}
            className="w-full h-13 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base"
          >
            <span>
              {labelOrientation === 'portrait' ? '縦向き' : '横向き'} ({currentActiveWidth}×{currentActiveHeight}mm) でデザインに進む
            </span>
          </button>
        </div>
      </main>
    </div>
  );
};
