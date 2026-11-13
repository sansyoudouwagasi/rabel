import * as fabric from 'fabric';
import { toVerticalText } from '../utils/textDirection';
import { DEFAULT_FONT_FAMILY } from '../utils/fonts';
import {
  applyFoodBackLabelToCanvas,
  DEFAULT_FOOD_LABEL_WITH_NUTRITION,
  DEFAULT_FOOD_LABEL_STANDARD,
} from '../utils/foodLabelBuilder';

export interface LabelTemplate {
  id: string;
  name: string;
  category: 'simple' | 'japanese' | 'product' | 'promo';
  description: string;
  backgroundColor: string;
  isFoodBackLabel?: boolean;
  apply: (canvas: fabric.Canvas, width: number, height: number) => void;
}

function createText(
  rawText: string,
  options: Partial<fabric.ITextProps>,
  isVertical: boolean = false
): fabric.IText {
  const displayText = isVertical ? toVerticalText(rawText) : rawText;
  const textObj = new fabric.IText(displayText, {
    fontFamily: DEFAULT_FONT_FAMILY,
    ...options,
    textAlign: isVertical ? 'center' : options.textAlign || 'left',
    lineHeight: isVertical ? 1.05 : options.lineHeight || 1.16,
  });
  (textObj as unknown as { isVertical?: boolean; rawText?: string }).isVertical = isVertical;
  (textObj as unknown as { isVertical?: boolean; rawText?: string }).rawText = rawText;
  return textObj;
}

