import { StickerId, PersonaTheme } from '../../types/diet';

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
  // 🖤 1. 성수동 시크 힙스터 스티커 팩 (6종)
  today_done: {
    id: 'today_done',
    label: '오식완',
    emoji: '⭕',
    bgColor: '#18181b',
    textColor: '#ffffff',
    borderColor: '#3f3f46',
  },
  clean_diet: {
    id: 'clean_diet',
    label: '클린식단',
    emoji: '🥗',
    bgColor: '#059669',
    textColor: '#ffffff',
    borderColor: '#34d399',
  },
  cheating_day: {
    id: 'cheating_day',
    label: '치팅데이',
    emoji: '🍕',
    bgColor: '#d97706',
    textColor: '#ffffff',
    borderColor: '#fcd34d',
  },
  high_protein: {
    id: 'high_protein',
    label: '단백질 30g+',
    emoji: '🥩',
    bgColor: '#4f46e5',
    textColor: '#ffffff',
    borderColor: '#a5b4fc',
  },
  fasting: {
    id: 'fasting',
    label: '간헐적단식',
    emoji: '⏳',
    bgColor: '#0891b2',
    textColor: '#ffffff',
    borderColor: '#67e8f9',
  },
  no_sugar: {
    id: 'no_sugar',
    label: 'No Sugar',
    emoji: '🚫',
    bgColor: '#db2777',
    textColor: '#ffffff',
    borderColor: '#f472b6',
  },

  // 🐱 2. 뚱냥이(스내피) 힐링 스티커 팩 (6종)
  snappy_cheer: {
    id: 'snappy_cheer',
    label: '0kcal다냥',
    emoji: '🐱',
    bgColor: '#f43f5e',
    textColor: '#ffffff',
    borderColor: '#ffe4e6',
  },
  snappy_cheat: {
    id: 'snappy_cheat',
    label: '치팅합법',
    emoji: '🍕',
    bgColor: '#fb7185',
    textColor: '#ffffff',
    borderColor: '#ffffff',
  },
  snappy_clean: {
    id: 'snappy_clean',
    label: '집사기특해',
    emoji: '🥗',
    bgColor: '#ec4899',
    textColor: '#ffffff',
    borderColor: '#fbcfe8',
  },
  snappy_tomorrow: {
    id: 'snappy_tomorrow',
    label: '내일부터다',
    emoji: '🤫',
    bgColor: '#a855f7',
    textColor: '#ffffff',
    borderColor: '#f3e8ff',
  },
  snappy_protein: {
    id: 'snappy_protein',
    label: '단백질냥냥',
    emoji: '🥩',
    bgColor: '#e11d48',
    textColor: '#ffffff',
    borderColor: '#ffe4e6',
  },
  snappy_full: {
    id: 'snappy_full',
    label: '배부르다냥',
    emoji: '💤',
    bgColor: '#f472b6',
    textColor: '#ffffff',
    borderColor: '#ffffff',
  },

  // 🐶 3. 댕댕이(버디) 갓생 스티커 팩 (6종)
  buddy_walk: {
    id: 'buddy_walk',
    label: '산책가자멍',
    emoji: '🐶',
    bgColor: '#f59e0b',
    textColor: '#ffffff',
    borderColor: '#fef3c7',
  },
  buddy_attendance: {
    id: 'buddy_attendance',
    label: '갓생출석멍',
    emoji: '🐾',
    bgColor: '#ea580c',
    textColor: '#ffffff',
    borderColor: '#ffedd5',
  },
  buddy_protein: {
    id: 'buddy_protein',
    label: '단백질파워',
    emoji: '🥩',
    bgColor: '#d97706',
    textColor: '#ffffff',
    borderColor: '#fef3c7',
  },
  buddy_water: {
    id: 'buddy_water',
    label: '물2L클리어',
    emoji: '💧',
    bgColor: '#0284c7',
    textColor: '#ffffff',
    borderColor: '#bae6fd',
  },
  buddy_tail: {
    id: 'buddy_tail',
    label: '꼬리콥터붕',
    emoji: '🐕',
    bgColor: '#ca8a04',
    textColor: '#ffffff',
    borderColor: '#fef9c3',
  },
  buddy_cardio: {
    id: 'buddy_cardio',
    label: '유산소출발',
    emoji: '🏃',
    bgColor: '#16a34a',
    textColor: '#ffffff',
    borderColor: '#bbf7d0',
  },
};

/**
 * 테마별 전용 스티커 팩 매핑 (SSOT)
 */
export const THEME_STICKERS_MAP: Record<PersonaTheme, StickerId[]> = {
  seongsu: ['today_done', 'clean_diet', 'cheating_day', 'high_protein', 'fasting', 'no_sugar'],
  snappy: ['snappy_cheer', 'snappy_cheat', 'snappy_clean', 'snappy_tomorrow', 'snappy_protein', 'snappy_full'],
  buddy: ['buddy_walk', 'buddy_attendance', 'buddy_protein', 'buddy_water', 'buddy_tail', 'buddy_cardio'],
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
