export interface SheetLayout {
  cols: number;
  rows: number;
  marginLeft: number; // mm
  marginTop: number;  // mm
  gapX: number;       // mm
  gapY: number;       // mm
}

export interface LabelSize {
  width: number;  // mm単位
  height: number; // mm単位
  name?: string;  // 例: "50×30mm"
  description?: string;
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

// 幅・高さから一致する規格面付け設定を判定
export function findMatchingSheetLayout(width: number, height: number): SheetLayout | null {
  if (Math.abs(width - 66) <= 0.2 && Math.abs(height - 33.9) <= 0.2) {
    return { cols: 3, rows: 8, marginLeft: 6, marginTop: 12.9, gapX: 0, gapY: 0 };
  }
  if (Math.abs(width - 48.3) <= 0.2 && Math.abs(height - 25.4) <= 0.2) {
    return { cols: 4, rows: 11, marginLeft: 8.4, marginTop: 8.8, gapX: 0, gapY: 0 };
  }
  return null;
}

export const PRESET_SIZES: LabelSize[] = [
  { width: 30, height: 20, name: '30×20mm (小型シール)', formatType: 'preset' },
  { width: 40, height: 30, name: '40×30mm (標準値札)', formatType: 'preset' },
  { width: 50, height: 30, name: '50×30mm (定番食品ラベル)', formatType: 'preset' },
  { width: 60, height: 40, name: '60×40mm (中型ラベル)', formatType: 'preset' },
  { width: 80, height: 50, name: '80×50mm (大型・詳細ラベル)', formatType: 'preset' },
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
