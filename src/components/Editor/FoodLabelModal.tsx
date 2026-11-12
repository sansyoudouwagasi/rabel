import React, { useState, useEffect } from 'react';
import type { FoodLabelData } from '../../utils/foodLabelBuilder';
import type { Product } from '../../types/product';
import { getAllProducts } from '../../db/productRepository';
import { X, Check, Calendar, Sparkles, Package, ClipboardList } from 'lucide-react';

interface FoodLabelModalProps {
  isOpen: boolean;
  initialData: FoodLabelData;
  onClose: () => void;
  onApply: (data: FoodLabelData) => void;
}

const CATEGORY_PRESETS = ['焼き菓子', '和生菓子', '和菓子', '生菓子', '洋菓子', '干菓子', 'まんじゅう', 'だんご'];

const ALLERGEN_PRESETS = [
  '（国内製造）',
  '／',
  '（一部に小麦・乳成分・卵を含む）',
  '（一部に小麦・卵を含む）',
  '（一部に乳成分・小麦を含む）',
  '（一部に大豆を含む）',
];

const STORAGE_PRESETS = [
  '高温、直射日光を避けて\n保存してください。',
  '直射日光・高温多湿を避けて\n保存してください。',
  '要冷蔵（10℃以下で保存）',
  '開封後はお早めにお召し上がりください。',
];

