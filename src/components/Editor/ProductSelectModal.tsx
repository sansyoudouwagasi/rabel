import React, { useEffect, useState } from 'react';
import type { Product } from '../../types/product';
import { getAllProducts, saveProduct } from '../../db/productRepository';
import { getAppSettings } from '../../db/database';
import { X, Plus, Package, Check } from 'lucide-react';

interface ProductSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductSelectModal: React.FC<ProductSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [volume, setVolume] = useState('');
  const [expiry, setExpiry] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    const list = await getAllProducts();
    setProducts(list);
  };

  if (!isOpen) return null;

  const handleQuickAdd = async () => {
    if (!name.trim()) return;
    const settings = await getAppSettings();
    const now = Date.now();
    const newProduct: Product = {
      id: 'prod_' + now + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      price: parseInt(price, 10) || 0,
      volume: volume.trim() || undefined,
      expiry: expiry.trim() || undefined,
      shopName: settings.shopName || undefined,
      createdAt: now,
      updatedAt: now,
    };
    await saveProduct(newProduct);
    setName('');
    setPrice('');
    setVolume('');
    setExpiry('');
    setIsCreating(false);
    await loadProducts();
    onSelectProduct(newProduct);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-800">
              {isCreating ? '商品を登録' : '商品からラベルを作る'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {isCreating ? (
            <div className="space-y-3">
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
                    placeholder="例: 280"
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
                    placeholder="例: 1個"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  消費期限
                </label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="例: 枠外下部に記載"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 h-11 border border-slate-300 rounded-xl font-bold text-slate-600 text-sm"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  disabled={!name.trim()}
                  className="flex-1 h-11 bg-blue-600 disabled:bg-blue-300 text-white rounded-xl font-bold text-sm shadow-xs"
                >
                  登録して配置
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 leading-relaxed">
                商品を選択すると、商品名・価格・内容量・店名がラベル上に自動配置されます。
              </p>

              {products.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-xs text-slate-400">
                    登録されている商品がまだありません
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="h-10 px-4 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>最初の商品を登録する</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      登録商品一覧
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreating(true)}
                      className="text-xs font-bold text-blue-600 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>新規登録</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onSelectProduct(p)}
                        className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group"
                      >
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-600">
                            {p.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {p.price ? `${p.price.toLocaleString()}円` : '価格未設定'}
                            {p.volume && ` / ${p.volume}`}
                          </p>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
