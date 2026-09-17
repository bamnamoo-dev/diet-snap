import { TemplateRenderContext } from './types';
import { renderPersonaStamp } from '../stickers/drawThemeStamps';

/**
 * 와시 테이프 (마스킹 테이프) 렌더링 헬퍼
 */
function drawWashiTape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  angleRad: number = 0
): void {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(angleRad);

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;

  // 지그재그 테이프 양끝 마감
  ctx.beginPath();
  ctx.moveTo(-width / 2, -height / 2);
  ctx.lineTo(width / 2, -height / 2);
  ctx.lineTo(width / 2 - 4, 0);
  ctx.lineTo(width / 2, height / 2);
  ctx.lineTo(-width / 2, height / 2);
  ctx.lineTo(-width / 2 + 4, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 🐱 스내피 참잘했어요 칭찬 도장
 */
function drawSnappyStamp(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.08); // 살짝 삐뚤어진 감성

  // 붉은 도장 원형 테두리
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.stroke();

  // 도장 배경 살짝 비침
  ctx.fillStyle = 'rgba(254, 226, 226, 0.45)';
  ctx.fill();

  // 고양이 귀 & 도장 텍스트
  ctx.fillStyle = '#e11d48';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '900 24px "Noto Sans KR", sans-serif';
  ctx.fillText('🐾 0kcal다냥', 0, -12);

  ctx.font = '800 16px "Noto Sans KR", sans-serif';
  ctx.fillText('스내피 칭찬도장', 0, 16);

  ctx.restore();
}

/**
 * 🐶 버디 갓생 댕댕이 칭찬 도장
 */
function drawBuddyStamp(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.06);

  // 노랑/오렌지 도장 원형 테두리
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(254, 243, 199, 0.45)';
  ctx.fill();

  ctx.fillStyle = '#d97706';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '900 24px "Noto Sans KR", sans-serif';
  ctx.fillText('🦴 갓생완료멍', 0, -12);

  ctx.font = '800 16px "Noto Sans KR", sans-serif';
  ctx.fillText('버디 산책출석', 0, 16);

  ctx.restore();
}

/**
 * 파스텔 매크로 영양 칩
 */
function drawPastelMacroChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  bg: string,
  border: string,
  textColor: string,
  emoji: string
): void {
  ctx.save();
  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 20);
  ctx.fill();
  ctx.stroke();

  // 상단 라벨
  ctx.fillStyle = '#64748b';
  ctx.font = '700 20px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${emoji} ${label}`, x + w / 2, y + 26);

  // 하단 수치
  ctx.fillStyle = textColor;
  ctx.font = '900 36px "Space Mono", sans-serif';
  ctx.fillText(value, x + w / 2, y + 64);
  ctx.restore();
}

/**
 * 🧸 러블리 키치 다이어리 (Lovely Kitsch Diary) 템플릿
 * 2030 여성의 다꾸 감성을 완벽히 재현한 모눈종이 + 마스킹테이프 + 스내피&버디 칭찬도장 스탬프
 */
