import * as fabric from 'fabric';

export interface FoodLabelData {
  showProductTitle: boolean;
  productTitle: string; // 例: "クッキー（プレーン）"
  categoryName: string; // (1) 名称: "焼き菓子"
  ingredients: string; // (2)(3) 原材料名
  volume: string; // (4) 内容量: "1枚"
  expiryType: '消費期限' | '賞味期限'; // (5) 期限見出し
  expiry: string; // (5) 期限日: "202X年XX月XX日"
  storage: string; // (6) 保存方法
  manufacturerType: '製 造 者' | '販 売 者'; // (7) 製造者見出し
  manufacturer: string; // (7) 製造者氏名・住所
  showNutrition: boolean; // (8) 栄養成分表示を含めるか
  nutritionTitle: string; // "栄養成分表示"
  energy: string; // "XXXkcal"
  protein: string; // "X.Xg"
  fat: string; // "X.Xg"
  carbs: string; // "XX.Xg"
  salt: string; // "X.Xg"
  showNutritionNote: boolean; // "この表示値は、目安です。"
}

export const DEFAULT_FOOD_LABEL_WITH_NUTRITION: FoodLabelData = {
  showProductTitle: true,
  productTitle: 'クッキー（プレーン）',
  categoryName: '焼き菓子',
  ingredients:
    '小麦粉（国内製造）、バター、砂糖、\n卵、食塩／ベーキングパウダー\n（一部に小麦・乳成分・卵を含む）',
  volume: '1枚',
  expiryType: '消費期限',
  expiry: '202X年XX月XX日',
  storage: '高温、直射日光を避けて\n保存してください。',
  manufacturerType: '製 造 者',
  manufacturer: '（株）洋菓子店A\n東京都○○区○○ XX-XX',
  showNutrition: true,
  nutritionTitle: '栄養成分表示',
  energy: 'XXXkcal',
  protein: 'X.Xg',
  fat: 'X.Xg',
  carbs: 'XX.Xg',
  salt: 'X.Xg',
  showNutritionNote: true,
};

export const DEFAULT_FOOD_LABEL_STANDARD: FoodLabelData = {
  ...DEFAULT_FOOD_LABEL_WITH_NUTRITION,
  showNutrition: false,
};

export interface FoodCanvasObjectProps {
  isFoodTableElement?: boolean;
  foodField?: string;
  foodLabelData?: FoodLabelData;
  isVertical?: boolean;
  rawText?: string;
}

const FOOD_FONT_FAMILY = '"Noto Sans JP", "Yu Gothic", "Hiragino Sans", "Meiryo", sans-serif';

let measureCtx: CanvasRenderingContext2D | null = null;
function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!measureCtx) {
    const c = document.createElement('canvas');
    measureCtx = c.getContext('2d');
  }
  return measureCtx;
}

/**
 * 実際のCanvas 2D計測（フォールバック付き）で指定ピクセル幅に収まるよう自動折り返しする
 */
function wrapTextByPixelWidth(text: string, maxWidthPx: number, fontSizePx: number): string[] {
  if (!text) return [''];
  const rawLines = text.split('\n');
  const wrappedLines: string[] = [];

  const ctx = getMeasureContext();
  if (ctx) {
    ctx.font = `bold ${fontSizePx}px ${FOOD_FONT_FAMILY}`;
  }
  const maxFullWidthChars = Math.max(4, (maxWidthPx / fontSizePx) * 0.98);

  const measureLinePx = (str: string): number => {
    if (ctx) {
      return ctx.measureText(str).width;
    }
    let w = 0;
    for (const c of Array.from(str)) {
      w += (c.charCodeAt(0) <= 0x007f ? 0.56 : 1.0) * fontSizePx;
    }
    return w;
  };

  for (const rawLine of rawLines) {
    if (!rawLine) {
      wrappedLines.push('');
      continue;
    }

    if (measureLinePx(rawLine) <= maxWidthPx) {
      wrappedLines.push(rawLine);
      continue;
    }

    let currentLine = '';
    let currentWeight = 0;
    const chars = Array.from(rawLine);

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const nextCandidate = currentLine + ch;
      const charWeight = ch.charCodeAt(0) <= 0x007f ? 0.56 : 1.0;

      // 句読点や閉じ括弧が行頭に来ないよう調整（禁則処理）
      const isClosingPunct = ch === '、' || ch === '。' || ch === '）' || ch === ')';
      const exceeds = ctx
        ? measureLinePx(nextCandidate) > maxWidthPx
        : currentWeight + charWeight > maxFullWidthChars;

      if (exceeds && currentLine.length > 0 && !isClosingPunct) {
        wrappedLines.push(currentLine);
        currentLine = ch;
        currentWeight = charWeight;
      } else {
        currentLine = nextCandidate;
        currentWeight += charWeight;
      }
    }
    if (currentLine) {
      wrappedLines.push(currentLine);
    }
  }

  return wrappedLines.length > 0 ? wrappedLines : [''];
}

