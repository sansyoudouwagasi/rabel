import { jsPDF } from 'jspdf';

export interface SheetLayoutOptions {
  labelWidthMm: number;
  labelHeightMm: number;
  cols: number;
  rows: number;
  marginTopMm: number;
  marginLeftMm: number;
  gapXMm: number;
  gapYMm: number;
  paperOrientation?: 'portrait' | 'landscape';
}

/**
 * 単体ラベルを実寸 (mm指定) でPDF書き出し
 */
export async function exportSingleLabelPdf(
  imgDataUrl: string,
  widthMm: number,
  heightMm: number,
  filename: string = 'label.pdf'
): Promise<void> {
  const orientation = widthMm > heightMm ? 'landscape' : 'portrait';
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: [widthMm, heightMm],
  });

  doc.addImage(imgDataUrl, 'PNG', 0, 0, widthMm, heightMm);
  doc.save(filename);
}

/**
 * A4用紙 (縦: 210×297mm / 横: 297×210mm) に面付けしたPDFを書き出し
 */
export async function exportA4SheetPdf(
  imgDataUrl: string,
  options: SheetLayoutOptions,
  filename: string = 'label-sheet-a4.pdf'
): Promise<void> {
  const isLandscape = options.paperOrientation === 'landscape';
  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const {
    labelWidthMm,
    labelHeightMm,
    cols,
    rows,
    marginTopMm,
    marginLeftMm,
    gapXMm,
    gapYMm,
  } = options;

  // A4全面サイズの場合は1枚全面に配置（はみ出しチェックで除外されるのを防止）
  const isFullA4 = labelWidthMm >= pageWidth - 5 && labelHeightMm >= pageHeight - 5;
  if (isFullA4) {
    doc.addImage(imgDataUrl, 'PNG', 0, 0, pageWidth, pageHeight);
    doc.save(filename);
    return;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = marginLeftMm + c * (labelWidthMm + gapXMm);
      const y = marginTopMm + r * (labelHeightMm + gapYMm);

      // A4用紙の範囲内かチェック (わずかな丸め誤差を許容)
      if (x + labelWidthMm <= pageWidth + 0.5 && y + labelHeightMm <= pageHeight + 0.5) {
        doc.addImage(imgDataUrl, 'PNG', x, y, labelWidthMm, labelHeightMm);
      }
    }
  }

  doc.save(filename);
}
