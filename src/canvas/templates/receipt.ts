import { TemplateRenderContext } from './types';
import { drawBarcode } from '../core/drawBarcode';

export interface ReceiptTemplateOptions extends TemplateRenderContext {
  isPink?: boolean;
}

export function renderReceiptTemplate({
  ctx,
  canvasWidth,
  canvasHeight,
  nutrition,
  portion,
  displayCaloriesText,
  caloriesUnitText,
  humorTopBadge,
  mealLabel,
  dDayLabel,
  displayCarbs,
  displayProtein,
  displayFat,
  isPink = false,
}: ReceiptTemplateOptions): void {
  ctx.save();

  const width = canvasWidth;
  const height = canvasHeight;
  const cardMarginX = 64;
  const cardWidth = width - cardMarginX * 2;
  const cardHeight = height > 1400 ? 780 : 560;
  const cardY = height - cardHeight - 80;

  // 카드 그림자 & 배경
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 15;

  ctx.fillStyle = isPink ? 'rgba(255, 240, 245, 0.96)' : 'rgba(255, 255, 255, 0.96)';
  ctx.beginPath();
  ctx.roundRect(cardMarginX, cardY, cardWidth, cardHeight, 24);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 영수증 상단 점선
  ctx.strokeStyle = isPink ? '#fbcfe8' : '#e4e4e7';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(cardMarginX + 32, cardY + 92);
  ctx.lineTo(cardMarginX + cardWidth - 32, cardY + 92);
  ctx.stroke();

  // 상단 타이틀 & D-Day / 끼니 뱃지
  const headerTitle = isPink ? 'SEONGSU PINK DIET' : 'DIET RECEIPT';
  ctx.fillStyle = isPink ? '#9d174d' : '#18181b';
  ctx.font = '800 32px "Space Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(headerTitle, cardMarginX + 40, cardY + 62);

  // 날짜 & D-Day / 끼니
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  const badgeText = [dDayLabel, mealLabel].filter(Boolean).join(' · ');

  ctx.fillStyle = isPink ? '#be185d' : '#71717a';
  ctx.font = '700 22px "Space Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(badgeText ? `${badgeText} | ${dateStr}` : dateStr, cardMarginX + cardWidth - 40, cardY + 62);

  // 메뉴명 & 중량 (자동 줄바꿈)
  ctx.setLineDash([]);
  ctx.fillStyle = isPink ? '#831843' : '#09090b';
  const maxReceiptTitleW = cardWidth - 80 - 270;
  const receiptTitleFontSize = nutrition.name.length > 20 ? 32 : nutrition.name.length > 12 ? 38 : 46;
  ctx.font = `800 ${receiptTitleFontSize}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'left';

  // 메뉴명 단어 분할 렌더링
  const words = nutrition.name.split(' ');
  const titleLines: string[] = [];
  let curLine = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = curLine + words[n] + ' ';
    const testW = ctx.measureText(testLine).width;
    if (testW > maxReceiptTitleW && n > 0) {
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
    ctx.fillText(line, cardMarginX + 40, cardY + 152 + idx * (receiptTitleFontSize + 6));
  });

  const receiptTitleOffset = titleLines.length > 1 ? receiptTitleFontSize + 4 : 0;
  ctx.fillStyle = isPink ? '#9d174d' : '#71717a';
  ctx.font = '500 24px "Noto Sans KR", sans-serif';
  ctx.fillText(nutrition.serving_size || '1인분', cardMarginX + 40, cardY + 195 + receiptTitleOffset);

  // 칼로리 빅 텍스트 (우측 강조)
  ctx.textAlign = 'right';
  ctx.fillStyle = isPink ? '#e11d48' : '#dc2626';
  const calFontSize = displayCaloriesText.length > 5 ? 54 : 68;
  ctx.font = `900 ${calFontSize}px "Space Mono", sans-serif`;
  ctx.fillText(displayCaloriesText, cardMarginX + cardWidth - 40, cardY + 175);

  ctx.fillStyle = isPink ? '#9d174d' : '#71717a';
  ctx.font = '700 24px "Space Mono", monospace';
  ctx.fillText(caloriesUnitText, cardMarginX + cardWidth - 40, cardY + 208);

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

  ctx.fillStyle = isPink ? '#831843' : '#27272a';
  ctx.font = '700 24px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`“ ${nutrition.diet_comment} ”`, cardMarginX + cardWidth / 2, commentY + 45);

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