function createFoodText(
  text: string,
  options: Partial<fabric.ITextProps>,
  foodField?: string
): fabric.IText {
  const obj = new fabric.IText(text, {
    fontFamily: FOOD_FONT_FAMILY,
    fill: '#0f172a',
    lineHeight: 1.18,
    ...options,
  });
  const meta = obj as unknown as FoodCanvasObjectProps;
  meta.isFoodTableElement = true;
  meta.isVertical = false;
  meta.rawText = text;
  if (foodField) {
    meta.foodField = foodField;
  }
  return obj;
}

/**
 * キャンバス上に食品裏ラベル（一括表示枠＋任意の栄養成分表示）を描画する
 */
export function applyFoodBackLabelToCanvas(
  canvas: fabric.Canvas,
  width: number,
  height: number,
  data: FoodLabelData
): void {
  // 既存の食品裏ラベル要素を削除
  const existingFoodObjs = canvas.getObjects().filter((obj) => {
    return Boolean((obj as unknown as FoodCanvasObjectProps).isFoodTableElement);
  });
  existingFoodObjs.forEach((obj) => canvas.remove(obj));

  const padX = Math.max(10, Math.round(width * 0.036));
  const padY = Math.max(8, Math.round(height * 0.028));
  const contentW = width - padX * 2;
  const contentH = height - padY * 2;

  const isPortrait = height > width;
  const labelColRatio = isPortrait ? 0.24 : 0.22;
  const labelColW = Math.round(contentW * labelColRatio);
  const valueColW = contentW - labelColW;

  // 横幅に対して1行あたり約17文字（全体で約22.5文字）収まるフォントサイズを上限とする
  const maxFontByWidth = Math.max(
    8,
    Math.min(Math.floor(contentW / 22.2), Math.floor(labelColW / 4.5))
  );

  // 初期推定フォントサイズから折り返し行数を計算し、高さに収まるよう収束計算する
  let fontSize = Math.min(
    maxFontByWidth,
    Math.round(Math.min(width, height) * (data.showNutrition ? 0.048 : 0.056))
  );
  fontSize = Math.max(8, fontSize);

  const lineHeightRatio = 1.18;
  const fabricFontHeightMult = 1.15;

  const calcLayout = (fs: number) => {
    const cellPadX = Math.max(5, Math.round(fs * 0.45));
    const cellPadY = Math.max(4, Math.round(fs * 0.38));
    const usableValueW = Math.max(40, valueColW - cellPadX * 2);

    const rows = [
      {
        header: '名　　称',
        headerField: undefined,
        value: data.categoryName || ' ',
        valueField: 'categoryName',
      },
      {
        header: '原材料名',
        headerField: undefined,
        value: data.ingredients || ' ',
        valueField: 'ingredients',
      },
      {
        header: '内 容 量',
        headerField: undefined,
        value: data.volume || ' ',
        valueField: 'volume',
      },
      {
        header: data.expiryType,
        headerField: 'expiryType',
        value: data.expiry || ' ',
        valueField: 'expiry',
      },
      {
        header: '保存方法',
        headerField: undefined,
        value: data.storage || ' ',
        valueField: 'storage',
      },
      {
        header: data.manufacturerType,
        headerField: 'manufacturerType',
        value: data.manufacturer || ' ',
        valueField: 'manufacturer',
      },
    ].map((r) => {
      const wrapped = wrapTextByPixelWidth(r.value, usableValueW, fs);
      const lineCount = Math.max(1, wrapped.length);
      const textH = lineCount * fs * fabricFontHeightMult * lineHeightRatio;
      const rowH = Math.ceil(textH + cellPadY * 2);
      return {
        ...r,
        wrappedText: wrapped.join('\n'),
        lineCount,
        rowH,
      };
    });

    const titleH =
      data.showProductTitle && data.productTitle.trim()
        ? Math.ceil(fs * 1.06 * fabricFontHeightMult + cellPadY * 1.5)
        : 0;

    const tableH = rows.reduce((sum, r) => sum + r.rowH, 0);

    let nutritionBlockH = 0;
    let nutritionWrapped = '';
    let nutritionBoxH = 0;
    const nutritionGapTop = Math.max(4, Math.round(fs * 0.42));
    const nutritionTitleH = Math.ceil(fs * 0.96 * fabricFontHeightMult + 2);
    const nutritionNoteH = data.showNutritionNote
      ? Math.ceil(fs * 0.92 * fabricFontHeightMult + 2)
      : 0;

    if (data.showNutrition) {
      const nutFs = Math.max(7, Math.round(fs * 0.94));
      const rawNutrition = `エネルギー ${data.energy}、たんぱく質 ${data.protein}、\n脂質 ${data.fat}、炭水化物 ${data.carbs}、食塩相当量 ${data.salt}`;
      const wrappedNutLines = wrapTextByPixelWidth(
        rawNutrition,
        contentW - cellPadX * 2,
        nutFs
      );
      nutritionWrapped = wrappedNutLines.join('\n');
      nutritionBoxH = Math.ceil(
        wrappedNutLines.length * nutFs * fabricFontHeightMult * lineHeightRatio + cellPadY * 2
      );
      nutritionBlockH =
        nutritionGapTop +
        nutritionTitleH +
        3 +
        nutritionBoxH +
        (data.showNutritionNote ? 4 + nutritionNoteH : 0);
    }

    const totalH = titleH + tableH + nutritionBlockH;

    return {
      fs,
      cellPadX,
      cellPadY,
      rows,
      titleH,
      tableH,
      nutritionGapTop,
      nutritionTitleH,
      nutritionBoxH,
      nutritionNoteH,
      nutritionWrapped,
      totalH,
    };
  };

  let layout = calcLayout(fontSize);

  // 高さが溢れる場合はフォントサイズを縮小、余裕がある場合は横幅上限まで拡大してフィットさせる
  for (let iter = 0; iter < 14; iter++) {
    if (layout.totalH > contentH && fontSize > 7) {
      const ratio = contentH / layout.totalH;
      fontSize = Math.max(7, Math.floor(fontSize * Math.max(0.85, ratio)));
      layout = calcLayout(fontSize);
    } else if (layout.totalH < contentH * 0.88 && fontSize < maxFontByWidth) {
      fontSize = fontSize + 1;
      const nextLayout = calcLayout(fontSize);
      if (nextLayout.totalH > contentH) {
        fontSize = fontSize - 1;
        break;
      }
      layout = nextLayout;
    } else {
      break;
    }
  }

  // 余った縦スペースを適度な範囲で表の各行へ配分し、不自然に間延びしないよう上限を設ける
  const maxExtraTotal = layout.rows.length * Math.round(layout.fs * 0.55);
  const extraH = Math.min(maxExtraTotal, Math.max(0, contentH - layout.totalH));
  if (extraH > 0) {
    const totalLines = layout.rows.reduce((s, r) => s + r.lineCount, 0);
    layout.rows.forEach((r) => {
      r.rowH += Math.floor(extraH * (r.lineCount / totalLines));
    });
    layout.tableH = layout.rows.reduce((s, r) => s + r.rowH, 0);
  }

  const finalTotalH =
    layout.titleH +
    layout.tableH +
    (data.showNutrition
      ? layout.nutritionGapTop +
        layout.nutritionTitleH +
        3 +
        layout.nutritionBoxH +
        (data.showNutritionNote ? 4 + layout.nutritionNoteH : 0)
      : 0);

  let currentY = Math.max(padY, Math.round((height - finalTotalH) / 2));
  const strokeW = Math.max(1.5, Math.min(2.5, Math.round(layout.fs * 0.12)));

  // (0) 上部商品名（枠外）
  if (data.showProductTitle && data.productTitle.trim()) {
    const titleObj = createFoodText(
      data.productTitle,
      {
        left: padX + 4,
        top: currentY + layout.titleH / 2,
        fontSize: Math.round(layout.fs * 1.05),
        fontWeight: 'bold',
        originX: 'left',
        originY: 'center',
      },
      'productTitle'
    );
    canvas.add(titleObj);
    currentY += layout.titleH;
  }

  const tableTop = currentY;

  // 表の外枠（Fabric.js v7のデフォルトoriginX/Y='center'に合わせ中心座標で指定しズレを防止）
  const outerBorder = new fabric.Rect({
    left: padX + contentW / 2,
    top: tableTop + layout.tableH / 2,
    width: contentW,
    height: layout.tableH,
    originX: 'center',
    originY: 'center',
    fill: '#ffffff',
    stroke: '#0f172a',
    strokeWidth: strokeW,
    selectable: false,
    evented: false,
  });
  const outerMeta = outerBorder as unknown as FoodCanvasObjectProps;
  outerMeta.isFoodTableElement = true;
  outerMeta.foodLabelData = data;
  canvas.add(outerBorder);

  // 見出し列と内容列の間の縦罫線
  const dividerX = padX + labelColW;
  const vLine = new fabric.Line([dividerX, tableTop, dividerX, tableTop + layout.tableH], {
    stroke: '#0f172a',
    strokeWidth: strokeW,
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
  });
  (vLine as unknown as FoodCanvasObjectProps).isFoodTableElement = true;
  canvas.add(vLine);

  // 各行の横罫線とテキスト配置
  let rowY = tableTop;
  layout.rows.forEach((row, idx) => {
    const rowCenterY = rowY + row.rowH / 2;

    // 左列（見出し）
    const headerObj = createFoodText(
      row.header,
      {
        left: padX + labelColW / 2,
        top: rowCenterY,
        fontSize: layout.fs,
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
        textAlign: 'center',
      },
      row.headerField
    );
    canvas.add(headerObj);

    // 右列（内容：Canvas 2Dで無効となる 'medium' は使わず 'bold' を指定）
    const valObj = createFoodText(
      row.wrappedText,
      {
        left: dividerX + layout.cellPadX,
        top: rowCenterY,
        fontSize: layout.fs,
        fontWeight: 'bold',
        originX: 'left',
        originY: 'center',
        textAlign: 'left',
      },
      row.valueField
    );
    canvas.add(valObj);

    rowY += row.rowH;

    // 最終行以外は横罫線を引く
    if (idx < layout.rows.length - 1) {
      const hLine = new fabric.Line([padX, rowY, padX + contentW, rowY], {
        stroke: '#0f172a',
        strokeWidth: strokeW,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });
      (hLine as unknown as FoodCanvasObjectProps).isFoodTableElement = true;
      canvas.add(hLine);
    }
  });

  currentY = tableTop + layout.tableH;

  // (8) 栄養成分表示ブロック
  if (data.showNutrition) {
    currentY += layout.nutritionGapTop;

    // 見出し: 栄養成分表示
    const nutTitleObj = createFoodText(
      data.nutritionTitle || '栄養成分表示',
      {
        left: padX + 4,
        top: currentY + layout.nutritionTitleH / 2,
        fontSize: Math.round(layout.fs * 0.96),
        fontWeight: 'bold',
        originX: 'left',
        originY: 'center',
      },
      'nutritionTitle'
    );
    canvas.add(nutTitleObj);
    currentY += layout.nutritionTitleH + 3;

    // 栄養成分の枠線（中心座標で指定）
    const nutBox = new fabric.Rect({
      left: padX + contentW / 2,
      top: currentY + layout.nutritionBoxH / 2,
      width: contentW,
      height: layout.nutritionBoxH,
      originX: 'center',
      originY: 'center',
      fill: '#ffffff',
      stroke: '#0f172a',
      strokeWidth: strokeW,
      selectable: false,
      evented: false,
    });
    (nutBox as unknown as FoodCanvasObjectProps).isFoodTableElement = true;
    canvas.add(nutBox);

    // 栄養成分の本文
    const nutBodyObj = createFoodText(
      layout.nutritionWrapped,
      {
        left: padX + layout.cellPadX,
        top: currentY + layout.nutritionBoxH / 2,
        fontSize: Math.max(7, Math.round(layout.fs * 0.94)),
        fontWeight: 'bold',
        originX: 'left',
        originY: 'center',
        textAlign: 'left',
      },
      'nutritionBody'
    );
    canvas.add(nutBodyObj);
    currentY += layout.nutritionBoxH;

    // 「この表示値は、目安です。」
    if (data.showNutritionNote) {
      currentY += 4;
      const nutNoteObj = createFoodText(
        'この表示値は、目安です。',
        {
          left: padX + 4,
          top: currentY + layout.nutritionNoteH / 2,
          fontSize: Math.max(7, Math.round(layout.fs * 0.92)),
          fontWeight: 'bold',
          originX: 'left',
          originY: 'center',
        },
        'nutritionNote'
      );
      canvas.add(nutNoteObj);
    }
  }

  canvas.renderAll();
}

