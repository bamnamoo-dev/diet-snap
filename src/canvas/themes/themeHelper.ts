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
  },
};

export const PERSONA_THEMES_LIST: PersonaThemeMeta[] = [
  PERSONA_THEMES.seongsu,
  PERSONA_THEMES.snappy,
  PERSONA_THEMES.buddy,
];

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
