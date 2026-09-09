import * as fabric from 'fabric';

/**
 * Fabric Canvasから高解像度PNGをエクスポート
 */
export async function exportCanvasToPng(canvas: fabric.Canvas, filename: string = 'label.png'): Promise<void> {
  const currentZoom = canvas.getZoom();
  // 印刷品質（300 DPI実寸）で書き出すため、ズーム比率の逆数を multiplier に指定
  const multiplier = 1 / currentZoom;

  const dataUrl = canvas.toDataURL({
    format: 'png',
    multiplier: multiplier,
  });

  // Web Share API (スマホで直接画像保存や共有ができる)
  if (navigator.canShare) {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
        });
        return;
      }
    } catch {
      // ユーザーキャンセルや非対応時はフォールバックへ
    }
  }

  // フォールバック: 通常のダウンロードアンカー
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 高解像度PNGのDataURLを取得
 */
export function getCanvasHighResDataUrl(canvas: fabric.Canvas): string {
  const currentZoom = canvas.getZoom();
  return canvas.toDataURL({
    format: 'png',
    multiplier: 1 / currentZoom,
  });
}