/**
 * キャンバス上に食品裏ラベルが存在するか判定する
 */
export function hasFoodBackLabelOnCanvas(canvas: fabric.Canvas | null): boolean {
  if (!canvas) return false;
  return canvas
    .getObjects()
    .some((obj) => Boolean((obj as unknown as FoodCanvasObjectProps).isFoodTableElement));
}

/**
 * キャンバスから現在の食品裏ラベルデータを抽出する（直接テキスト編集分も反映）
 */
export function extractFoodLabelDataFromCanvas(canvas: fabric.Canvas | null): FoodLabelData | null {
  if (!canvas) return null;
  const objects = canvas.getObjects();
  const foodObjects = objects.filter((obj) =>
    Boolean((obj as unknown as FoodCanvasObjectProps).isFoodTableElement)
  );
  if (foodObjects.length === 0) return null;

  let baseData: FoodLabelData = { ...DEFAULT_FOOD_LABEL_WITH_NUTRITION };
  for (const obj of foodObjects) {
    const meta = obj as unknown as FoodCanvasObjectProps;
    if (meta.foodLabelData) {
      baseData = { ...meta.foodLabelData };
      break;
    }
  }

  // キャンバス上で直接書き換えられたテキストがあれば最新値を取得
  for (const obj of foodObjects) {
    if (!(obj instanceof fabric.IText)) continue;
    const meta = obj as unknown as FoodCanvasObjectProps;
    const textVal = (meta.rawText ?? obj.text ?? '').trim();
    switch (meta.foodField) {
      case 'productTitle':
        baseData.productTitle = textVal;
        break;
      case 'categoryName':
        baseData.categoryName = textVal;
        break;
      case 'ingredients':
        baseData.ingredients = textVal;
        break;
      case 'volume':
        baseData.volume = textVal;
        break;
      case 'expiryType':
        if (textVal === '賞味期限' || textVal === '消費期限') {
          baseData.expiryType = textVal;
        }
        break;
      case 'expiry':
        baseData.expiry = textVal;
        break;
      case 'storage':
        baseData.storage = textVal;
        break;
      case 'manufacturerType':
        if (textVal.includes('販')) {
          baseData.manufacturerType = '販 売 者';
        } else {
          baseData.manufacturerType = '製 造 者';
        }
        break;
      case 'manufacturer':
        baseData.manufacturer = textVal;
        break;
      case 'nutritionTitle':
        baseData.nutritionTitle = textVal;
        break;
      default:
        break;
    }
  }

  return baseData;
}

