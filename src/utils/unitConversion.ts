// 基準DPI: 印刷品質に適した300DPI
export const PRINT_DPI = 300;
export const MM_PER_INCH = 25.4;

/**
 * mmをpxに変換 (300 DPI基準)
 */
export function mmToPx(mm: number, dpi: number = PRINT_DPI): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

/**
 * pxをmmに変換
 */
export function pxToMm(px: number, dpi: number = PRINT_DPI): number {
  return Number(((px / dpi) * MM_PER_INCH).toFixed(1));
}

/**
 * 画面表示用：コンテナ幅・高さに収まる縮小スケール倍率を算出
 */
export function calculateFitScale(
  contentWidth: number,
  contentHeight: number,
  containerWidth: number,
  containerHeight: number,
  padding: number = 24
): number {
  const availableWidth = Math.max(containerWidth - padding * 2, 100);
  const availableHeight = Math.max(containerHeight - padding * 2, 100);

  const scaleX = availableWidth / contentWidth;
  const scaleY = availableHeight / contentHeight;

  // 1より大きく拡大しすぎないように制限（最大1.0）
  return Math.min(scaleX, scaleY, 1.0);
}
