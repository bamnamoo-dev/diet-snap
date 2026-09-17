import { TemplateRenderContext } from './types';
import { renderPersonaStamp } from '../stickers/drawThemeStamps';

function drawHighContrastChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  bg: string,
  borderColor: string,
  textColor: string
): void {
  ctx.save();
  ctx.fillStyle = bg;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '700 22px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + 28);

  ctx.fillStyle = textColor;
  ctx.font = '900 36px "Space Mono", sans-serif';
  ctx.fillText(value, x + w / 2, y + 64);
  ctx.restore();
}

export function renderPolaroidTemplate({
  ctx,
  canvasWidth,
  canvasHeight,
  aspectRatio,
  nutrition,
  portion,
  themedComment,
  displayCaloriesText,
  caloriesUnitText,
  mealLabel,
  dDayLabel,
  displayCarbs,
  displayProtein,
  displayFat,
}: TemplateRenderContext): void {
  ctx.save();

  const width = canvasWidth;
  const height = canvasHeight;
  const bottomMargin = aspectRatio === '9:16' ? 560 : 400;
  const bottomY = height - bottomMargin;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, bottomY - 24, width, bottomMargin + 24);

  // 우측 칼로리 뱃지
  const badgeX = width - 64;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e11d48';
  const calFontSize = displayCaloriesText.length > 5 ? 64 : 82;
  ctx.font = `900 ${calFontSize}px "Space Mono", sans-serif`;
  ctx.fillText(displayCaloriesText, badgeX, bottomY + 70);

  ctx.fillStyle = '#64748b';
  ctx.font = '800 28px "Space Mono", monospace';
  ctx.fillText(caloriesUnitText, badgeX, bottomY + 110);

  // 메뉴명
  const maxTitleWidth = width - 128 - 250;
  const titleFontSize = nutrition.name.length > 20 ? 38 : nutrition.name.length > 12 ? 44 : 52;
  ctx.fillStyle = '#09090b';
  ctx.font = `900 ${titleFontSize}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'left';

  const words = nutrition.name.split(' ');
  const titleLines: string[] = [];
  let curLine = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = curLine + words[n] + ' ';
    const testW = ctx.measureText(testLine).width;
    if (testW > maxTitleWidth && n > 0) {
      titleLines.push(curLine.trim());
      curLine = words[n] + ' ';
    } else {
      curLine = testLine;
    }
  }
  if (curLine.trim().length > 0) {
    titleLines.push(curLine.trim());
  }

  titleLines.slice(0, 2).forEach((line, idx) => {
    ctx.fillText(line, 64, bottomY + 54 + idx * (titleFontSize + 8));
  });

  // 한 줄 평
  const titleOffset = titleLines.length > 1 ? titleFontSize + 8 : 0;
  const commentY = bottomY + 130 + titleOffset;
  const commentBoxWidth = width - 128;
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.roundRect(64, commentY, commentBoxWidth, 80, 16);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  ctx.font = '700 26px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'left';

  const commentText = themedComment || nutrition.diet_comment;
  const commentWords = `“ ${commentText} ”`.split(' ');
  const commentLines: string[] = [];
  let curComment = '';
  for (let n = 0; n < commentWords.length; n++) {
    const testL = curComment + commentWords[n] + ' ';
    if (ctx.measureText(testL).width > commentBoxWidth - 36 && n > 0) {
      commentLines.push(curComment.trim());
      curComment = commentWords[n] + ' ';
    } else {
      curComment = testL;
    }
  }
  if (curComment.trim().length > 0) {
    commentLines.push(curComment.trim());
  }

  commentLines.slice(0, 2).forEach((line, idx) => {
    ctx.fillText(line, 82, commentY + 34 + idx * 32);
  });

  // 테마 전용 시그니처 도장 (스내피 or 버디)
  if (portion.theme === 'snappy' || portion.theme === 'buddy') {
    renderPersonaStamp(ctx, width - 110, bottomY + 50, portion.theme, 0.85);
  }

  // 탄단지 매크로
  const chipY = commentY + 100;
  const chipWidth = (width - 128 - 32) / 3;
  const chipHeight = 76;

  drawHighContrastChip(ctx, 64, chipY, chipWidth, chipHeight, '탄수화물', `${displayCarbs}g`, '#eff6ff', '#93c5fd', '#1d4ed8');
  drawHighContrastChip(ctx, 64 + chipWidth + 16, chipY, chipWidth, chipHeight, '단백질', `${displayProtein}g`, '#f0fdf4', '#86efac', '#15803d');
  drawHighContrastChip(ctx, 64 + (chipWidth + 16) * 2, chipY, chipWidth, chipHeight, '지방', `${displayFat}g`, '#fffbeb', '#fde047', '#b45309');

  // 하단 날짜 및 라벨
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  const badgeStr = [dDayLabel, mealLabel, portion.activeLabel ? `[${portion.activeLabel}]` : ''].filter(Boolean).join('  |  ');
  const fullFooter = badgeStr ? `${dateStr}  |  ${badgeStr}` : dateStr;

  ctx.fillStyle = '#64748b';
  ctx.font = '600 24px "Space Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(fullFooter, 64, chipY + chipHeight + 40);

  ctx.restore();
}
