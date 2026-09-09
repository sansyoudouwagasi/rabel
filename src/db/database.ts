import Dexie, { type EntityTable } from 'dexie';
import type { SavedLabel } from '../types/label';
import type { Product } from '../types/product';
import type { AppSettings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';

export class LabelMakerDatabase extends Dexie {
  labels!: EntityTable<SavedLabel, 'id'>;
  products!: EntityTable<Product, 'id'>;
  settings!: EntityTable<AppSettings & { key: string }, 'key'>;

  constructor() {
    super('KantanLabelMakerDB');
    this.version(1).stores({
      labels: 'id, name, width, height, createdAt, updatedAt, productId',
      products: 'id, name, price, shopName, createdAt, updatedAt',
      settings: 'key',
    });
  }
}

export const db = new LabelMakerDatabase();

// 設定取得・保存ヘルパー
export async function getAppSettings(): Promise<AppSettings> {
  const row = await db.settings.get('global_settings');
  if (!row) {
    return DEFAULT_SETTINGS;
  }
  const { key, ...settings } = row;
  return settings;
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await db.settings.put({
    key: 'global_settings',
    ...settings,
  });
}
