import * as fabric from 'fabric';

export type FontCategory = 'all' | 'standard' | 'japanese' | 'brush' | 'pop';

export interface LabelFontPreset {
  id: string;
  name: string;
  shortName: string;
  category: Exclude<FontCategory, 'all'>;
  fontFamily: string;
  primaryFamily: string;
  tag: string;
  description: string;
  supportsBold: boolean;
}

export const FONT_CATEGORIES: { id: FontCategory; label: string }[] = [
  { id: 'all', label: 'すべて' },
  { id: 'standard', label: 'ゴシック・丸ゴ' },
  { id: 'japanese', label: '明朝・和風' },
  { id: 'brush', label: '筆文字・楷書・行書' },
  { id: 'pop', label: 'POP・手書き' },
];

export const LABEL_FONTS: LabelFontPreset[] = [
  // 定番・ゴシック・丸ゴシック
  {
    id: 'noto-sans',
    name: 'ゴシック体（標準）',
    shortName: 'ゴシック',
    category: 'standard',
    fontFamily: '"Noto Sans JP", "Yu Gothic", "Hiragino Sans", sans-serif',
    primaryFamily: 'Noto Sans JP',
    tag: '定番・裏ラベル向き',
    description: 'クセがなく読みやすい標準の角ゴシック体',
    supportsBold: true,
  },
  {
    id: 'zen-maru',
    name: '丸ゴシック（やさしい）',
    shortName: '丸ゴシック',
    category: 'standard',
    fontFamily: '"Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif',
    primaryFamily: 'Zen Maru Gothic',
    tag: 'やわらか',
    description: '角が丸く、親しみやすく上品な印象の丸ゴシック',
    supportsBold: true,
  },
  {
    id: 'mplus-rounded',
    name: 'くっきり丸ゴシック',
    shortName: 'くっきり丸',
    category: 'standard',
    fontFamily: '"M PLUS Rounded 1c", "Zen Maru Gothic", sans-serif',
    primaryFamily: 'M PLUS Rounded 1c',
    tag: 'POP・見やすい',
    description: '太字でも潰れにくく商品名や価格にぴったりの丸文字',
    supportsBold: true,
  },
  {
    id: 'dela-gothic',
    name: '極太インパクト（デラゴシック）',
    shortName: '極太文字',
    category: 'standard',
    fontFamily: '"Dela Gothic One", "Noto Sans JP", sans-serif',
    primaryFamily: 'Dela Gothic One',
    tag: '特売・強調',
    description: '力強く目立つ極太ゴシック。SALEや大見出しに',
    supportsBold: false,
  },

  // 明朝・和風
  {
    id: 'noto-serif',
    name: '明朝体（標準和風）',
    shortName: '明朝体',
    category: 'japanese',
    fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif',
    primaryFamily: 'Noto Serif JP',
    tag: '上品・定番',
    description: '落ち着きと高級感のある定番の明朝体',
    supportsBold: true,
  },
  {
    id: 'shippori-mincho',
    name: 'しっぽり明朝（高級和菓子風）',
    shortName: 'しっぽり明朝',
    category: 'japanese',
    fontFamily: '"Shippori Mincho", "Noto Serif JP", serif',
    primaryFamily: 'Shippori Mincho',
    tag: '高級感',
    description: '品格がありギフトや和菓子ラベルによく合う繊細な明朝体',
    supportsBold: true,
  },
  {
    id: 'hina-mincho',
    name: 'ひな明朝（レトロ和風）',
    shortName: 'ひな明朝',
    category: 'japanese',
    fontFamily: '"Hina Mincho", "Noto Serif JP", serif',
    primaryFamily: 'Hina Mincho',
    tag: '懐かし和風',
    description: '少し丸みのあるレトロで温かい雰囲気の明朝体',
    supportsBold: false,
  },
  {
    id: 'kaisei-decol',
    name: '解星デコル（お洒落明朝）',
    shortName: '解星デコル',
    category: 'japanese',
    fontFamily: '"Kaisei Decol", "Noto Serif JP", serif',
    primaryFamily: 'Kaisei Decol',
    tag: 'おしゃれ',
    description: '文字の端にさりげない装飾があるモダン和風・洋菓子にも合う書体',
    supportsBold: true,
  },

  // 筆文字・楷書・行書・墨文字系
  {
    id: 'yuji-syuku',
    name: '楷書筆文字（游字・粛）',
    shortName: '楷書風',
    category: 'brush',
    fontFamily: '"Yuji Syuku", "Noto Serif JP", serif',
    primaryFamily: 'Yuji Syuku',
    tag: '楷書・筆文字',
    description: '礼儀正しく凛とした毛筆楷書風。銘菓や商品名に最適',
    supportsBold: false,
  },
  {
    id: 'yuji-mai',
    name: '行書筆文字（游字・舞）',
    shortName: '行書風',
    category: 'brush',
    fontFamily: '"Yuji Mai", "Yuji Syuku", serif',
    primaryFamily: 'Yuji Mai',
    tag: '行書・流麗',
    description: '筆の流れが美しい行書風の毛筆体。のし・贈答品にも',
    supportsBold: false,
  },
  {
    id: 'yuji-boku',
    name: 'クラフト墨文字（游字・墨）',
    shortName: '墨文字',
    category: 'brush',
    fontFamily: '"Yuji Boku", "Yuji Syuku", serif',
    primaryFamily: 'Yuji Boku',
    tag: '墨筆・味のある字',
    description: '味のある力強い墨筆風。手作り感・職人感を演出',
    supportsBold: false,
  },
  {
    id: 'klee-one',
    name: '硬筆楷書・教科書体（クレー）',
    shortName: '教科書風',
    category: 'brush',
    fontFamily: '"Klee One", "Noto Serif JP", serif',
    primaryFamily: 'Klee One',
    tag: '丁寧・読みやすい',
    description: '手書きのペン字・楷書のような丁寧で優しい書体',
    supportsBold: true,
  },

  // POP・手書き・勘亭流風
  {
    id: 'kiwi-maru',
    name: 'なごみPOP（キウイ丸）',
    shortName: 'なごみPOP',
    category: 'pop',
    fontFamily: '"Kiwi Maru", "Zen Maru Gothic", serif',
    primaryFamily: 'Kiwi Maru',
    tag: 'なごみPOP',
    description: 'ころんと温かみのある和み系POP書体。お菓子やパンにぴったり',
    supportsBold: false,
  },
  {
    id: 'hachi-maru-pop',
    name: 'まる文字POP（はちまる）',
    shortName: 'まるPOP',
    category: 'pop',
    fontFamily: '"Hachi Maru Pop", "Zen Maru Gothic", sans-serif',
    primaryFamily: 'Hachi Maru Pop',
    tag: 'かわいい',
    description: '手書きの丸文字のような可愛らしく親しみのあるPOP書体',
    supportsBold: false,
  },
  {
    id: 'yomogi',
    name: '手書きメモ風（よもぎ）',
    shortName: '手書き風',
    category: 'pop',
    fontFamily: '"Yomogi", "Zen Maru Gothic", sans-serif',
    primaryFamily: 'Yomogi',
    tag: 'ナチュラル',
    description: '自然体でやさしい手書き風のフォント。手作りメッセージに',
    supportsBold: false,
  },
  {
    id: 'reggae-one',
    name: '看板・勘亭流風（レゲエ）',
    shortName: '看板POP',
    category: 'pop',
    fontFamily: '"Reggae One", "Dela Gothic One", sans-serif',
    primaryFamily: 'Reggae One',
    tag: 'お祭り・力強い',
    description: 'ハネと勢いのある看板・勘亭流テイストの和風POP書体',
    supportsBold: false,
  },
];

