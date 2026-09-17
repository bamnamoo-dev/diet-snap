import { NutritionItem, PortionModifier, AspectRatio, PhotoTransform, StampTemplate, PersonaTheme } from '../../types/diet';

export interface TemplateRenderContext {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  aspectRatio: AspectRatio;
  imgElement?: HTMLImageElement;
  nutrition: NutritionItem;
  portion: PortionModifier;
  transform?: PhotoTransform;
  isPro?: boolean;
  theme?: PersonaTheme;
  themedComment?: string;
  displayCaloriesText: string;
  caloriesUnitText: string;
  humorTopBadge: string;
  mealLabel: string;
  dDayLabel: string;
  displayCarbs: number;
  displayProtein: number;
  displayFat: number;
}

export interface TemplateMeta {
  id: StampTemplate;
  name: string;
  shortName: string;
  emoji: string;
  isPro?: boolean;
  safeZoneTop: number; // 스티커 및 상단 뱃지 렌더링 시작 Y좌표
}

export const TEMPLATE_DEFINITIONS: Record<StampTemplate, TemplateMeta> = {
  receipt: {
    id: 'receipt',
    name: '성수 영수증',
    shortName: '영수증',
    emoji: '🧾',
    isPro: false,
    safeZoneTop: 80,
  },
  pink_receipt: {
    id: 'pink_receipt',
    name: '핑크 라벨',
    shortName: '핑크',
    emoji: '🌸',
    isPro: true,
    safeZoneTop: 80,
  },
  polaroid: {
    id: 'polaroid',
    name: '폴라로이드',
    shortName: '폴라',
    emoji: '📷',
    isPro: false,
    safeZoneTop: 80,
  },
  vintage_ticket: {
    id: 'vintage_ticket',
    name: '빈티지 티켓',
    shortName: '티켓',
    emoji: '🎫',
    isPro: true,
    safeZoneTop: 80,
  },
  magazine: {
    id: 'magazine',
    name: '보그 매거진',
    shortName: '보그',
    emoji: '✨',
    isPro: true,
    safeZoneTop: 210, // 매거진 VOGUE DIET 헤더 아래로 여백 확보
  },
  y2k: {
    id: 'y2k',
    name: 'Y2K 필름',
    shortName: 'Y2K',
    emoji: '📼',
    isPro: true,
    safeZoneTop: 120, // 레트로 REC OSD 아래로 여백 확보
  },
  kitsch_diary: {
    id: 'kitsch_diary',
    name: '키치 다이어리',
    shortName: '다이어리',
    emoji: '🧸',
    isPro: true,
    safeZoneTop: 90, // 상단 다이어리 헤더 아래로 여백 확보
  },
};

export const TEMPLATES_LIST: TemplateMeta[] = [
  TEMPLATE_DEFINITIONS.receipt,
  TEMPLATE_DEFINITIONS.pink_receipt,
  TEMPLATE_DEFINITIONS.polaroid,
  TEMPLATE_DEFINITIONS.vintage_ticket,
  TEMPLATE_DEFINITIONS.magazine,
  TEMPLATE_DEFINITIONS.y2k,
  TEMPLATE_DEFINITIONS.kitsch_diary,
];
