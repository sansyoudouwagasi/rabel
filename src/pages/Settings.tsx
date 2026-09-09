import React, { useEffect, useState } from 'react';
import type { AppSettings } from '../types/settings';
import { getAppSettings, saveAppSettings } from '../db/database';
import { exportLabelsToJson, importLabelsFromJson } from '../db/labelRepository';
import { Header } from '../components/Header';
import { Store, Type, Maximize2, Info, Check, ShieldCheck, Download, Upload } from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    getAppSettings().then(setSettings);
  }, []);

  const handleSave = async (updated: AppSettings) => {
    setSettings(updated);
    await saveAppSettings(updated);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Header title="設定" />

      <main className="max-w-md mx-auto p-4 space-y-5">
        {/* 店舗情報設定 */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Store className="w-4 h-4 text-blue-600" />
            <span>店舗情報</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              標準の店名・販売者名
            </label>
            <input
              type="text"
              value={settings.shopName}
              onChange={(e) =>
                handleSave({ ...settings, shopName: e.target.value })
              }
              placeholder="例: 和菓子処 参松堂"
              className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              商品登録やラベル作成時に自動入力されます。
            </p>
          </div>
        </section>

        {/* ラベル標準設定 */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Maximize2 className="w-4 h-4 text-blue-600" />
            <span>標準ラベルサイズ</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                標準幅 (mm)
              </label>
              <input
                type="number"
                value={settings.defaultWidth}
                onChange={(e) =>
                  handleSave({
                    ...settings,
                    defaultWidth: parseInt(e.target.value, 10) || 50,
                  })
                }
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                標準高さ (mm)
              </label>
              <input
                type="number"
                value={settings.defaultHeight}
                onChange={(e) =>
                  handleSave({
                    ...settings,
                    defaultHeight: parseInt(e.target.value, 10) || 30,
                  })
                }
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-center font-bold"
              />
            </div>
          </div>
        </section>

        {/* フォント設定 */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Type className="w-4 h-4 text-blue-600" />
            <span>文字の標準スタイル</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              標準フォント
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSave({ ...settings, defaultFont: 'gothic' })}
                className={`h-11 rounded-xl border text-xs font-bold transition-all ${
                  settings.defaultFont === 'gothic'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                    : 'bg-white border-slate-300 text-slate-600'
                }`}
              >
                ゴシック体
              </button>
              <button
                type="button"
                onClick={() => handleSave({ ...settings, defaultFont: 'mincho' })}
                className={`h-11 rounded-xl border text-xs font-bold transition-all ${
                  settings.defaultFont === 'mincho'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                    : 'bg-white border-slate-300 text-slate-600'
                }`}
              >
                明朝体 (和風)
              </button>
            </div>
          </div>
        </section>

        {/* データバックアップ・復元 */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Download className="w-4 h-4 text-blue-600" />
            <span>データ管理 (バックアップ・復元)</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            保存されたラベルデータをJSONファイルとして書き出したり、復元できます。
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={async () => {
                const json = await exportLabelsToJson();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.download = `kantan-label-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.href = url;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>バックアップ保存</span>
            </button>

            <label className="h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>データ復元</span>
              <input
                type="file"
                accept=".json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    const count = await importLabelsFromJson(text);
                    alert(`${count}件のラベルデータを復元しました`);
                  } catch (err) {
                    alert('ファイルの復元に失敗しました。正しいバックアップファイルを選択してください。');
                    console.error(err);
                  }
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
          </div>
        </section>

        {/* セキュリティ・プライバシー */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>安心・安全の端末内保存</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            作成したラベルや商品データ、写真画像はすべてお使いのスマートフォン端末内にのみ安全に保存されます。外部サーバーへ送信されることはありません。
          </p>
        </section>

        {/* アプリ情報 */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <Info className="w-4 h-4 text-slate-500" />
            <span>アプリ情報</span>
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <p>アプリ名: かんたんラベルメーカー</p>
            <p>バージョン: 1.0.0 (PWA対応)</p>
            <p>オフライン動作: 対応済み</p>
          </div>
        </section>

        {/* 保存完了トースト */}
        {savedMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xs text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg animate-in fade-in duration-200">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>設定を保存しました</span>
          </div>
        )}
      </main>
    </div>
  );
};
