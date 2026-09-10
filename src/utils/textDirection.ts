/**
 * 縦書き用テキスト変換ユーティリティ
 */

/**
 * 1文字を縦書き用の適切なグリフ・記号に変換
 */
export function convertCharToVertical(char: string): string {
  switch (char) {
    // 長音符・ダッシュ・ハイフン
    case 'ー':
    case '―':
    case '–':
    case '—':
    case '-':
    case '－':
      return '丨'; // U+4E28 (中央の縦棒として全フォントで確実に描画)
    // 括弧類
    case '（':
    case '(':
      return '︵';
    case '）':
    case ')':
      return '︶';
    case '〔':
      return '︹';
    case '〕':
      return '︺';
    case '【':
      return '︻';
    case '】':
      return '︼';
    case '［':
    case '[':
      return '﹇';
    case '］':
    case ']':
      return '﹈';
    case '「':
      return '﹁';
    case '」':
      return '﹂';
    case '『':
      return '﹃';
    case '』':
      return '﹄';
    case '〈':
      return '︿';
    case '〉':
      return '﹀';
    case '《':
      return '︽';
    case '》':
      return '︾';
    // 記号類
    case '…':
      return '︙';
    case '‥':
      return '︰';
    case '：':
    case ':':
      return '︓';
    case '；':
    case ';':
      return '︔';
    default:
      return char;
  }
}

/**
 * 縦書き記号から横書き用の通常の文字に逆変換
 */
export function convertCharToHorizontal(char: string): string {
  switch (char) {
    case '丨':
      return 'ー';
    case '︵':
      return '（';
    case '︶':
      return '）';
    case '︹':
      return '〔';
    case '︺':
      return '〕';
    case '︻':
      return '【';
    case '︼':
      return '】';
    case '﹇':
      return '［';
    case '﹈':
      return '］';
    case '﹁':
      return '「';
    case '﹂':
      return '」';
    case '﹃':
      return '『';
    case '﹄':
      return '』';
    case '︿':
      return '〈';
    case '﹀':
      return '〉';
    case '︽':
      return '《';
    case '︾':
      return '》';
    case '︙':
      return '…';
    case '︰':
      return '‥';
    case '︓':
      return '：';
    case '︔':
      return '；';
    default:
      return char;
  }
}

/**
 * 生テキストをFabric.js用の縦書きテキストに変換
 * - 1行の場合は文字ごとに改行
 * - 複数行の場合は右から左へ並ぶ列マトリクスを生成
 */
export function toVerticalText(rawText: string): string {
  if (!rawText) return '';
  const lines = rawText.split('\n');

  if (lines.length <= 1) {
    return Array.from(rawText).map(convertCharToVertical).join('\n');
  }

  // 複数行の場合: 右から左へ（1行目が一番右、最後の行が一番左）
  const maxLen = Math.max(...lines.map((l) => Array.from(l).length));
  const revLines = [...lines].reverse().map((l) => Array.from(l).map(convertCharToVertical));

  const rows: string[] = [];
  for (let i = 0; i < maxLen; i++) {
    const row = revLines.map((chars) => chars[i] || '　').join('  ');
    rows.push(row);
  }
  return rows.join('\n');
}

/**
 * 縦書きテキストから生テキスト（横書き用）を復元
 */
export function toHorizontalText(verticalText: string): string {
  if (!verticalText) return '';
  const lines = verticalText.split('\n');

  // 複数列（'  ' で区切られたマトリクス）かどうかの判定
  const isMatrix = lines.some((l) => l.includes('  '));

  if (!isMatrix) {
    // 単純に1文字ずつの改行
    return Array.from(lines.join(''))
      .map(convertCharToHorizontal)
      .join('');
  }

  // 複数列マトリクスからの復元
  const matrix = lines.map((l) => l.split('  '));
  const colCount = Math.max(...matrix.map((row) => row.length));

  // 列ごとに文字を収集（右から左に並んでいたので、最後の列が1行目）
  const reconstructedLines: string[] = [];
  for (let c = colCount - 1; c >= 0; c--) {
    const colChars = matrix.map((row) => row[c] || '').join('').trimEnd();
    reconstructedLines.push(
      Array.from(colChars)
        .map(convertCharToHorizontal)
        .join('')
        .replace(/　+$/, '')
    );
  }

  return reconstructedLines.join('\n');
}