export const TEMPLATES: LabelTemplate[] = [
  // 0-A. 食品裏ラベル (栄養成分表示付き - 提示画像完全準拠)
  {
    id: 'food-back-full',
    name: '食品裏ラベル (栄養成分付)',
    category: 'product',
    description: '名称・原材料名・内容量・消費期限・保存方法・製造者＋栄養成分表示の表枠',
    backgroundColor: '#ffffff',
    isFoodBackLabel: true,
    apply: (canvas, width, height) => {
      applyFoodBackLabelToCanvas(canvas, width, height, DEFAULT_FOOD_LABEL_WITH_NUTRITION);
    },
  },

  // 0-B. 食品裏ラベル (標準・一括表示枠のみ)
  {
    id: 'food-back-standard',
    name: '食品裏ラベル (一括表示)',
    category: 'product',
    description: '名称・原材料名・内容量・消費期限・保存方法・製造者の標準裏ラベル表',
    backgroundColor: '#ffffff',
    isFoodBackLabel: true,
    apply: (canvas, width, height) => {
      applyFoodBackLabelToCanvas(canvas, width, height, DEFAULT_FOOD_LABEL_STANDARD);
    },
  },

  // 1. シンプル白
  {
    id: 'simple-white',
    name: 'シンプル白',
    category: 'simple',
    description: '白無地に商品名と価格のすっきりデザイン',
    backgroundColor: '#ffffff',
    apply: (canvas, width, height) => {
      const base = Math.min(width, height);
      const name = createText('商品名', {
        left: width / 2,
        top: height * 0.35,
        fontSize: Math.round(base * 0.16),
        fontWeight: 'bold',
        fill: '#1e293b',
        originX: 'center',
        originY: 'center',
      });
      const price = createText('¥280', {
        left: width / 2,
        top: height * 0.65,
        fontSize: Math.round(base * 0.22),
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
      const base = Math.min(width, height);
      const padding = Math.max(12, Math.round(base * 0.05));
      const border = new fabric.Rect({
        left: padding,
        top: padding,
        width: width - padding * 2,
        height: height - padding * 2,
        originX: 'left',
        originY: 'top',
        fill: 'transparent',
        stroke: '#334155',
        strokeWidth: 4,
        rx: 8,
        ry: 8,
      });
      const name = createText('おすすめ商品', {
        left: width / 2,
        top: height * 0.36,
        fontSize: Math.round(base * 0.14),
        fontWeight: 'bold',
        fill: '#1e293b',
        originX: 'center',
        originY: 'center',
      });
      const price = createText('税込 380円', {
        left: width / 2,
        top: height * 0.66,
        fontSize: Math.round(base * 0.16),
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
      const base = Math.min(width, height);
      const isPortrait = height > width;
      const pad = Math.max(14, Math.round(base * 0.06));
      const border = new fabric.Rect({
        left: pad,
        top: pad,
        width: width - pad * 2,
        height: height - pad * 2,
        originX: 'left',
        originY: 'top',
        fill: 'transparent',
        stroke: '#854d0e',
        strokeWidth: 3,
      });
      const name = createText(
        isPortrait ? '特選和菓子' : '特選 和菓子',
        {
          left: width / 2,
          top: isPortrait ? height * 0.42 : height * 0.35,
          fontSize: Math.round(base * (isPortrait ? 0.14 : 0.16)),
          fontFamily: '"Shippori Mincho", "Noto Serif JP", serif',
          fontWeight: 'bold',
          fill: '#451a03',
          originX: 'center',
          originY: 'center',
        },
        isPortrait
      );
      const price = createText('250円', {
        left: width / 2,
        top: isPortrait ? height * 0.82 : height * 0.65,
        fontSize: Math.round(base * 0.17),
        fontFamily: '"Shippori Mincho", "Noto Serif JP", serif',
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
      const base = Math.min(width, height);
      const isPortrait = height > width;
      const pad = Math.max(14, Math.round(base * 0.055));
      const border = new fabric.Rect({
        left: pad,
        top: pad,
        width: width - pad * 2,
        height: height - pad * 2,
        originX: 'left',
        originY: 'top',
        fill: 'transparent',
        stroke: '#94a3b8',
        strokeWidth: 2,
      });
      const name = createText(
        isPortrait ? '銘菓撰' : '銘菓 撰',
        {
          left: width / 2,
          top: isPortrait ? height * 0.42 : height * 0.35,
          fontSize: Math.round(base * 0.17),
          fontFamily: '"Yuji Syuku", "Noto Serif JP", serif',
          fontWeight: 'bold',
          fill: '#f8fafc',
          originX: 'center',
          originY: 'center',
        },
        isPortrait
      );
      const price = createText('¥420', {
        left: width / 2,
        top: isPortrait ? height * 0.8 : height * 0.68,
        fontSize: Math.round(base * 0.19),
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
      const base = Math.min(width, height);
      const isPortrait = height > width;
      const bandRatio = isPortrait ? 0.22 : 0.28;
      const topBand = new fabric.Rect({
        left: 0,
        top: 0,
        width: width,
        height: height * bandRatio,
        originX: 'left',
        originY: 'top',
        fill: '#78350f',
      });
      const header = createText('手作りお菓子', {
        left: width / 2,
        top: height * (bandRatio / 2),
        fontSize: Math.round(base * 0.11),
        fill: '#ffffff',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
      });
      const name = createText('栗まんじゅう', {
        left: width / 2,
        top: height * 0.52,
        fontSize: Math.round(base * 0.14),
        fill: '#451a03',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
      });
      const price = createText('280円', {
        left: width / 2,
        top: height * 0.78,
        fontSize: Math.round(base * 0.17),
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
      const base = Math.min(width, height);
      const isPortrait = height > width;
      const sealX = isPortrait ? width / 2 : width * 0.2;
      const sealY = isPortrait ? height * 0.22 : height * 0.35;
      const seal = new fabric.Circle({
        left: sealX,
        top: sealY,
        radius: base * 0.13,
        fill: '#dc2626',
        originX: 'center',
        originY: 'center',
      });
      const sealText = createText('雅', {
        left: sealX,
        top: sealY,
        fontSize: Math.round(base * 0.15),
        fontFamily: '"Yuji Syuku", "Noto Serif JP", serif',
        fill: '#ffffff',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
      });
      const name = createText('京都 宇治抹茶', {
        left: isPortrait ? width / 2 : width * 0.58,
        top: isPortrait ? height * 0.52 : height * 0.35,
        fontSize: Math.round(base * 0.13),
        fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif',
        fill: '#1f2937',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
      });
      const price = createText('550円 (税込)', {
        left: width / 2,
        top: isPortrait ? height * 0.78 : height * 0.72,
        fontSize: Math.round(base * 0.14),
        fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif',
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
      const base = Math.min(width, height);
      const isPortrait = height > width;
      const pad = Math.max(16, Math.round(base * 0.06));

      if (isPortrait) {
        const name = createText('商品名', {
          left: width / 2,
          top: height * 0.16,
          fontSize: Math.round(base * 0.15),
          fontWeight: 'bold',
          fill: '#0f172a',
          originX: 'center',
          originY: 'center',
        });
        const price = createText('¥480', {
          left: width / 2,
          top: height * 0.33,
          fontSize: Math.round(base * 0.19),
          fontWeight: 'bold',
          fill: '#e11d48',
          originX: 'center',
          originY: 'center',
        });
        const line = new fabric.Line([pad, height * 0.45, width - pad, height * 0.45], {
          stroke: '#cbd5e1',
          strokeWidth: 2,
        });
        const details = createText('内容量: 1個\n保存方法: 冷暗所\n製造者: 自家製菓舗', {
          left: pad,
          top: height * 0.68,
          fontSize: Math.round(base * 0.085),
          fill: '#475569',
          originX: 'left',
          originY: 'center',
          lineHeight: 1.35,
        });
        canvas.add(name, price, line, details);
      } else {
        const name = createText('商品名', {
          left: pad,
          top: height * 0.22,
          fontSize: Math.round(base * 0.16),
          fontWeight: 'bold',
          fill: '#0f172a',
          originX: 'left',
          originY: 'center',
        });
        const price = createText('¥480', {
          left: width - pad,
          top: height * 0.22,
          fontSize: Math.round(base * 0.2),
          fontWeight: 'bold',
          fill: '#e11d48',
          originX: 'right',
          originY: 'center',
        });
        const line = new fabric.Line([pad, height * 0.42, width - pad, height * 0.42], {
          stroke: '#cbd5e1',
          strokeWidth: 2,
        });
        const details = createText('内容量: 1個\n保存方法: 直射日光を避け涼しい所\n製造者: 自家製菓舗', {
          left: pad,
          top: height * 0.65,
          fontSize: Math.round(base * 0.09),
          fill: '#475569',
          originX: 'left',
          originY: 'center',
          lineHeight: 1.3,
        });
        canvas.add(name, price, line, details);
      }
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
      const base = Math.min(width, height);
      const tagBg = new fabric.Rect({
        left: 0,
        top: height * 0.45,
        width: width,
        height: height * 0.55,
        originX: 'left',
        originY: 'top',
        fill: '#f1f5f9',
      });
      const title = createText('タイムセール', {
        left: width / 2,
        top: height * 0.22,
        fontSize: Math.round(base * 0.13),
        fill: '#0284c7',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
      });
      const price = createText('¥ 198', {
        left: width / 2,
        top: height * 0.72,
        fontSize: Math.round(base * 0.24),
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
      const base = Math.min(width, height);
      const isPortrait = height > width;

      if (isPortrait) {
        const bannerW = width * 0.76;
        const bannerH = height * 0.2;
        const bannerX = (width - bannerW) / 2;
        const bannerY = height * 0.08;
        const banner = new fabric.Rect({
          left: bannerX,
          top: bannerY,
          width: bannerW,
          height: bannerH,
          originX: 'left',
          originY: 'top',
          fill: '#dc2626',
          rx: 6,
          ry: 6,
        });
        const saleText = createText('SALE!', {
          left: width / 2,
          top: bannerY + bannerH / 2,
          fontSize: Math.round(base * 0.15),
          fill: '#ffffff',
          fontWeight: 'bold',
          originX: 'center',
          originY: 'center',
        });
        const name = createText('本日の目玉品', {
          left: width / 2,
          top: height * 0.48,
          fontSize: Math.round(base * 0.13),
          fontWeight: 'bold',
          fill: '#1e293b',
          originX: 'center',
          originY: 'center',
        });
        const price = createText('半額 290円', {
          left: width / 2,
          top: height * 0.75,
          fontSize: Math.round(base * 0.18),
          fontWeight: 'bold',
          fill: '#dc2626',
          originX: 'center',
          originY: 'center',
        });
        canvas.add(banner, saleText, name, price);
      } else {
        const banner = new fabric.Rect({
          left: 16,
          top: 16,
          width: width * 0.38,
          height: height * 0.28,
          originX: 'left',
          originY: 'top',
          fill: '#dc2626',
          rx: 6,
          ry: 6,
        });
        const saleText = createText('SALE!', {
          left: 16 + (width * 0.38) / 2,
          top: 16 + (height * 0.28) / 2,
          fontSize: Math.round(base * 0.15),
          fill: '#ffffff',
          fontWeight: 'bold',
          originX: 'center',
          originY: 'center',
        });
        const name = createText('本日の目玉品', {
          left: width * 0.65,
          top: height * 0.3,
          fontSize: Math.round(base * 0.13),
          fontWeight: 'bold',
          fill: '#1e293b',
          originX: 'center',
          originY: 'center',
        });
        const price = createText('半額 290円', {
          left: width / 2,
          top: height * 0.7,
          fontSize: Math.round(base * 0.22),
          fontWeight: 'bold',
          fill: '#dc2626',
          originX: 'center',
          originY: 'center',
        });
        canvas.add(banner, saleText, name, price);
      }
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
      const base = Math.min(width, height);
      const isPortrait = height > width;
      const ribbonH = height * (isPortrait ? 0.2 : 0.26);
      const ribbonY = height * 0.1;
      const ribbon = new fabric.Rect({
        left: 0,
        top: ribbonY,
        width: width,
        height: ribbonH,
        originX: 'left',
        originY: 'top',
        fill: '#f59e0b',
      });
      const ribbonText = createText('★ 店長おすすめ ★', {
        left: width / 2,
        top: ribbonY + ribbonH / 2,
        fontSize: Math.round(base * 0.115),
        fill: '#ffffff',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
      });
      const name = createText('絶品 スイーツ', {
        left: width / 2,
        top: height * 0.54,
        fontSize: Math.round(base * 0.14),
        fontWeight: 'bold',
        fill: '#78350f',
        originX: 'center',
        originY: 'center',
      });
      const price = createText('350円', {
        left: width / 2,
        top: height * 0.8,
        fontSize: Math.round(base * 0.18),
        fontWeight: 'bold',
        fill: '#b45309',
        originX: 'center',
        originY: 'center',
      });
      canvas.add(ribbon, ribbonText, name, price);
    },
  },
];
