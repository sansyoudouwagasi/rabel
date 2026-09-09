import * as fabric from 'fabric';

export interface LabelTemplate {
  id: string;
  name: string;
  category: 'simple' | 'japanese' | 'product' | 'promo';
  description: string;
  backgroundColor: string;
  apply: (canvas: fabric.Canvas, width: number, height: number) => void;
}

export const TEMPLATES: LabelTemplate[] = [
  // 1. シンプル白
  {
    id: 'simple-white',
    name: 'シンプル白',
    category: 'simple',
    description: '白無地に商品名と価格のすっきりデザイン',
    backgroundColor: '#ffffff',
    apply: (canvas, width, height) => {
      const name = new fabric.IText('商品名', {
        left: width / 2,
        top: height * 0.35,
        fontSize: Math.round(height * 0.16),
        fontWeight: 'bold',
        fill: '#1e293b',
        originX: 'center',
        originY: 'center',
      });
      const price = new fabric.IText('¥280', {
        left: width / 2,
        top: height * 0.65,
        fontSize: Math.round(height * 0.22),
        fontWeight: 'bold',
        fill: '#dc2626',
        originX: 'center',
        originY: 'center',
      });
      canvas.add(name, price);
    },
  },

  // 2. シンプル枠
  {
    id: 'simple-border',
    name: 'シンプル枠',
    category: 'simple',
    description: '細枠で囲んだ清潔感のある定番スタイル',
    backgroundColor: '#ffffff',
    apply: (canvas, width, height) => {
      const padding = 16;
      const border = new fabric.Rect({
        left: padding,
        top: padding,
        width: width - padding * 2,
        height: height - padding * 2,
        fill: 'transparent',
        stroke: '#334155',
        strokeWidth: 4,
        rx: 8,
        ry: 8,
      });
      const name = new fabric.IText('おすすめ商品', {
        left: width / 2,
        top: height * 0.35,
        fontSize: Math.round(height * 0.15),
        fontWeight: 'bold',
        fill: '#1e293b',
        originX: 'center',
        originY: 'center',
      });
      const price = new fabric.IText('税込 380円', {
        left: width / 2,
        top: height * 0.65,
        fontSize: Math.round(height * 0.16),
        fill: '#475569',
        originX: 'center',
        originY: 'center',
      });
      canvas.add(border, name, price);
    },
  },

  // 3. 和紙風
  {
    id: 'japanese-washi',
    name: '和紙風',
    category: 'japanese',
    description: '生成り色の落ち着いた和テイスト',
    backgroundColor: '#fdfbf7',
    apply: (canvas, width, height) => {
      const border = new fabric.Rect({
        left: 20,
        top: 20,
        width: width - 40,
        height: height - 40,
        fill: 'transparent',
        stroke: '#854d0e',
        strokeWidth: 3,
      });
      const name = new fabric.IText('特選 和菓子', {
        left: width / 2,
        top: height * 0.35,
        fontSize: Math.round(height * 0.16),
        fontFamily: '"Yu Mincho", "Hiragino Mincho ProN", serif',
        fontWeight: 'bold',
        fill: '#451a03',
        originX: 'center',
        originY: 'center',
      });
      const price = new fabric.IText('250円', {
        left: width / 2,
        top: height * 0.65,
        fontSize: Math.round(height * 0.18),
        fontFamily: '"Yu Mincho", "Hiragino Mincho ProN", serif',
        fontWeight: 'bold',
        fill: '#991b1b',
        originX: 'center',
        originY: 'center',
      });
      canvas.add(border, name, price);
    },
  },

  // 4. 紺×白
  {
    id: 'japanese-navy',
    name: '紺×白',
    category: 'japanese',
    description: '濃紺に白文字が映える高級感ある和モダン',
    backgroundColor: '#0f172a',
    apply: (canvas, width, height) => {
      const border = new fabric.Rect({
        left: 18,
        top: 18,
        width: width - 36,
        height: height - 36,
        fill: 'transparent',
        stroke: '#94a3b8',
        strokeWidth: 2,
      });
      const name = new fabric.IText('銘菓 撰', {
        left: width / 2,
        top: height * 0.35,
        fontSize: Math.round(height * 0.17),
        fontFamily: '"Yu Mincho", "Hiragino Mincho ProN", serif',
        fontWeight: 'bold',
        fill: '#f8fafc',
        originX: 'center',
        originY: 'center',
      });
      const price = new fabric.IText('¥420', {
        left: width / 2,
        top: height * 0.68,
        fontSize: Math.round(height * 0.2),
        fontWeight: 'bold',
        fill: '#fbbf24',
        originX: 'center',
        originY: 'center',
      });
      canvas.add(border, name, price);
    },
  },

  // 5. 茶×ベージュ
  {
    id: 'japanese-brown',
    name: '茶×ベージュ',
    category: 'japanese',
    description: 'ぬくもりある茶系で素朴な手作り感を演出',
    backgroundColor: '#fef3c7',
    apply: (canvas, width, height) => {
      const topBand = new fabric.Rect({
        left: 0,
        top: 0,
        width: width,
        height: height * 0.28,
        fill: '#78350f',
      });
      const header = new fabric.IText('手作りお菓子', {
        left: width / 2,
        top: height * 0.14,
        fontSize: Math.round(height * 0.12),
        fill: '#ffffff',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
      });
      const name = new fabric.IText('栗まんじゅう', {
        left: width / 2,
        top: height * 0.52,
        fontSize: Math.round(height * 0.16),
        fill: '#451a03',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
      });
      const price = new fabric.IText('280円', {
        left: width / 2,
        top: height * 0.78,
        fontSize: Math.round(height * 0.18),
        fill: '#b45309',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
      });
      canvas.add(topBand, header, name, price);
    },
  },

  // 6. 上品な和風
  {
    id: 'japanese-elegant',
    name: '上品な和風',
    category: 'japanese',
    description: '朱色のアクセントが際立つ本格和風',
    backgroundColor: '#fffdfa',
    apply: (canvas, width, height) => {
      const seal = new fabric.Circle({
        left: width * 0.2,
        top: height * 0.35,
        radius: height * 0.14,
        fill: '#dc2626',
        originX: 'center',
        originY: 'center',
      });
      const sealText = new fabric.IText('雅', {
        left: width * 0.2,
        top: height * 0.35,
        fontSize: Math.round(height * 0.16),
        fontFamily: '"Yu Mincho", "Hiragino Mincho ProN", serif',
        fill: '#ffffff',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
      });
      const name = new fabric.IText('京都 宇治抹茶', {
        left: width * 0.58,
        top: height * 0.35,
        fontSize: Math.round(height * 0.15),
        fontFamily: '"Yu Mincho", "Hiragino Mincho ProN", serif',
        fill: '#1f2937',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
      });
      const price = new fabric.IText('550円 (税込)', {
        left: width / 2,
        top: height * 0.72,
        fontSize: Math.round(height * 0.15),
        fontFamily: '"Yu Mincho", "Hiragino Mincho ProN", serif',
        fill: '#4b5563',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
      });
      canvas.add(seal, sealText, name, price);
    },
  },

  // 7. 商品ラベル
  {
    id: 'product-standard',
    name: '商品ラベル',
    category: 'product',
    description: '商品名・内容量・保存方法などを網羅した食品ラベル',
    backgroundColor: '#ffffff',
    apply: (canvas, width, height) => {
      const name = new fabric.IText('商品名', {
        left: 24,
        top: height * 0.22,
        fontSize: Math.round(height * 0.16),
        fontWeight: 'bold',
        fill: '#0f172a',
        originX: 'left',
        originY: 'center',
      });
      const price = new fabric.IText('¥480', {
        left: width - 24,
        top: height * 0.22,
        fontSize: Math.round(height * 0.2),
        fontWeight: 'bold',
        fill: '#e11d48',
        originX: 'right',
        originY: 'center',
      });
      const line = new fabric.Line([24, height * 0.42, width - 24, height * 0.42], {
        stroke: '#cbd5e1',
        strokeWidth: 2,
      });
      const details = new fabric.IText('内容量: 1個\n保存方法: 直射日光を避け涼しい所\n製造者: 自家製菓舗', {
        left: 24,
        top: height * 0.65,
        fontSize: Math.round(height * 0.09),
        fill: '#475569',
        originX: 'left',
        originY: 'center',
        lineHeight: 1.3,
      });
      canvas.add(name, price, line, details);
    },
  },

  // 8. 値札
  {
    id: 'product-price-tag',
    name: '値札',
    category: 'product',
    description: '大きな価格表示が目を引く店頭用プライスカード',
    backgroundColor: '#ffffff',
    apply: (canvas, width, height) => {
      const tagBg = new fabric.Rect({
        left: 0,
        top: height * 0.45,
        width: width,
        height: height * 0.55,
        fill: '#f1f5f9',
      });
      const title = new fabric.IText('タイムセール', {
        left: width / 2,
        top: height * 0.22,
        fontSize: Math.round(height * 0.14),
        fill: '#0284c7',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
      });
      const price = new fabric.IText('¥ 198', {
        left: width / 2,
        top: height * 0.72,
        fontSize: Math.round(height * 0.28),
        fill: '#dc2626',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
      });
      canvas.add(tagBg, title, price);
    },
  },

  // 9. SALE
  {
    id: 'promo-sale',
    name: 'SALE',
    category: 'promo',
    description: '赤のアクセントとSALE文字で特売をアピール',
    backgroundColor: '#ffffff',
    apply: (canvas, width, height) => {
      const banner = new fabric.Rect({
        left: 16,
        top: 16,
        width: width * 0.38,
        height: height * 0.28,
        fill: '#dc2626',
        rx: 6,
        ry: 6,
      });
      const saleText = new fabric.IText('SALE!', {
        left: 16 + (width * 0.38) / 2,
        top: 16 + (height * 0.28) / 2,
        fontSize: Math.round(height * 0.15),
        fill: '#ffffff',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
      });
      const name = new fabric.IText('本日の目玉品', {
        left: width * 0.65,
        top: height * 0.3,
        fontSize: Math.round(height * 0.13),
        fontWeight: 'bold',
        fill: '#1e293b',
        originX: 'center',
        originY: 'center',
      });
      const price = new fabric.IText('半額 290円', {
        left: width / 2,
        top: height * 0.7,
        fontSize: Math.round(height * 0.22),
        fontWeight: 'bold',
        fill: '#dc2626',
        originX: 'center',
        originY: 'center',
      });
      canvas.add(banner, saleText, name, price);
    },
  },

  // 10. おすすめ
  {
    id: 'promo-recommend',
    name: 'おすすめ',
    category: 'promo',
    description: 'リボン風帯付きのおすすめ品ラベル',
    backgroundColor: '#fffbeb',
    apply: (canvas, width, height) => {
      const ribbon = new fabric.Rect({
        left: 0,
        top: height * 0.1,
        width: width,
        height: height * 0.26,
        fill: '#f59e0b',
      });
      const ribbonText = new fabric.IText('★ 店長おすすめ ★', {
        left: width / 2,
        top: height * 0.23,
        fontSize: Math.round(height * 0.13),
        fill: '#ffffff',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
      });
      const name = new fabric.IText('絶品 スイーツ', {
        left: width / 2,
        top: height * 0.55,
        fontSize: Math.round(height * 0.15),
        fontWeight: 'bold',
        fill: '#78350f',
        originX: 'center',
        originY: 'center',
      });
      const price = new fabric.IText('350円', {
        left: width / 2,
        top: height * 0.8,
        fontSize: Math.round(height * 0.18),
        fontWeight: 'bold',
        fill: '#b45309',
        originX: 'center',
        originY: 'center',
      });
      canvas.add(ribbon, ribbonText, name, price);
    },
  },
];
