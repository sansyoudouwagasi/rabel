import { db } from './database';
import type { SavedLabel } from '../types/label';

export async function getAllLabels(): Promise<SavedLabel[]> {
  return await db.labels.orderBy('updatedAt').reverse().toArray();
}

export async function getRecentLabels(limit: number = 6): Promise<SavedLabel[]> {
  return await db.labels.orderBy('updatedAt').reverse().limit(limit).toArray();
}

export async function getLabelById(id: string): Promise<SavedLabel | undefined> {
  return await db.labels.get(id);
}

export async function saveLabel(label: SavedLabel): Promise<void> {
  await db.labels.put(label);
}

export async function deleteLabel(id: string): Promise<void> {
  await db.labels.delete(id);
}

export async function duplicateLabel(id: string): Promise<SavedLabel | undefined> {
  const original = await getLabelById(id);
  if (!original) return undefined;

  const newId = 'label_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = Date.now();
  const copy: SavedLabel = {
    ...original,
    id: newId,
    name: `${original.name} コピー`,
    createdAt: now,
    updatedAt: now,
  };

  await db.labels.add(copy);
  return copy;
}

/**
 * 全ラベルデータをJSON文字列としてエクスポート
 */
export async function exportLabelsToJson(): Promise<string> {
  const labels = await getAllLabels();
  return JSON.stringify(labels, null, 2);
}

/**
 * JSON文字列からラベルデータをインポート
 */
export async function importLabelsFromJson(jsonString: string): Promise<number> {
  const labels: SavedLabel[] = JSON.parse(jsonString);
  if (!Array.isArray(labels)) {
    throw new Error('不正なラベルデータ形式です');
  }
  let count = 0;
  for (const label of labels) {
    if (label.id && label.name && label.width && label.height) {
      await db.labels.put(label);
      count++;
    }
  }
  return count;
}

