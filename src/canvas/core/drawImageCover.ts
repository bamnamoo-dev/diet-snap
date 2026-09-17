export interface CoverImageOptions {
  ctx: CanvasRenderingContext2D;
  img: HTMLImageElement;
  stageX: number;
  stageY: number;
  stageW: number;
  stageH: number;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
  clipRadius?: number;
}

/**
 * 캔버스 특정 영역(Stage)에 사진을 cover 모드로 비율 유지하여 중앙 배치하고,
 * 줌(1.0~3.0x) 및 상하좌우 팬(offsetX, offsetY)을 정밀하게 적용합니다.
 */
export function drawImageCover({
  ctx,
  img,
  stageX,
  stageY,
  stageW,
  stageH,
  zoom = 1.0,
  offsetX = 0,
  offsetY = 0,
  clipRadius = 0,
}: CoverImageOptions): void {
  if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return;

  ctx.save();

  // 클리핑 영역 설정 (스테이지 밖으로 이미지가 삐져나가지 않도록 완벽 차단)
  ctx.beginPath();
  if (clipRadius > 0) {
    const r = clipRadius;
    ctx.moveTo(stageX + r, stageY);
    ctx.lineTo(stageX + stageW - r, stageY);
    ctx.quadraticCurveTo(stageX + stageW, stageY, stageX + stageW, stageY + r);
    ctx.lineTo(stageX + stageW, stageY + stageH - r);
    ctx.quadraticCurveTo(stageX + stageW, stageY + stageH, stageX + stageW - r, stageY + stageH);
    ctx.lineTo(stageX + r, stageY + stageH);
    ctx.quadraticCurveTo(stageX, stageY + stageH, stageX, stageY + stageH - r);
    ctx.lineTo(stageX, stageY + r);
    ctx.quadraticCurveTo(stageX, stageY, stageX + r, stageY);
  } else {
    ctx.rect(stageX, stageY, stageW, stageH);
  }
  ctx.closePath();
  ctx.clip();

  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const imgRatio = imgW / imgH;
  const stageRatio = stageW / stageH;

  let baseW: number;
  let baseH: number;

  if (imgRatio > stageRatio) {
    // 이미지가 더 옆으로 넓음 -> 높이에 맞춤
    baseH = stageH;
    baseW = stageH * imgRatio;
  } else {
    // 이미지가 더 세로로 김 -> 너비에 맞춤
    baseW = stageW;
    baseH = stageW / imgRatio;
  }

  // 줌 적용
  const finalW = baseW * zoom;
  const finalH = baseH * zoom;

  // 중앙 정렬 + 이동(offset) 적용
  const finalX = stageX + (stageW - finalW) / 2 + offsetX;
  const finalY = stageY + (stageH - finalH) / 2 + offsetY;

  ctx.drawImage(img, finalX, finalY, finalW, finalH);
  ctx.restore();
}
