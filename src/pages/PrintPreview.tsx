import React, { useState, useMemo } from 'react';
import type { SavedLabel } from '../types/label';
import { Header } from '../components/Header';
import { exportA4SheetPdf, exportSingleLabelPdf, type SheetLayoutOptions } from '../utils/exportPdf';
import { Printer, Download, FileDown, Sliders, Image as ImageIcon } from 'lucide-react';

interface PrintPreviewProps {
  label: SavedLabel;
  onBack: () => void;
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({ label, onBack }) => {
  // A4 用紙 (210 × 297 mm) の自動面付け初期値を算出
  const defaultCols = Math.max(1, Math.floor((210 - 20) / label.width));
  const defaultRows = Math.max(1, Math.floor((297 - 20) / label.height));

  const [cols, setCols] = useState(defaultCols);
  const [rows, setRows] = useState(defaultRows);
  const [marginTop, setMarginTop] = useState(10);
  const [marginLeft, setMarginLeft] = useState(10);
  const [gapX, setGapX] = useState(2);
  const [gapY, setGapY] = useState(2);
  const [showSettings, setShowSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const totalCount = cols * rows;

  const layoutOptions: SheetLayoutOptions = useMemo(
    () => ({
      labelWidthMm: label.width,
      labelHeightMm: label.height,
      cols,
      rows,
      marginTopMm: marginTop,
      marginLeftMm: marginLeft,
      gapXMm: gapX,
      gapYMm: gapY,
    }),
    [label.width, label.height, cols, rows, marginTop, marginLeft, gapX, gapY]
  );

  // ブラウザ印刷実行
  const handlePrint = () => {
    window.print();
  };

  // A4 PDF 保存
  const handleExportA4Pdf = async () => {
    if (!label.thumbnailUrl) return;
    setIsExporting(true);
    try {
      await exportA4SheetPdf(
        label.thumbnailUrl,
        layoutOptions,
        `${label.name}_A4シート.pdf`
      );
    } catch (err) {
      console.error('PDF export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  // 単品実寸 PDF 保存
  const handleExportSinglePdf = async () => {
    if (!label.thumbnailUrl) return;
    setIsExporting(true);
    try {
      await exportSingleLabelPdf(
        label.thumbnailUrl,
        label.width,
        label.height,
        `${label.name}_実寸.pdf`
      );
    } catch (err) {
      console.error('Single PDF export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  // 高解像度 PNG 保存
  const handleExportPng = () => {
    if (!label.thumbnailUrl) return;
    const link = document.createElement('a');
    link.download = `${label.name}.png`;
    link.href = label.thumbnailUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* 画面ヘッダー (印刷時は非表示) */}
      <div className="no-print">
        <Header
          title="印刷・保存プレビュー"
          showBack
          onBack={onBack}
          rightAction={
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                showSettings
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>配置設定</span>
            </button>
          }
        />
      </div>

      {/* 設定ドロワー (印刷時は非表示) */}
      {showSettings && (
        <div className="no-print bg-white border-b border-slate-200 px-4 py-3 shadow-md max-w-md mx-auto w-full space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">A4面付け設定</span>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              合計 {totalCount} 枚配置
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                横枚数 (列)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={cols}
                onChange={(e) => setCols(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full h-9 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                縦枚数 (行)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={rows}
                onChange={(e) => setRows(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full h-9 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                上余白 (mm)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={marginTop}
                onChange={(e) => setMarginTop(parseInt(e.target.value, 10) || 0)}
                className="w-full h-9 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                左余白 (mm)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={marginLeft}
                onChange={(e) => setMarginLeft(parseInt(e.target.value, 10) || 0)}
                className="w-full h-9 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                横間隔 (mm)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={gapX}
                onChange={(e) => setGapX(parseInt(e.target.value, 10) || 0)}
                className="w-full h-9 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                縦間隔 (mm)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={gapY}
                onChange={(e) => setGapY(parseInt(e.target.value, 10) || 0)}
                className="w-full h-9 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* A4 シートプレビュー領域 */}
      <main className="flex-1 overflow-auto p-4 flex items-center justify-center">
        {/* A4比率 (210 : 297 ≒ 1 : 1.414) の用紙コンテナ */}
        <div
          id="print-sheet"
          className="bg-white shadow-2xl border border-slate-300 relative mx-auto overflow-hidden transition-all"
          style={{
            width: '320px',
            height: `${320 * (297 / 210)}px`,
          }}
        >
          {/* A4グリッド上の配置プレビュー */}
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              // A4 (210x297mm) に対するパーセンテージ位置
              const xPercent = ((marginLeft + c * (label.width + gapX)) / 210) * 100;
              const yPercent = ((marginTop + r * (label.height + gapY)) / 297) * 100;
              const wPercent = (label.width / 210) * 100;
              const hPercent = (label.height / 297) * 100;

              if (xPercent + wPercent > 100 || yPercent + hPercent > 100) {
                return null; // A4枠外は表示しない
              }

              return (
                <div
                  key={`${r}-${c}`}
                  className="absolute border border-dashed border-slate-300 overflow-hidden bg-white"
                  style={{
                    left: `${xPercent}%`,
                    top: `${yPercent}%`,
                    width: `${wPercent}%`,
                    height: `${hPercent}%`,
                  }}
                >
                  {label.thumbnailUrl ? (
                    <img
                      src={label.thumbnailUrl}
                      alt={label.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-300">
                      {label.name}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* 印刷専用スタイル (ブラウザ印刷時に実寸A4で出力) */}
      <div
        className="print-only hidden"
        style={{
          width: '210mm',
          height: '297mm',
          position: 'relative',
          margin: 0,
          padding: 0,
          backgroundColor: '#ffffff',
        }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const x = marginLeft + c * (label.width + gapX);
            const y = marginTop + r * (label.height + gapY);

            if (x + label.width > 210 || y + label.height > 297) return null;

            return (
              <div
                key={`print-${r}-${c}`}
                style={{
                  position: 'absolute',
                  left: `${x}mm`,
                  top: `${y}mm`,
                  width: `${label.width}mm`,
                  height: `${label.height}mm`,
                }}
              >
                {label.thumbnailUrl && (
                  <img
                    src={label.thumbnailUrl}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 下部アクションバー (印刷時は非表示) */}
      <div className="no-print bg-white border-t border-slate-200 p-4 space-y-2 max-w-md mx-auto w-full">
        {/* メイン印刷ボタン */}
        <button
          type="button"
          onClick={handlePrint}
          className="w-full h-13 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <Printer className="w-5 h-5" />
          <span>今すぐ印刷する (A4)</span>
        </button>

        {/* PDF/PNG保存ボタングリッド */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={handleExportA4Pdf}
            disabled={isExporting}
            className="h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            <span>A4面付けPDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportSinglePdf}
            disabled={isExporting}
            className="h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>実寸単品PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportPng}
            disabled={isExporting}
            className="h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-amber-600" />
            <span>高画質PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
