/**
 * スマホ写真の大容量化対策およびEXIF向き補正：
 * 長辺最大1200pxに自動縮小し、EXIF Orientation（向きタグ）を自動補正してDataURLを生成
 */
export async function resizeImageFile(file: File, maxDimension: number = 1200): Promise<string> {
  // モダンブラウザ: createImageBitmap によるネイティブEXIF向き自動補正
  if (typeof window !== 'undefined' && typeof window.createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      let width = bitmap.width;
      let height = bitmap.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();
        const isPng = file.type === 'image/png';
        const outputFormat = isPng ? 'image/png' : 'image/jpeg';
        return canvas.toDataURL(outputFormat, 0.85);
      }
      bitmap.close();
    } catch {
      // createImageBitmapに失敗した場合は従来のフォールバックへ進む
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // PNGまたはWebP/JPEGで圧縮
        const isPng = file.type === 'image/png';
        const outputFormat = isPng ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputFormat, 0.85);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsDataURL(file);
  });
}
