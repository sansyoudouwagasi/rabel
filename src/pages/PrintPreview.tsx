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
  // ラベル作成時の用紙向き設定、またはラベル幅が210mmを超える場合は横向きを初期値にする
  const initialOrientation = label.paperOrientation || (label.width > 210 ? 'landscape' : 'portrait');
  const [paperOrientation, setPaperOrientation] = useState<'portrait' | 'landscape'>(initialOrientation);

  const pageWidth = paperOrientation === 'landscape' ? 297 : 210;
  const pageHeight = paperOrientation === 'landscape' ? 210 : 297;

  // 用紙サイズに応じた自動面付け初期値を算出する関数
  const calcDefaultCols = (pw: number) => Math.max(1, Math.floor((pw - 20) / label.width));
  const calcDefaultRows = (ph: number) => Math.max(1, Math.floor((ph - 20) / label.height));

  const [cols, setCols] = useState(() => calcDefaultCols(pageWidth));
  const [rows, setRows] = useState(() => calcDefaultRows(pageHeight));
  const [marginTop, setMarginTop] = useState(10);
  const [marginLeft, setMarginLeft] = useState(10);
  const [gapX, setGapX] = useState(2);
  const [gapY, setGapY] = useState(2);
  const [showSettings, setShowSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // 用紙の向きを切り替えたときの処理
  const handleOrientationChange = (newOrientation: 'portrait' | 'landscape') => {
    if (newOrientation === paperOrientation) return;
    setPaperOrientation(newOrientation);
    const newPw = newOrientation === 'landscape' ? 297 : 210;
    const newPh = newOrientation === 'landscape' ? 210 : 297;
    setCols(calcDefaultCols(newPw));
    setRows(calcDefaultRows(newPh));
  };

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
      paperOrientation,
    }),
    [label.width, label.height, cols, rows, marginTop, marginLeft, gapX, gapY, paperOrientation]
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
      const orientationSuffix = paperOrientation === 'landscape' ? 'A4横シート' : 'A4縦シート';
      await exportA4SheetPdf(
        label.thumbnailUrl,
        layoutOptions,
        `${label.name}_${orientationSuffix}.pdf`
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
      {/* 動的印刷スタイル: 選択中の用紙向きに応じた@page sizeを設定し、確実に1枚に収める */}
      <style>{`
        @media print {
          @page {
            size: A4 ${paperOrientation} !important;
            margin: 0mm !important;
          }
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }
          .no-print, header, nav, main, footer {
            display: none !important;
          }
          .print-only {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${pageWidth}mm !important;
            height: ${pageHeight}mm !important;
            max-width: ${pageWidth}mm !important;
            max-height: ${pageHeight}mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>

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
            <span className="text-xs font-bold text-slate-700">
              A4面付け設定 ({paperOrientation === 'landscape' ? '横向き' : '縦向き'})
            </span>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              合計 {totalCount} 枚配置
            </span>
          </div>

          {/* 用紙の向き切り替え */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
              用紙の向き
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleOrientationChange('portrait')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  paperOrientation === 'portrait'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                縦向き (210×297mm)
              </button>
              <button
                type="button"
                onClick={() => handleOrientationChange('landscape')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  paperOrientation === 'landscape'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                横向き (297×210mm)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                横枚数 (列)
              </label>
              <input
                type="number"
                min="1"
                max="20"
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
                max="30"
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
                max="100"
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
                max="100"
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
                max="50"
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
                max="50"
                value={gapY}
                onChange={(e) => setGapY(parseInt(e.target.value, 10) || 0)}
                className="w-full h-9 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* A4 シートプレビュー領域 (画面表示専用) */}
      <main className="flex-1 overflow-auto p-4 flex items-center justify-center no-print">
        {/* A4比率 (縦 210:297 または 横 297:210) の用紙コンテナ */}
        <div
          id="print-sheet"
          className="bg-white shadow-2xl border border-slate-300 relative mx-auto overflow-hidden transition-all duration-300"
          style={{
            width: paperOrientation === 'landscape' ? '340px' : '300px',
            height: paperOrientation === 'landscape'
              ? `${Math.round(340 * (210 / 297))}px`
              : `${Math.round(300 * (297 / 210))}px`,
          }}
        >
          {/* A4グリッド上の配置プレビュー */}
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              // A4用紙サイズに対するパーセンテージ位置
              const xPercent = ((marginLeft + c * (label.width + gapX)) / pageWidth) * 100;
              const yPercent = ((marginTop + r * (label.height + gapY)) / pageHeight) * 100;
              const wPercent = (label.width / pageWidth) * 100;
              const hPercent = (label.height / pageHeight) * 100;

              if (xPercent + wPercent > 100.1 || yPercent + hPercent > 100.1) {
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
          width: `${pageWidth}mm`,
          height: `${pageHeight}mm`,
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

            if (x + label.width > pageWidth + 0.1 || y + label.height > pageHeight + 0.1) return null;

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
          <span>今すぐ印刷する (A4{paperOrientation === 'landscape' ? '横' : '縦'})</span>
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
