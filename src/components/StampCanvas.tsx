import React, { useEffect, useRef } from 'react';
import { NutritionItem, PortionModifier, StampTemplate, AspectRatio } from '../types/diet';

interface StampCanvasProps {
  imageSrc: string | null;
  nutrition: NutritionItem;
  portion: PortionModifier;
  template: StampTemplate;
  aspectRatio: AspectRatio;
  isPro?: boolean;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export const StampCanvas: React.FC<StampCanvasProps> = ({
  imageSrc,
  nutrition,
  portion,
  template,
  aspectRatio,
  isPro = false,
  onCanvasReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 보정된 수치 계산
  const soupMultiplier = portion.excludeSoup ? 0.85 : 1.0;
  const currentScale = portion.scale * soupMultiplier;

  const displayCalories = Math.round(nutrition.calories * currentScale);
  const displayCarbs = Math.round(nutrition.carbs * currentScale);
  const displayProtein = Math.round(nutrition.protein * currentScale);
  const displayFat = Math.round(nutrition.fat * currentScale);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 기본 고해상도 해상도 (2x 레티나 기준)
    // 9:16 = 1080 x 1920 / 1:1 = 1080 x 1080
    const targetWidth = 1080;
    const targetHeight = aspectRatio === '9:16' ? 1920 : 1080;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const render = (imgElement?: HTMLImageElement) => {
      // 1. 배경 클리어
      ctx.fillStyle = '#141416';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // 2. 유저 음식 사진 렌더링 (Cover 모드)
      if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
        const imgW = imgElement.naturalWidth;
        const imgH = imgElement.naturalHeight;

        // 폴라로이드 모드일 경우 위쪽에 사진을 배치하고 아래에 폴라로이드 여백 생성
        let drawX = 0;
        let drawY = 0;
        let drawW = targetWidth;
        let drawH = targetHeight;

        const polaroidBottomMargin = aspectRatio === '9:16' ? 560 : 400;

        if (template === 'polaroid') {
          // 폴라로이드 전체 카드 배경을 순백색(#ffffff)으로 깔끔하게 처리
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // 안쪽 사진 프레임 테두리 여백
          const framePad = 48;
          drawX = framePad;
          drawY = framePad;
          drawW = targetWidth - framePad * 2;
          // 상단 사진 영역 높이: 하단 스탬프 종이 영역(polaroidBottomMargin) 위까지 엄격하게 차단
          drawH = targetHeight - polaroidBottomMargin - framePad;
        }

        // 1. 가로 사진(식판 등) vs 세로 사진 정밀 렌더링
        const isLandscape = imgW > imgH;
        let renderX = drawX;
        let renderY = drawY;
        let renderW = drawW;
        let renderH = drawH;

        if (isLandscape) {
          // 🍱 가로 사진: 가로폭(100%)을 꽉 채우고, 좌우는 절대 안 잘리게! (상하단은 깔끔한 화이트 처리)
          const scale = drawW / imgW;
          renderW = drawW;
          renderH = imgH * scale;
          renderX = drawX;
          renderY = drawY + (drawH - renderH) / 2; // 상하 가운데 배치
        } else {
          // 🍌 세로 사진: 음식 전체가 잘림 없이 100% 보이도록 contain 맞춤
          const scale = Math.min(drawW / imgW, drawH / imgH);
          renderW = imgW * scale;
          renderH = imgH * scale;
          renderX = drawX + (drawW - renderW) / 2;
          renderY = drawY + (drawH - renderH) / 2;
        }

        ctx.save();
        if (template === 'polaroid') {
          // 상하단 화이트 여백 배경
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(drawX, drawY, drawW, drawH, 16);
          ctx.fill();
          ctx.clip();
        }

        ctx.drawImage(imgElement, 0, 0, imgW, imgH, renderX, renderY, renderW, renderH);
        ctx.restore();

        // 영수증 모드일 경우 사진 어둡게 은은한 그라데이션 오버레이
        if (template === 'receipt') {
          const gradient = ctx.createLinearGradient(0, targetHeight * 0.4, 0, targetHeight);
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
          gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }
      } else {
        // 이미지가 없을 때 플레이스홀더
        ctx.fillStyle = '#22232a';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.fillStyle = '#71717a';
        ctx.font = '500 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('사진을 촬영하거나 업로드해주세요', targetWidth / 2, targetHeight / 2);
      }

      // 3. 템플릿별 스탬프 합성
      if (template === 'receipt') {
        renderReceiptStamp(ctx, targetWidth, targetHeight);
      } else {
        renderPolaroidStamp(ctx, targetWidth, targetHeight);
      }

      // 4. 워터마크 (무료 유저일 경우)
      if (!isPro) {
        renderWatermark(ctx, targetWidth, targetHeight, template);
      }

      if (onCanvasReady) {
        onCanvasReady(canvas);
      }
    };

    // 이미지 로드 후 렌더
    if (imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => render(img);
      img.src = imageSrc;
    } else {
      render();
    }
  }, [
    imageSrc,
    nutrition,
    portion,
    template,
    aspectRatio,
    isPro,
    displayCalories,
    displayCarbs,
    displayProtein,
    displayFat,
  ]);

  /**
   * 템플릿 1: 성수동 카페 영수증 룩 (Seongsu Receipt Look)
   */
  const renderReceiptStamp = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();

    // 영수증 카드 배경 (반투명 글래스모피즘 아크릴 영수증)
    const cardMarginX = 64;
    const cardWidth = width - cardMarginX * 2;
    const cardHeight = height > 1400 ? 760 : 540;
    const cardY = height - cardHeight - 80;

    // 카드 그림자 & 배경
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 15;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(cardMarginX, cardY, cardWidth, cardHeight, 20);
    ctx.fill();

    // 그림자 리셋
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 영수증 상단 톱니바퀴 / 점선 느낌
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(cardMarginX + 32, cardY + 90);
    ctx.lineTo(cardMarginX + cardWidth - 32, cardY + 90);
    ctx.stroke();

    // 타이틀: DIET RECEIPT
    ctx.fillStyle = '#18181b';
    ctx.font = '700 36px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DIET RECEIPT', cardMarginX + 40, cardY + 60);

    // 날짜 및 시각 (오늘 기준)
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    ctx.fillStyle = '#71717a';
    ctx.font = '400 24px "Space Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(dateStr, cardMarginX + cardWidth - 40, cardY + 60);

    // 메뉴명 & 중량 (말줄임표 없이 자동 줄바꿈 & 폰트 최적화)
    ctx.setLineDash([]);
    ctx.fillStyle = '#09090b';
    const maxReceiptTitleW = cardWidth - 80 - 240; // 우측 칼로리 제외
    const receiptTitleFontSize = nutrition.name.length > 20 ? 32 : nutrition.name.length > 12 ? 38 : 46;
    ctx.font = `700 ${receiptTitleFontSize}px "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'left';
    
    const receiptTitleLines = wrapText(ctx, nutrition.name, maxReceiptTitleW);
    receiptTitleLines.slice(0, 2).forEach((line, idx) => {
      ctx.fillText(line, cardMarginX + 40, cardY + 150 + idx * (receiptTitleFontSize + 6));
    });

    const receiptTitleOffset = receiptTitleLines.length > 1 ? receiptTitleFontSize + 4 : 0;
    ctx.fillStyle = '#71717a';
    ctx.font = '400 24px "Noto Sans KR", sans-serif';
    ctx.fillText(nutrition.serving_size || '1인분', cardMarginX + 40, cardY + 195 + receiptTitleOffset);

    // 칼로리 빅 텍스트 (우측 강조)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#dc2626';
    ctx.font = '800 68px "Space Mono", sans-serif';
    ctx.fillText(`${displayCalories}`, cardMarginX + cardWidth - 40, cardY + 175);
    ctx.fillStyle = '#71717a';
    ctx.font = '700 26px "Space Mono", monospace';
    ctx.fillText('KCAL', cardMarginX + cardWidth - 40, cardY + 205);

    // 중간 실선
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cardMarginX + 40, cardY + 240);
    ctx.lineTo(cardMarginX + cardWidth - 40, cardY + 240);
    ctx.stroke();

    // 탄단지 그리드 표 (영수증 항목 스타일)
    const macroY = cardY + 300;
    const colWidth = (cardWidth - 80) / 3;

    const macros = [
      { label: 'CARBS (탄)', val: `${displayCarbs}g`, color: '#2563eb' },
      { label: 'PROTEIN (단)', val: `${displayProtein}g`, color: '#059669' },
      { label: 'FAT (지)', val: `${displayFat}g`, color: '#d97706' },
    ];

    macros.forEach((m, idx) => {
      const colX = cardMarginX + 40 + colWidth * idx;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#71717a';
      ctx.font = '600 22px "Space Mono", monospace';
      ctx.fillText(m.label, colX, macroY);

      ctx.fillStyle = '#18181b';
      ctx.font = '800 38px "Space Mono", sans-serif';
      ctx.fillText(m.val, colX, macroY + 45);
    });

    // 위트 있는 한 줄 코멘트 (박스 형태)
    const commentY = cardY + 410;
    ctx.fillStyle = '#f4f4f5';
    ctx.beginPath();
    ctx.roundRect(cardMarginX + 40, commentY, cardWidth - 80, 70, 12);
    ctx.fill();

    ctx.fillStyle = '#27272a';
    ctx.font = '600 24px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`“ ${nutrition.diet_comment} ”`, cardMarginX + cardWidth / 2, commentY + 44);

    // 하단 성수동 바코드 그래픽 (Canvas로 직접 렌더링)
    const barcodeY = cardY + 510;
    drawBarcode(ctx, cardMarginX + 60, barcodeY, cardWidth - 120, 50);

    // 바코드 밑 일련번호 & 보정 뱃지
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '400 18px "Space Mono", monospace';
    ctx.textAlign = 'center';
    const portionBadge = portion.activeLabel
      ? `[${portion.activeLabel}]`
      : (portion.scale === 0.8 ? '[소식 0.8x]' : portion.scale === 1.3 ? '[곱빼기 1.3x]' : '[보통 1.0x]');
    const soupText = portion.excludeSoup && !portionBadge.includes('국물') ? ' / [국물제외]' : '';
    ctx.fillText(`No. 2026-DIET-${displayCalories}  ${portionBadge}${soupText}`, cardMarginX + cardWidth / 2, barcodeY + 80);

    // 최하단 면책 조항 문구 (법적 리스크 방어)
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '400 16px "Noto Sans KR", sans-serif';
    ctx.fillText('*본 수치는 AI 추정치이며 영양학적 처방을 대체하지 않습니다.', cardMarginX + cardWidth / 2, cardY + cardHeight - 24);

    ctx.restore();
  };

  /**
   * 템플릿 2: 미니멀 폴라로이드 룩 (Minimal Polaroid Look) - 텍스트 무손실 전체 표시 & 초대형 탄단지
   */
  const renderPolaroidStamp = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();

    // 하단 카드 영역을 560px(9:16) / 400px(1:1) 확보
    const bottomMargin = aspectRatio === '9:16' ? 560 : 400;
    const bottomY = height - bottomMargin;

    // ✨ 하단 폴라로이드 종이 영역 전체를 순백색(#ffffff)으로 완벽하게 밀어주어 사진 침범 100% 원천 차단!
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, bottomY - 24, width, bottomMargin + 24);

    // 1. 우측 칼로리 뱃지 (가장 먼저 고정 배치)
    const badgeX = width - 64;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#e11d48'; // 시원한 로즈 레드
    ctx.font = '900 82px "Space Mono", sans-serif';
    ctx.fillText(`${displayCalories}`, badgeX, bottomY + 70);

    ctx.fillStyle = '#64748b';
    ctx.font = '800 28px "Space Mono", monospace';
    ctx.fillText('KCAL', badgeX, bottomY + 110);

    // 2. 메뉴명 (말줄임표 없이 전체 다 나오도록 자동 2줄 줄바꿈 & 폰트 크기 동적 조절)
    const maxTitleWidth = width - 128 - 250; // 우측 칼로리 영역 제외
    const titleFontSize = nutrition.name.length > 20 ? 38 : nutrition.name.length > 12 ? 44 : 52;
    ctx.fillStyle = '#09090b'; // 가장 선명한 딥 블랙
    ctx.font = `900 ${titleFontSize}px "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'left';

    // 메뉴명 자동 줄바꿈 렌더링 (전체 다 노출)
    const titleLines = wrapText(ctx, nutrition.name, maxTitleWidth);
    titleLines.slice(0, 2).forEach((line, idx) => {
      ctx.fillText(line, 64, bottomY + 54 + idx * (titleFontSize + 8));
    });

    // 3. 한 줄 평 코멘트 (메뉴명 줄 수에 맞춰 여백 자동 조절)
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
    const commentLines = wrapText(ctx, `“ ${nutrition.diet_comment} ”`, commentBoxWidth - 36);
    commentLines.slice(0, 2).forEach((line, idx) => {
      ctx.fillText(line, 82, commentY + 34 + idx * 32);
    });

    // 4. 탄단지 매크로 바 (초대형 폰트 38px & 고시인성 와이드 카드)
    const chipY = commentY + 100;
    const chipWidth = (width - 128 - 32) / 3; // 3개 균등 분할
    const chipHeight = 76; // 시원하게 높임

    // 탄수화물
    drawHighContrastChip(
      ctx,
      64,
      chipY,
      chipWidth,
      chipHeight,
      '탄수화물',
      `${displayCarbs}g`,
      '#eff6ff',
      '#93c5fd',
      '#1d4ed8'
    );

    // 단백질
    drawHighContrastChip(
      ctx,
      64 + chipWidth + 16,
      chipY,
      chipWidth,
      chipHeight,
      '단백질',
      `${displayProtein}g`,
      '#f0fdf4',
      '#86efac',
      '#15803d'
    );

    // 지방
    drawHighContrastChip(
      ctx,
      64 + (chipWidth + 16) * 2,
      chipY,
      chipWidth,
      chipHeight,
      '지방',
      `${displayFat}g`,
      '#fffbeb',
      '#fde047',
      '#b45309'
    );

    // 5. 하단 날짜 및 면책 문구
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    const badgeStr = portion.activeLabel
      ? `[${portion.activeLabel}]`
      : (portion.scale === 0.8 ? '[소식]' : portion.scale === 1.3 ? '[곱빼기]' : '');
    const fullFooter = badgeStr ? `${dateStr}  |  ${badgeStr}  |  *AI 추정치` : `${dateStr}  |  *AI 추정치`;
    ctx.fillStyle = '#64748b';
    ctx.font = '600 24px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(fullFooter, 64, chipY + chipHeight + 40);

    ctx.restore();
  };

  /**
   * 텍스트 자동 줄바꿈 헬퍼
   */
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split('');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  /**
   * 고시인성 초대형 탄단지 칩 렌더러
   */
  const drawHighContrastChip = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    val: string,
    bg: string,
    border: string,
    color: string
  ) => {
    ctx.save();
    // 배경 & 진한 테두리
    ctx.fillStyle = bg;
    ctx.strokeStyle = border;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 16);
    ctx.fill();
    ctx.stroke();

    // 라벨 (탄수화물 / 단백질 / 지방)
    ctx.fillStyle = color;
    ctx.font = '800 24px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 16, y + 48);

    // 초대형 수치 (85g, 42g 등 - 38px 초볼드)
    ctx.font = '900 38px "Space Mono", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val, x + w - 16, y + 51);

    ctx.restore();
  };

  /**
   * 감성 바코드 직접 렌더링
   */
  const drawBarcode = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.save();
    ctx.fillStyle = '#18181b';

    // 감성 바코드 패턴
    const pattern = [2, 1, 3, 1, 1, 4, 2, 1, 3, 2, 1, 1, 3, 1, 2, 4, 1, 2, 1, 3, 1, 2, 4, 2, 1, 3, 1];
    let currentX = x;
    const totalUnits = pattern.reduce((a, b) => a + b, 0) + pattern.length;
    const unitWidth = w / totalUnits;

    pattern.forEach((p, idx) => {
      const barW = p * unitWidth;
      if (idx % 2 === 0) {
        ctx.fillRect(currentX, y, barW, h);
      }
      currentX += barW + unitWidth;
    });

    ctx.restore();
  };

  /**
   * 미니 칩 그리기
   */
  const drawMiniChip = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    text: string,
    bg: string,
    fg: string
  ) => {
    ctx.save();
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(x, y, 136, 40, 20);
    ctx.fill();

    ctx.fillStyle = fg;
    ctx.font = '700 20px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + 68, y + 27);
    ctx.restore();
  };

  /**
   * 무료 유저 워터마크 (우측 하단)
   */
  const renderWatermark = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    tpl: StampTemplate
  ) => {
    ctx.save();
    const x = width - 40;
    const y = height - 30;

    ctx.textAlign = 'right';
    ctx.font = '700 22px "Space Mono", monospace';

    if (tpl === 'receipt') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    }

    ctx.fillText('DIETSNAP AI ⚡', x, y);
    ctx.restore();
  };

  return (
    <div className="relative w-full max-w-[420px] mx-auto rounded-2xl overflow-hidden shadow-2xl bg-neutral-900 border border-neutral-800">
      <canvas
        ref={canvasRef}
        className="w-full h-auto block"
        style={{
          aspectRatio: aspectRatio === '9:16' ? '9/16' : '1/1',
        }}
      />
    </div>
  );
};
