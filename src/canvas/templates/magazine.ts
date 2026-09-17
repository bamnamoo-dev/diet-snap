import { TemplateRenderContext } from './types';

/**
 * 템플릿 5: VOGUE DIET (하이패션 매거진 에디토리얼 커버)
 * 2030 여성을 사로잡는 시크하고 세련된 패션 매거진 표지 감성
 */
export function renderMagazineTemplate({
  ctx,
  canvasWidth,
  canvasHeight,
  nutrition,
  portion,
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

  // 1. 매거진 외곽 슬림 화이트 보더 프레임
  const margin = 48;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 2;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

  // 2. 상단 헤더: "VOGUE DIET" 웅장한 매거진 로고
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  ctx.font = '900 84px "Space Mono", serif';
  ctx.textAlign = 'center';
  ctx.fillText('VOGUE DIET', width / 2, margin + 90);

  // 헤더 서브텍스트
  ctx.font = '700 20px "Space Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  const subHeader = [dDayLabel || 'AUTUMN ISSUE', mealLabel, dateStr].filter(Boolean).join('  ·  ');
  ctx.fillText(subHeader, width / 2, margin + 130);

  // 3. 하단 에디토리얼 글래스모피즘 정보 카드
  const cardW = width - margin * 2 - 32;
  const cardH = height > 1400 ? 640 : 480;
  const cardX = (width - cardW) / 2;
  const cardY = height - margin - cardH - 16;

  // 글래스 배경
  ctx.fillStyle = 'rgba(15, 15, 20, 0.78)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 24);
  ctx.fill();

  // 골드/화이트 슬림 테두리
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.shadowColor = 'transparent';

  // 카테고리 태그
  ctx.fillStyle = '#f59e0b';
  ctx.font = '800 18px "Space Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SPECIAL EDITION · TODAY’S MEAL', cardX + 36, cardY + 50);

  // 메뉴명 (매거진 스타일 세리프/볼드 타이포)
  ctx.fillStyle = '#ffffff';
  const menuFontSize = nutrition.name.length > 16 ? 38 : 46;
  ctx.font = `900 ${menuFontSize}px "Noto Sans KR", sans-serif`;

  const words = nutrition.name.split(' ');
  const titleLines: string[] = [];
  let curL = '';
  const maxTitleW = cardW - 72 - 200;

  for (let i = 0; i < words.length; i++) {
    const testL = curL + words[i] + ' ';
    if (ctx.measureText(testL).width > maxTitleW && i > 0) {
      titleLines.push(curL.trim());
      curL = words[i] + ' ';
    } else {
      curL = testL;
    }
  }
  if (curL.trim()) titleLines.push(curL.trim());

  titleLines.slice(0, 2).forEach((line, idx) => {
    ctx.fillText(line, cardX + 36, cardY + 105 + idx * (menuFontSize + 6));
  });

  // 칼로리 (우측 시크 골드 럭셔리 폰트)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fbbf24';
  const calSize = displayCaloriesText.length > 5 ? 58 : 72;
  ctx.font = `900 ${calSize}px "Space Mono", sans-serif`;
  ctx.fillText(displayCaloriesText, cardX + cardW - 36, cardY + 105);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '700 22px "Space Mono", monospace';
  ctx.fillText(caloriesUnitText, cardX + cardW - 36, cardY + 138);

  // 구분 실선
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 36, cardY + 185);
  ctx.lineTo(cardX + cardW - 36, cardY + 185);
  ctx.stroke();

  // 탄단지 에디토리얼 그리드
  const macroY = cardY + 235;
  const colW = (cardW - 72) / 3;
  const macros = [
    { label: 'CARBOHYDRATES', val: `${displayCarbs}g` },
    { label: 'PURE PROTEIN', val: `${displayProtein}g` },
    { label: 'HEALTHY FAT', val: `${displayFat}g` },
  ];

  macros.forEach((m, idx) => {
    const cx = cardX + 36 + colW * idx;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 16px "Space Mono", monospace';
    ctx.fillText(m.label, cx, macroY);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px "Space Mono", sans-serif';
    ctx.fillText(m.val, cx, macroY + 44);
  });

  // 에디터스 노트 (인용문)
  const commentY = cardY + 345;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.roundRect(cardX + 36, commentY, cardW - 72, 70, 12);
  ctx.fill();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'italic 600 22px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`“ ${nutrition.diet_comment} ”`, cardX + cardW / 2, commentY + 44);

  // 최하단 에디토리얼 서명
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '500 16px "Space Mono", monospace';
  ctx.textAlign = 'center';
  const portionBadge = portion.activeLabel ? `[${portion.activeLabel}]` : '';
  ctx.fillText(`PARIS · MILAN · SEOUL  |  DIETSNAP EDITORIAL ${portionBadge}`, cardX + cardW / 2, cardY + cardH - 24);

  ctx.restore();
}
