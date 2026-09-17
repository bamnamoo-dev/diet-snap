export interface CustomChip {
  label: string;       // 칩 텍스트 (예: "초등 급식", "성인 식판", "국물 제외", "드레싱 뺌")
  scale?: number;      // 배율 (예: 0.8, 1.0, 1.25)
  calorie_delta?: number; // 직접 칼로리 가감 (예: -100, -60)
  is_selected?: boolean;
}

export interface NutritionItem {
  name: string;          // 한식 메뉴명 (예: "제육볶음과 현미밥")
  serving_size: string;  // 추정 중량 (예: "1인분 (약 350g)")
  calories: number;      // 총 칼로리 (kcal)
  carbs: number;         // 탄수화물 (g)
  protein: number;       // 단백질 (g)
  fat: number;           // 지방 (g)
  diet_comment: string;  // 인스타 스탬프용 위트 있는 한 줄
  custom_chips?: CustomChip[]; // 음식 종류별 AI 맞춤 연동형 1초 보정 칩 (최대 3~4개)
  fastingHours?: string; // 16:8 간헐적 단식 자동 계산 공복 시간 (예: "16h 30m")
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'cheating';
export type HumorMode = 'none' | 'zero_cal' | 'cheating' | 'cardio';
export type UserPlan = 'free' | 'pro';

export type PersonaTheme = 'seongsu' | 'snappy' | 'buddy';

export interface PortionModifier {
  scale: number;        // 소(0.8), 보통(1.0), 곱빼기(1.3)
  excludeSoup: boolean; // 국물 제외 여부 (-15% 칼로리/나트륨)
  activeLabel?: string; // 현재 선택된 칩 라벨 (예: "초등 급식", "성인 식판", "시럽 뺌")
  mealType?: MealType;  // 아침, 점심, 저녁, 간식, 치팅
  humorMode?: HumorMode; // 유머 스탬프 모드 ('none', 'zero_cal', 'cheating', 'cardio')
  dDay?: number;        // Day N (디데이)
  stickers?: StickerId[]; // 인스타 감성 퀵 스티커 (다중 선택 가능)
  theme?: PersonaTheme; // 3대 페르소나 테마 ('seongsu' | 'snappy' | 'buddy')
}

export type StampTemplate = 'receipt' | 'polaroid' | 'pink_receipt' | 'vintage_ticket' | 'magazine' | 'y2k' | 'kitsch_diary';
export type AspectRatio = '9:16' | '1:1';

export type StickerId = 
  // 🖤 성수동 테마 스티커
  | 'today_done' 
  | 'clean_diet' 
  | 'cheating_day' 
  | 'high_protein' 
  | 'fasting' 
  | 'no_sugar'
  // 🐱 뚱냥이(스내피) 테마 스티커
  | 'snappy_cheer'
  | 'snappy_cheat'
  | 'snappy_clean'
  | 'snappy_tomorrow'
  | 'snappy_protein'
  | 'snappy_full'
  // 🐶 댕댕이(버디) 테마 스티커
  | 'buddy_walk'
  | 'buddy_attendance'
  | 'buddy_protein'
  | 'buddy_water'
  | 'buddy_tail'
  | 'buddy_cardio';

export interface StickerItem {
  id: StickerId;
  label: string;
  emoji: string;
  color: string;
}

export interface PhotoTransform {
  zoom: number;    // 확대 배율 (1.0 ~ 3.0)
  offsetX: number; // 좌우 이동 픽셀
  offsetY: number; // 상하 이동 픽셀
}

