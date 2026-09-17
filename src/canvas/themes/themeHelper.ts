import { PersonaTheme, MealType, StampTemplate } from '../../types/diet';

export interface PersonaThemeMeta {
  id: PersonaTheme;
  name: string;
  shortName: string;
  emoji: string;
  accentColor: string;
  bgLight: string;
  defaultTemplate: StampTemplate;
  description: string;

  // Theme UI & Camera Tokens
  indicatorColor: string;
  reticleBorderClass: string;
  glowLeftClass: string;
  glowRightClass: string;
  lensRingGradient: string;
  lensPulseGradient: string;
  lensBadgeEmoji: string;
  lensBadgeBgClass: string;
  headingText: string;
  headingEmoji: string;
  subtext: string;
  shutterBtnClass: string;
  shareBtnClass: string;
  themeActiveTabClass: string;
}

export const PERSONA_THEMES: Record<PersonaTheme, PersonaThemeMeta> = {
  seongsu: {
    id: 'seongsu',
    name: '성수동 힙스터',
    shortName: '성수동',
    emoji: '🖤',
    accentColor: '#18181b',
    bgLight: '#f4f4f5',
    defaultTemplate: 'receipt',
    description: '시크하고 미니멀한 킨포크 에디토리얼 감성',
    indicatorColor: 'text-zinc-300',
    reticleBorderClass: 'border-zinc-400',
    glowLeftClass: 'bg-white/10',
    glowRightClass: 'bg-zinc-500/20',
    lensRingGradient: 'from-zinc-100 via-zinc-400 to-zinc-600',
    lensPulseGradient: 'from-zinc-400/20 to-zinc-600/20',
    lensBadgeEmoji: '✨',
    lensBadgeBgClass: 'bg-white text-neutral-950',
    headingText: '오늘 뭐 드셨나요?',
    headingEmoji: '✨',
    subtext: '사진 1장 찍으면 1.2초 만에 성수동 감성 영수증 & 탄단지 명세서 자동 완성',
    shutterBtnClass: 'bg-gradient-to-r from-neutral-100 to-neutral-300 text-neutral-950 hover:from-white hover:to-neutral-200 shadow-neutral-900/40',
    shareBtnClass: 'bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-300 text-neutral-950 shadow-md shadow-white/10',
    themeActiveTabClass: 'bg-neutral-100 text-neutral-950 shadow-md ring-1 ring-white/50',
  },
  snappy: {
    id: 'snappy',
    name: '뚱냥이 스내피',
    shortName: '뚱냥이',
    emoji: '🐱',
    accentColor: '#f43f5e',
    bgLight: '#fff1f2',
    defaultTemplate: 'kitsch_diary',
    description: '다이어트 죄책감 날려주는 귀여운 힐링 뚱냥이',
    indicatorColor: 'text-rose-400',
    reticleBorderClass: 'border-rose-400',
    glowLeftClass: 'bg-rose-500/25',
    glowRightClass: 'bg-pink-400/20',
    lensRingGradient: 'from-rose-500 via-pink-400 to-rose-300',
    lensPulseGradient: 'from-rose-500/30 to-pink-400/30',
    lensBadgeEmoji: '🐾',
    lensBadgeBgClass: 'bg-rose-500 text-white shadow-rose-500/40',
    headingText: '오늘 뭐 드셨냥?',
    headingEmoji: '🐾',
    subtext: '스내피의 0kcal 칭찬도장과 함께하는 러블리 힐링 다이어리',
    shutterBtnClass: 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 text-white hover:from-rose-400 hover:to-pink-400 shadow-rose-500/30',
    shareBtnClass: 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 text-white shadow-md shadow-rose-500/30',
    themeActiveTabClass: 'bg-rose-500 text-white shadow-md shadow-rose-500/25 ring-1 ring-rose-400/50',
  },
  buddy: {
    id: 'buddy',
    name: '댕댕이 버디',
    shortName: '댕댕이',
    emoji: '🐶',
    accentColor: '#f59e0b',
    bgLight: '#fffbeb',
    defaultTemplate: 'vintage_ticket',
    description: '꼬리콥터 붕붕! 활기찬 갓생 운동 코치 댕댕이',
    indicatorColor: 'text-amber-400',
    reticleBorderClass: 'border-amber-400',
    glowLeftClass: 'bg-amber-500/25',
    glowRightClass: 'bg-orange-400/20',
    lensRingGradient: 'from-amber-400 via-yellow-300 to-orange-400',
    lensPulseGradient: 'from-amber-400/30 to-orange-400/30',
    lensBadgeEmoji: '🦴',
    lensBadgeBgClass: 'bg-amber-400 text-neutral-950 shadow-amber-400/40',
    headingText: '오늘 뭐 먹었어? 멍!',
    headingEmoji: '🦴',
    subtext: '버디의 갓생 출석도장 & 단백질 득근 파이팅 식단표',
    shutterBtnClass: 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-neutral-950 hover:from-amber-300 hover:to-orange-400 shadow-amber-500/30',
    shareBtnClass: 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-neutral-950 shadow-md shadow-amber-500/30',
    themeActiveTabClass: 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/25 ring-1 ring-amber-400/50',
  },
};

export const PERSONA_THEMES_LIST: PersonaThemeMeta[] = [
  PERSONA_THEMES.seongsu,
  PERSONA_THEMES.snappy,
  PERSONA_THEMES.buddy,
];

export function getPersonaTheme(theme?: PersonaTheme): PersonaThemeMeta {
  if (theme && PERSONA_THEMES[theme]) {
    return PERSONA_THEMES[theme];
  }
  return PERSONA_THEMES.seongsu;
}

/**
 * 선택된 테마에 맞춰 AI 한 줄 평의 말투(Tone of Voice)를 실시간 변환합니다.
 */
export function getThemedComment(
  originalComment: string,
  theme: PersonaTheme = 'seongsu',
  mealType: MealType = 'lunch',
  calories: number = 500
): string {
  const isCheat = mealType === 'cheating' || calories >= 700;
  const isClean = mealType === 'breakfast' || calories <= 450;

  if (theme === 'snappy') {
    if (isCheat) {
      return '맛있게 먹었으면 0kcal다냥! 오늘 행복지수 100점 🍕';
    }
    if (isClean) {
      return '풀떼기 먹느라 고생했다냥... 복근이 1mm 자라났다냥 🥗';
    }
    return originalComment 
      ? `${originalComment.replace(/[!.]/g, '').trim()}다냥~ 🐾` 
      : '오늘도 잘 챙겨먹었다냥! 기특하다냥 🐾';
  }

  if (theme === 'buddy') {
    if (isCheat) {
      return '주인님 행복했으면 됐다 멍! 내일 나랑 산책 1만보 고! 🏃';
    }
    if (isClean) {
      return '우와아아! 갓생 살았다 멍! 꼬리 프로펠러 붕붕 🐕';
    }
    return originalComment 
      ? `${originalComment.replace(/[!.]/g, '').trim()} 멍! 꼬리콥터 붕붕! 🦴` 
      : '오늘 단백질 최고다 멍! 산책 가자 멍! 🦴';
  }

  // seongsu (미니멀, 시크)
  if (isCheat) {
    return '치팅 또한 일상의 유연한 리듬.';
  }
  if (isClean) {
    return '정갈한 오늘의 클린 식단 루틴.';
  }
  return originalComment || '균형 잡힌 영양의 미학.';
}