export const DEFAULT_FONT_FAMILY = LABEL_FONTS[0].fontFamily;

/**
 * fontFamily文字列から対応するプリセットを検索する
 */
export function findFontPreset(fontFamily?: string): LabelFontPreset {
  if (!fontFamily) return LABEL_FONTS[0];

  const lower = fontFamily.toLowerCase();
  const exact = LABEL_FONTS.find(
    (f) =>
      f.fontFamily.toLowerCase() === lower ||
      lower.includes(f.primaryFamily.toLowerCase())
  );
  if (exact) return exact;

  // 従来のシステムフォント指定との後方互換マッピング
  if (lower.includes('mincho') || lower.includes('serif')) {
    return LABEL_FONTS.find((f) => f.id === 'noto-serif') || LABEL_FONTS[0];
  }
  return LABEL_FONTS[0];
}

/**
 * 指定したフォントファミリーがブラウザに読み込まれるまで待機し、Fabricのキャッシュを更新する
 */
export async function ensureFontLoaded(
  fontFamily?: string,
  sampleText: string = 'あいう漢字ABC123'
): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;

  const preset = findFontPreset(fontFamily);
  const primary = preset.primaryFamily;

  try {
    const loads: Promise<FontFace[]>[] = [
      document.fonts.load(`400 24px "${primary}"`, sampleText),
    ];
    if (preset.supportsBold) {
      loads.push(document.fonts.load(`700 24px "${primary}"`, sampleText));
    }
    await Promise.race([
      Promise.all(loads),
      new Promise<void>((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch {
    // オフライン時などはシステムフォントにフォールバックさせる
  }

  try {
    fabric.cache.clearFontCache(preset.fontFamily);
    fabric.cache.clearFontCache(primary);
    fabric.cache.clearFontCache();
  } catch {
    // noop
  }
}

/**
 * キャンバス上の全テキストオブジェクトで使用中のWebフォントを読み込み・再描画する
 */
export async function refreshCanvasFonts(canvas: fabric.Canvas | null): Promise<void> {
  if (!canvas) return;
  const objects = canvas.getObjects();
  const textObjs = objects.filter((o): o is fabric.IText => o instanceof fabric.IText);
  if (textObjs.length === 0) return;

  const uniqueFamilies = new Set<string>();
  const sampleChars = new Set<string>();

  textObjs.forEach((t) => {
    if (t.fontFamily) uniqueFamilies.add(t.fontFamily);
    if (t.text) {
      Array.from(t.text).forEach((ch) => sampleChars.add(ch));
    }
  });

  const sampleStr = Array.from(sampleChars).slice(0, 60).join('') || 'あいう漢字ABC';
  await Promise.all(
    Array.from(uniqueFamilies).map((fam) => ensureFontLoaded(fam, sampleStr))
  );

  textObjs.forEach((t) => {
    t.initDimensions();
    t.setCoords();
  });
  canvas.renderAll();
}
