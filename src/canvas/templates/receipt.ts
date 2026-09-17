import { TemplateRenderContext } from './types';
import { drawBarcode } from '../core/drawBarcode';
import { renderPersonaStamp } from '../stickers/drawThemeStamps';

export interface ReceiptTemplateOptions extends TemplateRenderContext {
  isPink?: boolean;
}

export function renderReceiptTemplate({
  ctx,
  canvasWidth,
  canvasHeight,
  nutrition,
  portion,
  themedComment,
  displayCaloriesText,
  caloriesUnitText,
  humorTopBadge,
  displayCarbs,
  displayProtein,
  displayFat,
  isPink = false,
}: ReceiptTemplateOptions): void {
  ctx.save();

  const cardMarginX = 54;
  const cardWidth = canvasWidth - cardMarginX * 2;
  const cardHeight = 650;
  const cardY = canvasHeight - cardHeight - 40;

  // 1. 아크릴 감성 영수증 종이 (성수동 감성 고대비 라벨)
  ctx.fillStyle = isPink ? '#fdf2f4' : '#ffffff';
  ctx.strokeStyle = isPink ? '#fbcfe8' : '#e4e4e7';
  ctx.lineWidth = 3;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 12;

  ctx.beginPath();
  ctx.roundRect(cardMarginX, cardY, cardWidth, cardHeight, 28);
  ctx.fill();
  ctx.stroke();

  ctx.shadowColor = 'transparent';

  // 2. 상단 헤더
  ctx.fillStyle = isPink ? '#db2777' : '#18181b';
  ctx.font = '900 24px "Space Mono", monospace';
  ctx.textAlign = 'left';
  const brandTitle = isPink ? 'DIETSNAP PINK LABEL' : 'DIETSNAP SEONGSU STORE';
  ctx.fillText(brandTitle, cardMarginX + 40, cardY + 60);

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  ctx.fillStyle = isPink ? '#9d174d' : '#71717a';
  ctx.font = '700 20px "Space Mono", monospace';
  ctx.fillText(dateStr, cardMarginX + 40, cardY + 95);

  // 3. 우측 칼로리 뱃지
  ctx.textAlign = 'right';
  ctx.fillStyle = isPink ? '#e11d48' : '#18181b';
  const calFontSize = displayCaloriesText.length > 5 ? 64 : 80;
  ctx.font = `900 ${calFontSize}px "Space Mono", sans-serif`;
  ctx.fillText(displayCaloriesText, cardMarginX + cardWidth - 40, cardY + 75);

  ctx.fillStyle = isPink ? '#9d174d' : '#71717a';
  ctx.font = '800 26px "Space Mono", monospace';
  ctx.fillText(caloriesUnitText, cardMarginX + cardWidth - 40, cardY + 115);

  // 4. 메뉴명
  const titleFontSize = nutrition.name.length > 20 ? 38 : nutrition.name.length > 12 ? 44 : 50;
  ctx.fillStyle = isPink ? '#500724' : '#09090b';
  ctx.font = `900 ${titleFontSize}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'left';

  const maxTitleW = cardWidth - 80 - 160;
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

  const titleStartY = cardY + 165;
  titleLines.slice(0, 2).forEach((line, idx) => {
    ctx.fillText(line, cardMarginX + 40, titleStartY + idx * (titleFontSize + 8));
  });

  const receiptTitleOffset = titleLines.length > 1 ? titleFontSize + 8 : 0;
  ctx.fillStyle = isPink ? '#9d174d' : '#71717a';
  ctx.font = '500 24px "Noto Sans KR", sans-serif';
  ctx.fillText(nutrition.serving_size || '1인분', cardMarginX + 40, titleStartY + titleFontSize + receiptTitleOffset + 4);

  // 유머 모드 스탬프 (있을 경우)
  if (humorTopBadge) {
    ctx.save();
    ctx.translate(cardMarginX + cardWidth - 140, cardY + 115);
    ctx.rotate(-0.06);
    ctx.fillStyle = '#f43f5e';
    ctx.font = '800 20px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`✨ ${humorTopBadge}`, 0, 0);
    ctx.restore();
  }

  // 테마 전용 시그니처 도장 (스내피 or 버디)
  if (portion.theme === 'snappy' || portion.theme === 'buddy') {
    renderPersonaStamp(ctx, cardMarginX + cardWidth - 85, cardY + 165, portion.theme, 0.85);
  }

  // 중간 실선
  ctx.strokeStyle = isPink ? '#f472b6' : '#18181b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cardMarginX + 40, cardY + 242);
  ctx.lineTo(cardMarginX + cardWidth - 40, cardY + 242);
  ctx.stroke();

  // 탄단지 그리드 표
  const macroY = cardY + 302;
  const colWidth = (cardWidth - 80) / 3;

  const macros = [
    { label: 'CARBS (탄)', val: `${displayCarbs}g`, color: isPink ? '#be185d' : '#2563eb' },
    { label: 'PROTEIN (단)', val: `${displayProtein}g`, color: isPink ? '#059669' : '#059669' },
    { label: 'FAT (지)', val: `${displayFat}g`, color: isPink ? '#b45309' : '#d97706' },
  ];

  macros.forEach((m, idx) => {
    const colX = cardMarginX + 40 + colWidth * idx;
    ctx.textAlign = 'left';
    ctx.fillStyle = isPink ? '#9d174d' : '#71717a';
    ctx.font = '600 22px "Space Mono", monospace';
    ctx.fillText(m.label, colX, macroY);

    ctx.fillStyle = isPink ? '#500724' : '#18181b';
    ctx.font = '900 38px "Space Mono", sans-serif';
    ctx.fillText(m.val, colX, macroY + 45);
  });

  // 위트 있는 한 줄 코멘트 박스
  const commentY = cardY + 412;
  ctx.fillStyle = isPink ? '#fce7f3' : '#f4f4f5';
  ctx.beginPath();
  ctx.roundRect(cardMarginX + 40, commentY, cardWidth - 80, 72, 14);
  ctx.fill();

  const commentText = themedComment || nutrition.diet_comment;
  ctx.fillStyle = isPink ? '#831843' : '#27272a';
  ctx.font = '700 24px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`“ ${commentText} ”`, cardMarginX + cardWidth / 2, commentY + 45);

  // 하단 바코드 그래픽
  const barcodeY = cardY + 515;
  drawBarcode({
    ctx,
    x: cardMarginX + 60,
    y: barcodeY,
    width: cardWidth - 120,
    height: 50,
    color: isPink ? '#831843' : '#18181b',
  });

  // 바코드 밑 일련번호 & 보정 뱃지
  ctx.fillStyle = isPink ? '#9d174d' : '#a1a1aa';
  ctx.font = '500 18px "Space Mono", monospace';
  ctx.textAlign = 'center';
  const rawCalories = Math.round(nutrition.calories * portion.scale);
  const portionBadge = portion.activeLabel
    ? `[${portion.activeLabel}]`
    : (portion.scale === 0.8 ? '[소식 0.8x]' : portion.scale === 1.3 ? '[곱빼기 1.3x]' : '[보통 1.0x]');
  const soupText = portion.excludeSoup && !portionBadge.includes('국물') ? ' / [국물제외]' : '';
  ctx.fillText(`NO. 2026-DIET-${rawCalories}  ${portionBadge}${soupText}`, cardMarginX + cardWidth / 2, barcodeY + 80);

  // 최하단 라벨
  ctx.fillStyle = isPink ? '#be185d' : '#a1a1aa';
  ctx.font = '400 16px "Noto Sans KR", sans-serif';
  ctx.fillText('*본 수치는 AI 추정치이며 영양학적 처방을 대체하지 않습니다.', cardMarginX + cardWidth / 2, cardY + cardHeight - 22);

  ctx.restore();
}