export function renderKitschDiaryTemplate({
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

  // 1. 상단 와시 테이프 & 헤더 뱃지
  drawWashiTape(ctx, 40, 30, 140, 36, '#fbcfe8', -0.05); // 핑크 테이프
  drawWashiTape(ctx, width - 180, 30, 140, 36, '#fed7aa', 0.04); // 피치 테이프

  // 중앙 다이어리 헤더 태그
  const headerTag = `♥ TODAY'S DIET DIARY ♥`;
  ctx.font = '900 24px "Noto Sans KR", sans-serif';
  const tagW = ctx.measureText(headerTag).width + 48;
  const tagH = 44;
  const tagX = (width - tagW) / 2;
  const tagY = 28;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#f472b6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(tagX, tagY, tagW, tagH, 22);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#db2777';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(headerTag, width / 2, tagY + tagH / 2);

  // 3. 하단 다이어리 메모지 본문 카드 (#ffffff 화이트 페이퍼)
  const cardPad = 36;
  const cardW = width - cardPad * 2;
  const cardH = bottomMargin + 20;
  const cardX = cardPad;
  const cardY = bottomY - 30;

  // 카드 그림자
  ctx.shadowColor = 'rgba(180, 140, 100, 0.18)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#fcd34d';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 32);
  ctx.fill();
  ctx.stroke();

  // 그림자 리셋
  ctx.shadowColor = 'transparent';

  // 4. 하단 카드 상단: 끼니 뱃지 + 날짜 + 칼로리
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  const mealBadgeStr = [dDayLabel, mealLabel, portion.activeLabel ? `[${portion.activeLabel}]` : ''].filter(Boolean).join(' · ');

  // 날짜/끼니 캡슐
  ctx.fillStyle = '#fdf2f8';
  ctx.strokeStyle = '#f472b6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cardX + 28, cardY + 28, 260, 42, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#be185d';
  ctx.font = '800 20px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${dateStr}  ${mealBadgeStr}`, cardX + 28 + 130, cardY + 28 + 21);

  // 우측 칼로리 리본 (대형 핑크/오렌지)
  const calText = displayCaloriesText;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f43f5e';
  const calFontSize = calText.length > 5 ? 60 : 76;
  ctx.font = `900 ${calFontSize}px "Space Mono", sans-serif`;
  ctx.fillText(calText, cardX + cardW - 32, cardY + 76);

  ctx.fillStyle = '#fb7185';
  ctx.font = '800 26px "Space Mono", monospace';
  ctx.fillText(caloriesUnitText, cardX + cardW - 32, cardY + 112);

  // 5. 메뉴명 (따뜻한 다크 브라운, 단어 단위 줄바꿈)
  const maxTitleW = cardW - 64 - 200;
  const titleFontSize = nutrition.name.length > 20 ? 36 : nutrition.name.length > 12 ? 42 : 48;
  ctx.fillStyle = '#451a03'; // 다크 초코 브라운
  ctx.font = `900 ${titleFontSize}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'left';

  const words = nutrition.name.split(' ');
  const titleLines: string[] = [];
  let curLine = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = curLine + words[n] + ' ';
    if (ctx.measureText(testLine).width > maxTitleW && n > 0) {
      titleLines.push(curLine.trim());
      curLine = words[n] + ' ';
    } else {
      curLine = testLine;
    }
  }
  if (curLine.trim().length > 0) {
    titleLines.push(curLine.trim());
  }

  const titleStartY = cardY + 115;
  titleLines.slice(0, 2).forEach((line, idx) => {
    ctx.fillText(line, cardX + 28, titleStartY + idx * (titleFontSize + 8));
  });

  // 6. 다이어리 감성 한 줄 일기 노트 박스 (스티치 점선 보더)
  const titleOffset = titleLines.length > 1 ? titleFontSize + 8 : 0;
  const noteBoxY = titleStartY + 35 + titleOffset;
  const noteBoxW = cardW - 56;
  const noteBoxH = 76;

  ctx.fillStyle = '#fffbeb'; // 연노랑 포스트잇
  ctx.strokeStyle = '#fcd34d';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 6]); // 스티치 점선
  ctx.beginPath();
  ctx.roundRect(cardX + 28, noteBoxY, noteBoxW, noteBoxH, 18);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]); // 점선 해제

  // 코멘트 내용
  ctx.fillStyle = '#78350f';
  ctx.font = '700 24px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const commentText = themedComment || nutrition.diet_comment;
  const commentWords = `“ ${commentText} ”`.split(' ');
  const commentLines: string[] = [];
  let curComment = '';
  for (let n = 0; n < commentWords.length; n++) {
    const testL = curComment + commentWords[n] + ' ';
    if (ctx.measureText(testL).width > noteBoxW - 40 && n > 0) {
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
    ctx.fillText(line, cardX + 48, noteBoxY + 24 + idx * 28);
  });

  // 7. 탄단지 파스텔 3색 캡슐 카드
  const chipY = noteBoxY + noteBoxH + 18;
  const chipW = (cardW - 56 - 28) / 3;
  const chipH = 78;

  drawPastelMacroChip(ctx, cardX + 28, chipY, chipW, chipH, '탄수화물', `${displayCarbs}g`, '#eff6ff', '#bfdbfe', '#2563eb', '🍚');
  drawPastelMacroChip(ctx, cardX + 28 + chipW + 14, chipY, chipW, chipH, '단백질', `${displayProtein}g`, '#f0fdf4', '#bbf7d0', '#16a34a', '🍗');
  drawPastelMacroChip(ctx, cardX + 28 + (chipW + 14) * 2, chipY, chipW, chipH, '지방', `${displayFat}g`, '#fff7ed', '#fed7aa', '#ea580c', '🥑');

  // 8. 3대 페르소나 테마 시그니처 도장 렌더링
  const activeTheme = portion.theme || (portion.mealType === 'cheating' ? 'snappy' : 'buddy');
  renderPersonaStamp(ctx, cardX + cardW - 75, cardY - 45, activeTheme);

  ctx.restore();
}