function formatDateJapanese(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}年${m}月${d}日`;
}

export const FoodLabelModal: React.FC<FoodLabelModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onApply,
}) => {
  const [formData, setFormData] = useState<FoodLabelData>(initialData);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      getAllProducts().then(setProducts).catch(console.error);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const updateField = <K extends keyof FoodLabelData>(key: K, value: FoodLabelData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // 今日から +N 日の日付を消費期限/賞味期限にセット
  const handleAddDays = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    updateField('expiry', formatDateJapanese(target));
  };

  // カレンダーピッカーからの日付変更
  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    if (!val) return;
    const [y, m, d] = val.split('-').map(Number);
    if (y && m && d) {
      updateField('expiry', `${y}年${m}月${d}日`);
    }
  };

  // 商品マスタから反映
  const handleSelectProduct = (p: Product) => {
    setFormData((prev) => ({
      ...prev,
      productTitle: p.name || prev.productTitle,
      volume: p.volume || prev.volume,
      ingredients: p.ingredients || prev.ingredients,
      storage: p.storage || prev.storage,
      expiry: p.expiry || prev.expiry,
      manufacturer: p.shopName || prev.manufacturer,
    }));
  };

  // 原材料名の末尾に定型句を追加
  const appendIngredientSnippet = (snippet: string) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients + snippet,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                食品裏ラベル（食品表示）の入力
              </h3>
              <p className="text-[11px] text-slate-500">
                原材料名・消費期限などを書き込んで枠内に自動配置します
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* スクロール可能な入力フォーム本体 */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* 商品マスタからのクイック読み込み（登録商品がある場合） */}
          {products.length > 0 && (
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                <span>登録済みの商品から自動入力：</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p)}
                    className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shadow-2xs"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 0. 商品名（枠外上部タイトル） */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700">
                枠外上部の商品名
              </label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showProductTitle}
                  onChange={(e) => updateField('showProductTitle', e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>上部に商品名を表示する</span>
              </label>
            </div>
            {formData.showProductTitle && (
              <input
                type="text"
                value={formData.productTitle}
                onChange={(e) => updateField('productTitle', e.target.value)}
                placeholder="例: クッキー（プレーン） / 特製どら焼き"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* (1) 名称 & (4) 内容量 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700">
                (1) 名　称
              </label>
              <input
                type="text"
                value={formData.categoryName}
                onChange={(e) => updateField('categoryName', e.target.value)}
                placeholder="例: 焼き菓子 / 和生菓子"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex flex-wrap gap-1 pt-0.5">
                {CATEGORY_PRESETS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateField('categoryName', cat)}
                    className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-md border border-slate-200"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700">
                (4) 内容量
              </label>
              <input
                type="text"
                value={formData.volume}
                onChange={(e) => updateField('volume', e.target.value)}
                placeholder="例: 1枚 / 1個 / 5個入"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex flex-wrap gap-1 pt-0.5">
                {['1個', '1枚', '2個入', '3個入', '5個入', '1袋', '100g'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateField('volume', v)}
                    className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-md border border-slate-200"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* (2)(3) 原材料名（重要！） */}
          <div className="space-y-1.5 bg-amber-50/40 border border-amber-200/80 rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                <span>(2)(3) 原材料名・添加物・アレルゲン</span>
              </label>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                自動折り返し対応
              </span>
            </div>

            <textarea
              rows={3}
              value={formData.ingredients}
              onChange={(e) => updateField('ingredients', e.target.value)}
              placeholder="例: 小麦粉（国内製造）、バター、砂糖、卵、食塩／ベーキングパウダー（一部に小麦・乳成分・卵を含む）"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-y leading-relaxed"
            />

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 block">
                タップで末尾に追記：
              </span>
              <div className="flex flex-wrap gap-1">
                {ALLERGEN_PRESETS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => appendIngredientSnippet(item)}
                    className="px-2 py-1 text-[10px] font-bold bg-white hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg border border-slate-200 shadow-2xs active:scale-95"
                  >
                    ＋ {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* (5) 消費期限 / 賞味期限（重要！） */}
          <div className="space-y-2 bg-blue-50/40 border border-blue-200/80 rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800">
                (5) 消費期限 ／ 賞味期限
              </label>
              {/* 見出し切り替えトグル */}
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => updateField('expiryType', '消費期限')}
                  className={`px-2.5 py-1 rounded-md font-extrabold transition-all ${
                    formData.expiryType === '消費期限'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  消費期限
                </button>
                <button
                  type="button"
                  onClick={() => updateField('expiryType', '賞味期限')}
                  className={`px-2.5 py-1 rounded-md font-extrabold transition-all ${
                    formData.expiryType === '賞味期限'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  賞味期限
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formData.expiry}
                onChange={(e) => updateField('expiry', e.target.value)}
                placeholder="例: 2026年11月15日"
                className="flex-1 h-10 px-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <label
                className="h-10 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer shrink-0 relative overflow-hidden shadow-2xs"
                title="カレンダーから選択"
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>日付選択</span>
                <input
                  type="date"
                  onChange={handleDatePickerChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>

            {/* クイック日付加算ボタン */}
            <div className="flex items-center flex-wrap gap-1 pt-0.5">
              <span className="text-[10px] font-bold text-slate-500 mr-1">
                簡単日付セット:
              </span>
              {[
                { label: '今日', days: 0 },
                { label: '明日', days: 1 },
                { label: '+2日', days: 2 },
                { label: '+3日', days: 3 },
                { label: '+5日', days: 5 },
                { label: '+7日', days: 7 },
                { label: '+14日', days: 14 },
                { label: '+30日', days: 30 },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => handleAddDays(btn.days)}
                  className="px-2 py-1 text-[10px] font-bold bg-white hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg border border-blue-200 shadow-2xs active:scale-95 transition-colors"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* (6) 保存方法 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700">
              (6) 保存方法
            </label>
            <textarea
              rows={2}
              value={formData.storage}
              onChange={(e) => updateField('storage', e.target.value)}
              placeholder="例: 高温、直射日光を避けて保存してください。"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex flex-wrap gap-1">
              {STORAGE_PRESETS.map((st, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => updateField('storage', st)}
                  className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-md border border-slate-200"
                >
                  {st.replace('\n', '')}
                </button>
              ))}
            </div>
          </div>

          {/* (7) 製造者 / 販売者 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700">
                (7) 製造者・販売者（名称と住所）
              </label>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                <button
                  type="button"
                  onClick={() => updateField('manufacturerType', '製 造 者')}
                  className={`px-2 py-0.5 rounded-md font-bold ${
                    formData.manufacturerType === '製 造 者'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  製造者
                </button>
                <button
                  type="button"
                  onClick={() => updateField('manufacturerType', '販 売 者')}
                  className={`px-2 py-0.5 rounded-md font-bold ${
                    formData.manufacturerType === '販 売 者'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  販売者
                </button>
              </div>
            </div>
            <textarea
              rows={2}
              value={formData.manufacturer}
              onChange={(e) => updateField('manufacturer', e.target.value)}
              placeholder="例: （株）洋菓子店A&#10;東京都○○区○○ XX-XX"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* (8) 栄養成分表示 */}
          <div className="space-y-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>(8) 栄養成分表示枠を表示する</span>
              </label>
              <input
                type="checkbox"
                checked={formData.showNutrition}
                onChange={(e) => updateField('showNutrition', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {formData.showNutrition && (
              <div className="space-y-2.5 pt-1 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    見出し
                  </label>
                  <input
                    type="text"
                    value={formData.nutritionTitle}
                    onChange={(e) => updateField('nutritionTitle', e.target.value)}
                    placeholder="栄養成分表示（1個当たり）"
                    className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      エネルギー
                    </label>
                    <input
                      type="text"
                      value={formData.energy}
                      onChange={(e) => updateField('energy', e.target.value)}
                      placeholder="120kcal"
                      className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      たんぱく質
                    </label>
                    <input
                      type="text"
                      value={formData.protein}
                      onChange={(e) => updateField('protein', e.target.value)}
                      placeholder="2.1g"
                      className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      脂質
                    </label>
                    <input
                      type="text"
                      value={formData.fat}
                      onChange={(e) => updateField('fat', e.target.value)}
                      placeholder="5.4g"
                      className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      炭水化物
                    </label>
                    <input
                      type="text"
                      value={formData.carbs}
                      onChange={(e) => updateField('carbs', e.target.value)}
                      placeholder="18.2g"
                      className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      食塩相当量
                    </label>
                    <input
                      type="text"
                      value={formData.salt}
                      onChange={(e) => updateField('salt', e.target.value)}
                      placeholder="0.1g"
                      className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={formData.showNutritionNote}
                    onChange={(e) => updateField('showNutritionNote', e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>枠外下に「この表示値は、目安です。」を表示する</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* フッターボタン */}
        <div className="p-4 border-t border-slate-200 flex gap-2.5 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 border border-slate-300 bg-white hover:bg-slate-50 rounded-2xl font-bold text-slate-600 text-sm"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => onApply(formData)}
            className="flex-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-sm shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>この内容で裏ラベルを作成・更新</span>
          </button>
        </div>
      </div>
    </div>
  );
};

