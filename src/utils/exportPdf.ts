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
 * A4用紙 (210×297mm) に面付けしたPDFを書き出し
 */
export async function exportA4SheetPdf(
  imgDataUrl: string,
  options: SheetLayoutOptions,
  filename: string = 'label-sheet-a4.pdf'
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
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

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = marginLeftMm + c * (labelWidthMm + gapXMm);
      const y = marginTopMm + r * (labelHeightMm + gapYMm);

      // A4用紙の範囲内かチェック (210 x 297mm)
      if (x + labelWidthMm <= 210 && y + labelHeightMm <= 297) {
        doc.addImage(imgDataUrl, 'PNG', x, y, labelWidthMm, labelHeightMm);
      }
    }
  }

  doc.save(filename);
}
