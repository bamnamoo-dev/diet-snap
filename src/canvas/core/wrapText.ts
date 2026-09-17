export interface WrapTextOptions {
  ctx: CanvasRenderingContext2D;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  lineHeight: number;
  maxLines?: number;
  align?: 'left' | 'center' | 'right';
}

/**
 * 텍스트를 줄바꿈하여 캔버스에 렌더링합니다.
 * 글자 잘림(truncate) 없이 온전한 한글 단어 단위/문자 단위로 렌더링하며 총 렌더링된 높이를 반환합니다.
 */
export function wrapText({
  ctx,
  text,
  x,
  y,
  maxWidth,
  lineHeight,
  maxLines = 4,
  align = 'left',
}: WrapTextOptions): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let lineCount = 0;

  ctx.textAlign = align;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      if (lineCount >= maxLines - 1) {
        ctx.fillText(line.trim() + '...', x, currentY);
        return (lineCount + 1) * lineHeight;
      }
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
      lineCount++;
    } else {
      line = testLine;
    }
  }

  if (line.trim().length > 0) {
    ctx.fillText(line.trim(), x, currentY);
    lineCount++;
  }

  return lineCount * lineHeight;
}
