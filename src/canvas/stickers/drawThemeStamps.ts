import { PersonaTheme } from '../../types/diet';

/**
 * 🐱 1. 뚱냥이(스내피) 0kcal 칭찬 도장
 */
export function drawSnappyStamp(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1.0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(-0.08); // 감성 틸트

  // 외곽 원형 테두리
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 50, 0, Math.PI * 2);
  ctx.stroke();

  // 도장 반투명 잉크 배경
  ctx.fillStyle = 'rgba(254, 226, 226, 0.45)';
  ctx.fill();

  // 내부 도장 텍스트
  ctx.fillStyle = '#e11d48';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '900 23px "Noto Sans KR", sans-serif';
  ctx.fillText('🐾 0kcal다냥', 0, -12);

  ctx.font = '800 15px "Noto Sans KR", sans-serif';
  ctx.fillText('스내피 칭찬도장', 0, 16);

  ctx.restore();
}

/**
 * 🐶 2. 댕댕이(버디) 갓생출석 도장
 */
export function drawBuddyStamp(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1.0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(0.06);

  // 외곽 원형 테두리
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 50, 0, Math.PI * 2);
  ctx.stroke();

  // 도장 잉크 배경
  ctx.fillStyle = 'rgba(254, 243, 199, 0.45)';
  ctx.fill();

  // 내부 도장 텍스트
  ctx.fillStyle = '#d97706';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '900 23px "Noto Sans KR", sans-serif';
  ctx.fillText('🦴 갓생완료멍', 0, -12);

  ctx.font = '800 15px "Noto Sans KR", sans-serif';
  ctx.fillText('버디 산책출석', 0, 16);

  ctx.restore();
}

/**
 * 🖤 3. 성수동 힙스터 시크 인장
 */
export function drawSeongsuStamp(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1.0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // 시크 미니멀 딥블랙 인장 (원형)
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#18181b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '900 18px "Space Mono", monospace';
  ctx.fillText('VERIFIED', 0, -10);

  ctx.font = '700 14px "Space Mono", monospace';
  ctx.fillText('DIETSNAP', 0, 12);

  ctx.restore();
}

/**
 * 테마에 맞춰 최적의 시그니처 도장 자동 렌더링
 */
export function renderPersonaStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  theme: PersonaTheme = 'seongsu',
  scale = 1.0
): void {
  if (theme === 'snappy') {
    drawSnappyStamp(ctx, x, y, scale);
  } else if (theme === 'buddy') {
    drawBuddyStamp(ctx, x, y, scale);
  } else {
    drawSeongsuStamp(ctx, x, y, scale);
  }
}
