export interface SheetLayout {
  cols: number;
  rows: number;
  marginLeft: number; // mm
  marginTop: number;  // mm
  gapX: number;       // mm
  gapY: number;       // mm
}

export type LabelOrientation = 'landscape' | 'portrait';

export interface LabelSize {
  width: number;  // mm単位
  height: number; // mm単位
  name?: string;  // 例: "50×30mm"
  description?: string;
  labelOrientation?: LabelOrientation; // ラベル自体の向き（landscape: 横向き / portrait: 縦向き）
  paperOrientation?: 'portrait' | 'landscape';
  sheetLayout?: SheetLayout;
  formatType?: 'sheet_24' | 'sheet_44' | 'preset' | 'full_a4' | 'custom';
}

// A4規格ラベルシート (24面 / 44面)
export const A4_SHEET_PRESETS: LabelSize[] = [
  {
    width: 66,
    height: 33.9,
    name: 'A4 24面 (66×33.9mm)',
    description: '3列×8行 / 上余白12.9mm・左余白6mm / 定番宛名・商品ラベル',
    labelOrientation: 'landscape',
    paperOrientation: 'portrait',
    formatType: 'sheet_24',
    sheetLayout: {
      cols: 3,
      rows: 8,
      marginLeft: 6,
      marginTop: 12.9,
      gapX: 0,
      gapY: 0,
    },
  },
  {
    width: 48.3,
    height: 25.4,
    name: 'A4 44面 (48.3×25.4mm)',
    description: '4列×11行 / 上余白8.8mm・左余白8.4mm / 小型バーコード・価格ラベル',
    labelOrientation: 'landscape',
    paperOrientation: 'portrait',
    formatType: 'sheet_44',
    sheetLayout: {
      cols: 4,
      rows: 11,
      marginLeft: 8.4,
      marginTop: 8.8,
      gapX: 0,
      gapY: 0,
    },
  },
];

// 24面規格サイズかどうか判定（横向き・縦向き両方対応）
export function isSheet24Size(width: number, height: number, formatType?: string): boolean {
  if (formatType === 'sheet_24') return true;
  return (
    (Math.abs(width - 66) <= 0.2 && Math.abs(height - 33.9) <= 0.2) ||
    (Math.abs(width - 33.9) <= 0.2 && Math.abs(height - 66) <= 0.2)
  );
}

// 44面規格サイズかどうか判定（横向き・縦向き両方対応）
export function isSheet44Size(width: number, height: number, formatType?: string): boolean {
  if (formatType === 'sheet_44') return true;
  return (
    (Math.abs(width - 48.3) <= 0.2 && Math.abs(height - 25.4) <= 0.2) ||
    (Math.abs(width - 25.4) <= 0.2 && Math.abs(height - 48.3) <= 0.2)
  );
}

// 幅・高さから一致する規格面付け設定を判定（横向き・縦向き両方対応）
export function findMatchingSheetLayout(width: number, height: number): SheetLayout | null {
  // 24面（横向き 66×33.9mm -> A4縦 3列×8行）
  if (Math.abs(width - 66) <= 0.2 && Math.abs(height - 33.9) <= 0.2) {
    return { cols: 3, rows: 8, marginLeft: 6, marginTop: 12.9, gapX: 0, gapY: 0 };
  }
  // 24面（縦向き 33.9×66mm -> A4横 8列×3行）
  if (Math.abs(width - 33.9) <= 0.2 && Math.abs(height - 66) <= 0.2) {
    return { cols: 8, rows: 3, marginLeft: 12.9, marginTop: 6, gapX: 0, gapY: 0 };
  }
  // 44面（横向き 48.3×25.4mm -> A4縦 4列×11行）
  if (Math.abs(width - 48.3) <= 0.2 && Math.abs(height - 25.4) <= 0.2) {
    return { cols: 4, rows: 11, marginLeft: 8.4, marginTop: 8.8, gapX: 0, gapY: 0 };
  }
  // 44面（縦向き 25.4×48.3mm -> A4横 11列×4行）
  if (Math.abs(width - 25.4) <= 0.2 && Math.abs(height - 48.3) <= 0.2) {
    return { cols: 11, rows: 4, marginLeft: 8.8, marginTop: 8.4, gapX: 0, gapY: 0 };
  }
  return null;
}

