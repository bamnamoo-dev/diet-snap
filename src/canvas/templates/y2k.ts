import { TemplateRenderContext } from './types';

/**
 * 템플릿 6: Y2K RETRO CAM (90s 캠코더 뷰파인더 & 사이버 OSD)
 * 레트로 디지털 카메라와 캠코더 특유의 힙한 타임스탬프 및 OSD 그래픽 감성
 */
export function renderY2kTemplate({
  ctx,
  canvasWidth,
  canvasHeight,
  nutrition,
  portion,
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

  // 1. 네온 뷰파인더 브라켓 (4개 모서리 L자)
  const cornerPad = 50;
  const bracketLen = 60;
  ctx.strokeStyle = '#22c55e'; // 레트로 네온 그린
  ctx.lineWidth = 4;

  // 좌상단
  ctx.beginPath();
  ctx.moveTo(cornerPad, cornerPad + bracketLen);
  ctx.lineTo(cornerPad, cornerPad);
  ctx.lineTo(cornerPad + bracketLen, cornerPad);
  ctx.stroke();

  // 우상단
  ctx.beginPath();
  ctx.moveTo(width - cornerPad - bracketLen, cornerPad);
  ctx.lineTo(width - cornerPad, cornerPad);
  ctx.lineTo(width - cornerPad, cornerPad + bracketLen);
  ctx.stroke();

  // 좌하단
  ctx.beginPath();
  ctx.moveTo(cornerPad, height - cornerPad - bracketLen);
  ctx.lineTo(cornerPad, height - cornerPad);
  ctx.lineTo(cornerPad + bracketLen, height - cornerPad);
  ctx.stroke();

  // 우하단
  ctx.beginPath();
  ctx.moveTo(width - cornerPad - bracketLen, height - cornerPad);
  ctx.lineTo(width - cornerPad, height - cornerPad);
  ctx.lineTo(width - cornerPad, height - cornerPad - bracketLen);
  ctx.stroke();

  // 2. 상단 레트로 캠코더 OSD
  // REC ●
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(cornerPad + 24, cornerPad + 32, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px "Space Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('REC', cornerPad + 44, cornerPad + 40);

  ctx.fillStyle = '#22c55e';
  ctx.fillText('SP 0:02:45', cornerPad + 120, cornerPad + 40);

  // 우상단 배터리 & 포맷
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('BATTERY [▮▮▮▯]  60FPS', width - cornerPad - 10, cornerPad + 40);

  // 3. 하단 Y2K 사이버 OSD 패널
  const panelMargin = 40;
  const panelW = width - panelMargin * 2;
  const panelH = height > 1400 ? 580 : 440;
  const panelX = panelMargin;
  const panelY = height - panelMargin - panelH - 20;

  // 다크 사이버 글래스
  ctx.fillStyle = 'rgba(10, 15, 25, 0.88)';
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 16);
  ctx.fill();

  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 타임스탬프 (디지털 네온 오렌지)
  const now = new Date();
  const timeStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  ctx.fillStyle = '#f97316';
  ctx.font = '800 22px "Space Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`● CAM 01 · ${timeStr}`, panelX + 32, panelY + 48);

  // 메뉴명
  ctx.fillStyle = '#ffffff';
  const nameSize = nutrition.name.length > 16 ? 36 : 42;
  ctx.font = `900 ${nameSize}px "Noto Sans KR", sans-serif`;

  const words = nutrition.name.split(' ');
  const titleLines: string[] = [];
  let curLine = '';
  const maxW = panelW - 64 - 230;

  for (let i = 0; i < words.length; i++) {
    const test = curLine + words[i] + ' ';
    if (ctx.measureText(test).width > maxW && i > 0) {
      titleLines.push(curLine.trim());
      curLine = words[i] + ' ';
    } else {
      curLine = test;
    }
  }
  if (curLine.trim()) titleLines.push(curLine.trim());

  titleLines.slice(0, 2).forEach((l, idx) => {
    ctx.fillText(l, panelX + 32, panelY + 104 + idx * (nameSize + 4));
  });

  // 칼로리 (사이버 네온 그린 디지털 카운터)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#22c55e';
  const calS = displayCaloriesText.length > 5 ? 54 : 68;
  ctx.font = `900 ${calS}px "Space Mono", monospace`;
  ctx.fillText(displayCaloriesText, panelX + panelW - 32, panelY + 104);

  ctx.fillStyle = '#86efac';
  ctx.font = '700 20px "Space Mono", monospace';
  ctx.fillText(caloriesUnitText, panelX + panelW - 32, panelY + 136);

  // 사이버 도트 구분선
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(panelX + 32, panelY + 180);
  ctx.lineTo(panelX + panelW - 32, panelY + 180);
  ctx.stroke();
  ctx.setLineDash([]);

  // 탄단지 사이버 매크로 박스
  const macroY = panelY + 225;
  const colWidth = (panelW - 64) / 3;
  const macros = [
    { label: 'C-HYDRATE', val: `${displayCarbs}g`, color: '#60a5fa' },
    { label: 'PROTEIN', val: `${displayProtein}g`, color: '#4ade80' },
    { label: 'LIPID-FAT', val: `${displayFat}g`, color: '#facc15' },
  ];

  macros.forEach((m, idx) => {
    const mx = panelX + 32 + colWidth * idx;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 18px "Space Mono", monospace';
    ctx.fillText(m.label, mx, macroY);

    ctx.fillStyle = m.color;
    ctx.font = '900 36px "Space Mono", monospace';
    ctx.fillText(m.val, mx, macroY + 44);
  });

  // AI 코멘트 OSD 터미널 로그
  const logY = panelY + 330;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.roundRect(panelX + 32, logY, panelW - 64, 64, 8);
  ctx.fill();

  ctx.fillStyle = '#38bdf8';
  ctx.font = '600 20px "Noto Sans KR", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`> LOG: ${nutrition.diet_comment}`, panelX + panelW / 2, logY + 39);

  // 하단 상태바
  ctx.fillStyle = '#64748b';
  ctx.font = '500 16px "Space Mono", monospace';
  ctx.textAlign = 'center';
  const tag = [mealLabel, portion.activeLabel ? `CHIP:${portion.activeLabel}` : ''].filter(Boolean).join(' // ');
  ctx.fillText(`SYS.DIET-SNAP.VER2.6 // ${tag || 'NORMAL_MODE'}`, panelX + panelW / 2, panelY + panelH - 22);

  ctx.restore();
}
