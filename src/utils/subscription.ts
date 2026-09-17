import { UserPlan, MealType } from '../types/diet';

export const USER_LIMITS = {
  free: 3,
  pro: 15,
} as const;

const PLAN_KEY = 'dietsnap_user_plan';
const PLAN_SIG_KEY = 'dietsnap_user_plan_sig';
const USAGE_PREFIX = 'dietsnap_usage_';
const USAGE_SIG_PREFIX = 'dietsnap_usage_sig_';

/**
 * 단순 로컬스토리지 변조(콘솔 조작) 방어용 서명 생성기
 */
function generateSignature(value: string, scope: string): string {
  let hash = 0;
  const str = `${value}:${scope}:dietsnap_integrity_salt_2026`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * 2030 한국 식생활 기준 시간대별 끼니 자동 감지 (수동 선택 0초)
 * 05:00 ~ 09:59 : 아침 (breakfast) 🌅
 * 10:00 ~ 11:29 : 오전 간식 (snack) 🍪
 * 11:30 ~ 14:29 : 점심 (lunch) ☀️
 * 14:30 ~ 17:29 : 오후 간식/티타임 (snack) ☕
 * 17:30 ~ 21:29 : 저녁 (dinner) 🌙
 * 21:30 ~ 04:59 : 야식/치팅 (cheating) 🍕
 */
export function getDefaultMealTypeByTime(date: Date = new Date()): MealType {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeVal = hours + minutes / 60;

  if (timeVal >= 5.0 && timeVal < 10.0) {
    return 'breakfast';
  } else if (timeVal >= 10.0 && timeVal < 11.5) {
    return 'snack';
  } else if (timeVal >= 11.5 && timeVal < 14.5) {
    return 'lunch';
  } else if (timeVal >= 14.5 && timeVal < 17.5) {
    return 'snack';
  } else if (timeVal >= 17.5 && timeVal < 21.5) {
    return 'dinner';
  } else {
    return 'cheating';
  }
}

/**
 * 로컬 타임존(KST) 기준 YYYY-MM-DD 날짜 문자열 반환
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatDateKey(new Date());
}

export function getUserPlan(): UserPlan {
  try {
    const saved = localStorage.getItem(PLAN_KEY);
    const sig = localStorage.getItem(PLAN_SIG_KEY);

    if (saved === 'pro') {
      // Pro 플랜 서명 무결성 검증
      if (sig !== generateSignature('pro', 'plan')) {
        // 비정상 변조 감지 시 즉시 무료 플랜으로 자동 초기화
        console.warn('[Security] Unauthorized plan tampering detected. Resetting to free.');
        setUserPlan('free');
        return 'free';
      }
      return 'pro';
    }
    return 'free';
  } catch {
    return 'free';
  }
}

export function setUserPlan(plan: UserPlan): void {
  try {
    localStorage.setItem(PLAN_KEY, plan);
    localStorage.setItem(PLAN_SIG_KEY, generateSignature(plan, 'plan'));
  } catch (e) {
    console.error('Failed to save user plan:', e);
  }
}

export function getTodayUsage(): number {
  try {
    const dateKey = getTodayDateString();
    const key = USAGE_PREFIX + dateKey;
    const sigKey = USAGE_SIG_PREFIX + dateKey;
    
    const countStr = localStorage.getItem(key);
    const sig = localStorage.getItem(sigKey);

    if (!countStr) return 0;
    const count = parseInt(countStr, 10);
    if (isNaN(count) || count < 0) return 0;

    // 사용량 서명 무결성 검증
    if (sig && sig !== generateSignature(String(count), dateKey)) {
      console.warn('[Security] Usage tampering detected. Setting to max limit.');
      return USER_LIMITS[getUserPlan()];
    }

    return count;
  } catch {
    return 0;
  }
}

export function incrementDailyUsage(): number {
  try {
    const dateKey = getTodayDateString();
    const current = getTodayUsage();
    const next = current + 1;
    const key = USAGE_PREFIX + dateKey;
    const sigKey = USAGE_SIG_PREFIX + dateKey;

    localStorage.setItem(key, String(next));
    localStorage.setItem(sigKey, generateSignature(String(next), dateKey));
    return next;
  } catch {
    return 1;
  }
}

export function getRemainingCount(): number {
  const plan = getUserPlan();
  const limit = USER_LIMITS[plan];
  const used = getTodayUsage();
  return Math.max(0, limit - used);
}

export function canTakePhoto(): boolean {
  return getRemainingCount() > 0;
}

/**
 * 어제 마지막 식사와 오늘 첫 끼의 시간 차이로 공복 시간 자동 계산 (수동 입력 0초)
 * 8시간 이상 36시간 미만인 경우만 16:8 간헐적 단식 공복으로 간주
 */
export function calculateFastingHours(
  previousTimestamp?: string,
  currentDate: Date = new Date()
): string | null {
  if (!previousTimestamp) return null;

  try {
    const prevTime = new Date(previousTimestamp).getTime();
    const currTime = currentDate.getTime();
    const diffMs = currTime - prevTime;

    if (diffMs <= 0) return null;

    const diffHours = diffMs / (1000 * 60 * 60);

    // 8시간 이상 36시간 미만일 때 공복 달성 인정
    if (diffHours >= 8 && diffHours <= 36) {
      const hours = Math.floor(diffHours);
      const minutes = Math.floor((diffHours - hours) * 60);
      return `${hours}h ${minutes}m`;
    }
    return null;
  } catch {
    return null;
  }
}
