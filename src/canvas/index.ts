import { TemplateRenderContext, TEMPLATE_DEFINITIONS } from './templates/types';
import { StampTemplate, StickerId } from '../types/diet';
import { renderReceiptTemplate } from './templates/receipt';
import { renderVintageTicketTemplate } from './templates/vintageTicket';
import { renderPolaroidTemplate } from './templates/polaroid';
import { renderMagazineTemplate } from './templates/magazine';
import { renderY2kTemplate } from './templates/y2k';
import { drawStickers } from './stickers/drawStickers';

export interface MainCanvasRenderOptions extends TemplateRenderContext {
  template: StampTemplate;
  stickers?: StickerId[];
}

/**
 * 템플릿별 스탬프 합성 라우터
 */
export function renderStampTemplate(options: MainCanvasRenderOptions): void {
  const { ctx, canvasWidth, canvasHeight, template, stickers, isPro } = options;

  // 1. 선택된 템플릿 렌더링
  switch (template) {
    case 'receipt':
      renderReceiptTemplate({ ...options, isPink: false });
      break;
    case 'pink_receipt':
      renderReceiptTemplate({ ...options, isPink: true });
      break;
    case 'vintage_ticket':
      renderVintageTicketTemplate(options);
      break;
    case 'polaroid':
      renderPolaroidTemplate(options);
      break;
    case 'magazine':
      renderMagazineTemplate(options);
      break;
    case 'y2k':
      renderY2kTemplate(options);
      break;
    default:
      renderReceiptTemplate({ ...options, isPink: false });
  }

  // 2. 인스타 감성 퀵 스티커 레이어 (활성화된 스티커가 있을 때)
  if (stickers && stickers.length > 0) {
    // 템플릿별 안전 여백(Safe Zone)에 맞춰 스티커 Y위치 자동 배치
    const stickerY = TEMPLATE_DEFINITIONS[template]?.safeZoneTop ?? 80;
    drawStickers({
      ctx,
      canvasWidth,
      canvasHeight,
      stickers,
      topY: stickerY,
    });
  }

  // 3. 무료 유저 워터마크 (우측 하단)
  if (!isPro) {
    renderWatermark(ctx, canvasWidth, canvasHeight, template);
  }
}

/**
 * 무료 플랜 우측 하단 감성 워터마크
 */
export function renderWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  template: StampTemplate
): void {
  ctx.save();
  ctx.textAlign = 'right';
  ctx.font = '700 18px "Space Mono", monospace';

  if (template === 'pink_receipt') {
    ctx.fillStyle = 'rgba(157, 23, 77, 0.55)';
  } else if (template === 'vintage_ticket') {
    ctx.fillStyle = 'rgba(120, 53, 15, 0.55)';
  } else if (template === 'polaroid') {
    ctx.fillStyle = 'rgba(100, 116, 139, 0.65)';
  } else if (template === 'y2k') {
    ctx.fillStyle = 'rgba(34, 197, 94, 0.65)';
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  }

  ctx.fillText('DIETSNAP AI STAMP', width - 40, height - 32);
  ctx.restore();
}
