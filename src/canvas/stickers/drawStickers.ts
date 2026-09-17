import { StickerId } from '../../types/diet';

export interface StickerRenderContext {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  stickers?: StickerId[];
  topY?: number;
}

export interface StickerMeta {
  id: StickerId;
  label: string;
  emoji: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const STICKER_DEFINITIONS: Record<StickerId, StickerMeta> = {
  today_done: {
    id: 'today_done',
    label: '오식완',
    emoji: '⭕',
    bgColor: '#ef4444',
    textColor: '#ffffff',
    borderColor: '#ffffff',
  },
  clean_diet: {
    id: 'clean_diet',
    label: '클린식단',
    emoji: '🥗',
    bgColor: '#10b981',
    textColor: '#ffffff',
    borderColor: '#ffffff',
  },
  cheating_day: {
    id: 'cheating_day',
    label: '치팅데이',
    emoji: '🍕',
    bgColor: '#f59e0b',
    textColor: '#ffffff',
    borderColor: '#ffffff',
  },
  high_protein: {
    id: 'high_protein',
    label: '단백질 30g+',
    emoji: '🥩',
    bgColor: '#6366f1',
    textColor: '#ffffff',
    borderColor: '#ffffff',
  },
  fasting: {
    id: 'fasting',
    label: '간헐적단식',
    emoji: '⏳',
    bgColor: '#06b6d4',
    textColor: '#ffffff',
    borderColor: '#ffffff',
  },
  no_sugar: {
    id: 'no_sugar',
    label: 'No Sugar',
    emoji: '🚫',
    bgColor: '#ec4899',
    textColor: '#ffffff',
    borderColor: '#ffffff',
  },
  snappy_cheer: {
    id: 'snappy_cheer',
    label: '0kcal다냥',
    emoji: '🐱',
    bgColor: '#f43f5e',
    textColor: '#ffffff',
    borderColor: '#ffe4e6',
  },
  buddy_walk: {
    id: 'buddy_walk',
    label: '산책가자멍',
    emoji: '🐶',
    bgColor: '#f59e0b',
    textColor: '#ffffff',
    borderColor: '#fef3c7',
  },
};

/**
 * 활성화된 인스타 감성 퀵 스티커들을 캔버스 상단(또는 지정된 Y좌표)에
 * 그림자가 가미된 입체적인 라벨 칩 형태로 렌더링합니다.
 */
export function drawStickers({
  ctx,
  canvasWidth,
  canvasHeight,
  stickers,
  topY = 80,
}: StickerRenderContext): void {
  if (!stickers || stickers.length === 0) return;

  ctx.save();

  const startY = topY;
  let currentX = 60;

  for (const stickerId of stickers) {
    const meta = STICKER_DEFINITIONS[stickerId];
    if (!meta) continue;

    const fullText = `${meta.emoji} ${meta.label}`;

    ctx.font = 'bold 24px "Noto Sans KR", sans-serif';
    const textWidth = ctx.measureText(fullText).width;
    const badgeW = textWidth + 36;
    const badgeH = 50;

    // 만약 화면 너비를 벗어나면 다음 줄로
    if (currentX + badgeW > canvasWidth - 60) {
      currentX = 60;
    }

    // 스티커 그림자 효과 (인스타 감성 3D 엠보싱)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;

    // 스티커 배경 둥근 사각형
    ctx.fillStyle = meta.bgColor;
    ctx.beginPath();
    ctx.roundRect(currentX, startY, badgeW, badgeH, 25);
    ctx.fill();

    // 흰색 하이라이트 테두리
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = meta.borderColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 텍스트 렌더링
    ctx.fillStyle = meta.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fullText, currentX + badgeW / 2, startY + badgeH / 2);

    currentX += badgeW + 16;
  }

  ctx.restore();
}