// ラベルサイズを指定した向き（横向き / 縦向き）に変換するヘルパー
export function getOrientedLabelSize(size: LabelSize, orientation: LabelOrientation): LabelSize {
  const longSide = Math.max(size.width, size.height);
  const shortSide = Math.min(size.width, size.height);
  const newWidth = orientation === 'landscape' ? longSide : shortSide;
  const newHeight = orientation === 'landscape' ? shortSide : longSide;

  // 24面規格
  if (isSheet24Size(size.width, size.height, size.formatType)) {
    const layout = findMatchingSheetLayout(newWidth, newHeight)!;
    return {
      ...size,
      width: newWidth,
      height: newHeight,
      name: orientation === 'landscape' ? 'A4 24面 (66×33.9mm)' : 'A4 24面 縦向き (33.9×66mm)',
      labelOrientation: orientation,
      paperOrientation: orientation === 'landscape' ? 'portrait' : 'landscape',
      formatType: 'sheet_24',
      sheetLayout: layout,
    };
  }

  // 44面規格
  if (isSheet44Size(size.width, size.height, size.formatType)) {
    const layout = findMatchingSheetLayout(newWidth, newHeight)!;
    return {
      ...size,
      width: newWidth,
      height: newHeight,
      name: orientation === 'landscape' ? 'A4 44面 (48.3×25.4mm)' : 'A4 44面 縦向き (25.4×48.3mm)',
      labelOrientation: orientation,
      paperOrientation: orientation === 'landscape' ? 'portrait' : 'landscape',
      formatType: 'sheet_44',
      sheetLayout: layout,
    };
  }

  // A4 1枚全面
  if (size.formatType === 'full_a4' || (longSide === 297 && shortSide === 210)) {
    return {
      ...size,
      width: newWidth,
      height: newHeight,
      name: orientation === 'landscape' ? 'A4横 1枚全面 (297×210mm)' : 'A4縦 1枚全面 (210×297mm)',
      labelOrientation: orientation,
      paperOrientation: orientation,
      formatType: 'full_a4',
      sheetLayout: undefined,
    };
  }

  // 汎用プリセットまたはカスタム
  const descMatch = size.name?.match(/\((.+)\)/);
  const suffix = descMatch && size.formatType === 'preset' ? ` (${descMatch[1]})` : '';
  const newName =
    size.formatType === 'custom'
      ? `カスタム (${newWidth}×${newHeight}mm)`
      : `${newWidth}×${newHeight}mm${suffix}`;

  return {
    ...size,
    width: newWidth,
    height: newHeight,
    name: newName,
    labelOrientation: orientation,
  };
}

export const PRESET_SIZES: LabelSize[] = [
  { width: 30, height: 20, name: '30×20mm (小型シール)', labelOrientation: 'landscape', formatType: 'preset' },
  { width: 40, height: 30, name: '40×30mm (標準値札)', labelOrientation: 'landscape', formatType: 'preset' },
  { width: 50, height: 30, name: '50×30mm (定番食品ラベル)', labelOrientation: 'landscape', formatType: 'preset' },
  { width: 60, height: 40, name: '60×40mm (中型ラベル)', labelOrientation: 'landscape', formatType: 'preset' },
  { width: 80, height: 50, name: '80×50mm (大型・詳細ラベル)', labelOrientation: 'landscape', formatType: 'preset' },
];

export interface SavedLabel {
  id: string;
  name: string;
  width: number;  // mm
  height: number; // mm
  createdAt: number;
  updatedAt: number;
  backgroundColor: string;
  canvasJson: string; // Fabric.js toJSON()
  thumbnailUrl?: string; // Data URL
  productId?: string;
  labelOrientation?: LabelOrientation;
  paperOrientation?: 'portrait' | 'landscape';
  sheetLayout?: SheetLayout;
  formatType?: 'sheet_24' | 'sheet_44' | 'preset' | 'full_a4' | 'custom';
}

export type ViewState =
  | { type: 'home' }
  | { type: 'create_size' }
  | { type: 'create_template'; size: LabelSize }
  | { type: 'editor'; labelId?: string; initialSize?: LabelSize; templateId?: string }
  | { type: 'print_preview'; label: SavedLabel }
  | { type: 'saved_labels' }
  | { type: 'products' }
  | { type: 'settings' };
