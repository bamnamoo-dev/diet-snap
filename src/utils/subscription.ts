import { UserPlan } from '../types/diet';

export const USER_LIMITS = {
  free: 3,
  pro: 15,
} as const;

const PLAN_KEY = 'dietsnap_user_plan';
const USAGE_PREFIX = 'dietsnap_usage_';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getUserPlan(): UserPlan {
  try {
    const saved = localStorage.getItem(PLAN_KEY);
    return saved === 'pro' ? 'pro' : 'free';
  } catch {
    return 'free';
  }
}

export function setUserPlan(plan: UserPlan): void {
  try {
    localStorage.setItem(PLAN_KEY, plan);
  } catch (e) {
    console.error('Failed to save user plan:', e);
  }
}

export function getTodayUsage(): number {
  try {
    const key = USAGE_PREFIX + getTodayDateString();
    const count = parseInt(localStorage.getItem(key) || '0', 10);
    return isNaN(count) ? 0 : count;
  } catch {
    return 0;
  }
}

export function incrementDailyUsage(): number {
  try {
    const current = getTodayUsage();
    const next = current + 1;
    const key = USAGE_PREFIX + getTodayDateString();
    localStorage.setItem(key, String(next));
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
