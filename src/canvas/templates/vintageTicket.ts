import { TemplateRenderContext } from './types';
import { drawBarcode } from '../core/drawBarcode';

export function renderVintageTicketTemplate({
  ctx,
  canvasWidth,
  canvasHeight,
  nutrition,
  displayCaloriesText,
  caloriesUnitText,
  mealLabel,
  displayCarbs,
  displayProtein,
  displayFat,
}: TemplateRenderContext): void {
  ctx.save();

  const width = canvasWidth;
  const height = canvasHeight;
  const cardMarginX = 64;
  const cardWidth = width - cardMarginX * 2;
  const cardHeight = height > 1400 ? 760 : 560;
  const cardY = height - cardHeight - 80;

  // 티켓 배경 (크래프트 베이지)
  ctx.fillStyle = '#fffdf7';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetY = 15;
  ctx.beginPath();
  ctx.roundRect(cardMarginX, cardY, cardWidth, cardHeight, 20);
  ctx.fill();

  ctx.shadowColor = 'transparent';

  // 티켓 좌우 펀칭 홈 (원형 펀칭)
  ctx.fillStyle = '#141416';
  ctx.beginPath();
  ctx.arc(cardMarginX, cardY + 240, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cardMarginX + cardWidth, cardY + 240, 24, 0, Math.PI * 2);
  ctx.fill();

  // 티켓 절취 점선
  ctx.strokeStyle = '#d4d4d8';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(cardMarginX + 32, cardY + 240);
  ctx.lineTo(cardMarginX + cardWidth - 32, cardY + 240);
  ctx.stroke();
  ctx.setLineDash([]);

  // 상단 티켓 헤더
  ctx.fillStyle = '#78350f';
  ctx.font = '800 28px "Space Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('BOARDING PASS / MEAL TICKET', cardMarginX + 40, cardY + 60);

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  ctx.fillStyle = '#a16207';
  ctx.textAlign = 'right';
  ctx.fillText(mealLabel ? `${mealLabel} · ${dateStr}` : dateStr, cardMarginX + cardWidth - 40, cardY + 60);

  // 메뉴명 & 중량 (자동 줄바꿈)
  ctx.fillStyle = '#1c1917';
  const maxTicketTitleW = cardWidth - 80 - 260;
  const ticketTitleFontSize = nutrition.name.length > 18 ? 30 : nutrition.name.length > 10 ? 36 : 42;
  ctx.font = `800 ${ticketTitleFontSize}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'left';

  const words = nutrition.name.split(' ');
  const ticketTitleLines: string[] = [];
  let curLine = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = curLine + words[n] + ' ';
    const testW = ctx.measureText(testLine).width;
    if (testW > maxTicketTitleW && n > 0) {
      ticketTitleLines.push(curLine.trim());
      curLine = words[n] + ' ';
    } else {
      curLine = testLine;
    }
  }
  if (curLine.trim().length > 0) {
    ticketTitleLines.push(curLine.trim());
  }

  ticketTitleLines.slice(0, 2).forEach((line, idx) => {
    ctx.fillText(line, cardMarginX + 40, cardY + 125 + idx * (ticketTitleFontSize + 4));
  });

  const ticketTitleOffset = ticketTitleLines.length > 1 ? ticketTitleFontSize : 0;
  ctx.fillStyle = '#78716c';
  ctx.font = '500 22px "Noto Sans KR", sans-serif';
  ctx.fillText(nutrition.serving_size || '1인분', cardMarginX + 40, cardY + 172 + ticketTitleOffset);

  // 우측 칼로리
  ctx.textAlign = 'right';
  ctx.fillStyle = '#b45309';
  ctx.font = '900 64px "Space Mono", sans-serif';
  ctx.fillText(displayCaloriesText, cardMarginX + cardWidth - 40, cardY + 145);
  ctx.font = '700 22px "Space Mono", monospace';
  ctx.fillStyle = '#78716c';
  ctx.fillText(caloriesUnitText, cardMarginX + cardWidth - 40, cardY + 180);

  // 절취선 하단 매크로
  const macroY = cardY + 310;
  const colWidth = (cardWidth - 80) / 3;
  const macros = [
    { label: 'CARBS (탄)', val: `${displayCarbs}g` },
    { label: 'PROTEIN (단)', val: `${displayProtein}g` },
    { label: 'FAT (지)', val: `${displayFat}g` },
  ];

  macros.forEach((m, idx) => {
    const colX = cardMarginX + 40 + colWidth * idx;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#78716c';
    ctx.font = '600 20px "Space Mono", monospace';
    ctx.fillText(m.label, colX, macroY);

    ctx.fillStyle = '#292524';
    ctx.font = '900 36px "Space Mono", sans-serif';
    ctx.fillText(m.val, colX, macroY + 45);
  });

  // 한 줄 평
  const commentY = cardY + 410;
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.roundRect(cardMarginX + 40, commentY, cardWidth - 80, 68, 12);
  ctx.fill();

  ctx.fillStyle = '#92400e';
  ctx.font = '700 22px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`“ ${nutrition.diet_comment} ”`, cardMarginX + cardWidth / 2, commentY + 42);

  // 하단 바코드
  drawBarcode({
    ctx,
    x: cardMarginX + 60,
    y: cardY + 505,
    width: cardWidth - 120,
    height: 48,
    color: '#451a03',
  });

  ctx.fillStyle = '#a8a29e';
  ctx.font = '400 16px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`GATE: O-SIK-WAN · PASSENGER: PRO DIETER · SEAT: 01A`, cardMarginX + cardWidth / 2, cardY + cardHeight - 24);

  ctx.restore();
}
