export interface LabelSize {
  width: number;  // mm単位
  height: number; // mm単位
  name?: string;  // 例: "50×30mm"
  paperOrientation?: 'portrait' | 'landscape';
}

export const PRESET_SIZES: LabelSize[] = [
  { width: 30, height: 20, name: '30×20mm (小型シール)' },
  { width: 40, height: 30, name: '40×30mm (標準値札)' },
  { width: 50, height: 30, name: '50×30mm (定番食品ラベル)' },
  { width: 60, height: 40, name: '60×40mm (中型ラベル)' },
  { width: 80, height: 50, name: '80×50mm (大型・詳細ラベル)' },
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
