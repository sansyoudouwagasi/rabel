export interface AppSettings {
  shopName: string;
  defaultFont: 'gothic' | 'mincho';
  defaultFontSize: number;
  defaultWidth: number;
  defaultHeight: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  shopName: '',
  defaultFont: 'gothic',
  defaultFontSize: 16,
  defaultWidth: 50,
  defaultHeight: 30,
};
