export interface BarcodeOptions {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  seed?: string;
}

/**
 * 인스타 감성 영수증 하단 바코드를 캔버스에 렌더링합니다.
 */
export function drawBarcode({
  ctx,
  x,
  y,
  width,
  height,
  color = '#111827',
  seed = 'DIET-SNAP-PRO',
}: BarcodeOptions): void {
  ctx.save();
  ctx.fillStyle = color;

  let currentX = x;
  const endX = x + width;
  let idx = 0;

  // seed 문자열 기반 pseudo-random 바코드 두께 생성
  while (currentX < endX) {
    const charCode = seed.charCodeAt(idx % seed.length);
    const barW = (charCode % 4) + 1.5;
    const gapW = ((charCode >> 1) % 3) + 1.5;

    if (currentX + barW > endX) {
      ctx.fillRect(currentX, y, endX - currentX, height);
      break;
    }

    ctx.fillRect(currentX, y, barW, height);
    currentX += barW + gapW;
    idx++;
  }

  ctx.restore();
}
