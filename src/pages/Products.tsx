import React, { useEffect, useState } from 'react';
import type { Product } from '../types/product';
import { getAllProducts, saveProduct, deleteProduct } from '../db/productRepository';
import { getAppSettings } from '../db/database';
import { Header } from '../components/Header';
import { ConfirmModal } from '../components/ConfirmModal';
import { Plus, Edit2, Trash2, Package, X, Check } from 'lucide-react';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // フォーム用状態
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [volume, setVolume] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [storage, setStorage] = useState('');
  const [expiry, setExpiry] = useState('');
  const [shopName, setShopName] = useState('');

  const loadProducts = async () => {
    const list = await getAllProducts();
    setProducts(list);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleOpenAdd = async () => {
    const settings = await getAppSettings();
    setEditingId(null);
    setName('');
    setPrice('');
    setVolume('');
    setIngredients('');
    setStorage('');
    setExpiry('');
    setShopName(settings.shopName || '');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price ? p.price.toString() : '');
    setVolume(p.volume || '');
    setIngredients(p.ingredients || '');
    setStorage(p.storage || '');
    setExpiry(p.expiry || '');
    setShopName(p.shopName || '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    const now = Date.now();
    const product: Product = {
      id: editingId || 'prod_' + now + '_' + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      price: parseInt(price, 10) || 0,
      volume: volume.trim() || undefined,
      ingredients: ingredients.trim() || undefined,
      storage: storage.trim() || undefined,
      expiry: expiry.trim() || undefined,
      shopName: shopName.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    await saveProduct(product);
    setIsModalOpen(false);
    await loadProducts();
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    await deleteProduct(productToDelete.id);
    setProductToDelete(null);
    await loadProducts();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Header
        title="商品マスタ"
        rightAction={
          <button
            type="button"
            onClick={handleOpenAdd}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"
            title="商品を追加"
            aria-label="商品を追加"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <main className="max-w-md mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-500">
            登録した商品は、ラベル作成時にワンタップで配置できます。
          </p>
        </div>

        {products.length > 0 ? (
          <div className="space-y-2.5">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                    {p.shopName && (
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md font-medium">
                        {p.shopName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="font-extrabold text-blue-600">
                      {p.price ? `${p.price.toLocaleString()}円` : '価格未設定'}
                    </span>
                    {p.volume && <span>内容量: {p.volume}</span>}
                    {p.expiry && <span>賞味: {p.expiry}</span>}
                  </div>
                  {p.ingredients && (
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      原材料: {p.ingredients}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="編集"
                    aria-label="編集"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductToDelete(p)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="削除"
                    aria-label="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-2xs space-y-4 my-8">
            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                商品が登録されていません
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                商品を登録しておくと、<br />
                ラベル作成時に商品名や価格を自動入力できます。
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>新しい商品を登録する</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 登録・編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800">
                {editingId ? '商品情報を編集' : '新しい商品を登録'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  商品名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: 栗まんじゅう"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    価格 (円)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="280"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    内容量
                  </label>
                  <input
                    type="text"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    placeholder="1個"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  店名・販売者名
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="例: 参松堂"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  原材料名
                </label>
                <textarea
                  rows={2}
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="例: 小豆、砂糖、小麦粉、栗、卵"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    保存方法
                  </label>
                  <input
                    type="text"
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    placeholder="直射日光を避けて保存"
                    className="w-full h-10 px-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    消費期限
                  </label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="製造日より3日"
                    className="w-full h-10 px-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-12 border border-slate-300 rounded-2xl font-bold text-slate-600 text-sm"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!name.trim()}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>保存する</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 商品削除確認モーダル */}
      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        title="商品の削除"
        message={`「${productToDelete?.name}」を完全に削除してもよろしいですか？この操作は元に戻せません。`}
        confirmText="削除する"
        onConfirm={handleConfirmDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};
