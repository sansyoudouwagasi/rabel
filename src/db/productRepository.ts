import { db } from './database';
import type { Product } from '../types/product';

export async function getAllProducts(): Promise<Product[]> {
  return await db.products.orderBy('updatedAt').reverse().toArray();
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return await db.products.get(id);
}

export async function saveProduct(product: Product): Promise<void> {
  await db.products.put(product);
}

export async function deleteProduct(id: string): Promise<void> {
  await db.products.delete(id);
}
