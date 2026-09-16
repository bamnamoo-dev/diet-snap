import React, { useEffect, useRef } from 'react';
import { NutritionItem, PortionModifier, StampTemplate, AspectRatio, PhotoTransform } from '../types/diet';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

interface StampCanvasProps {
  imageSrc: string | null;
  nutrition: NutritionItem;
  portion: PortionModifier;
  template: StampTemplate;
  aspectRatio: AspectRatio;
  isPro?: boolean;
  offsetY?: number;
  onOffsetChange?: (offsetY: number) => void;
  transform?: PhotoTransform;
  onTransformChange?: (transform: PhotoTransform) => void;
  onAspectRatioChange?: (ratio: AspectRatio) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export const StampCanvas: React.FC<StampCanvasProps> = ({
  imageSrc,
  nutrition,
  portion,
  template,
  aspectRatio,
  isPro = false,
  offsetY = 0,
  onOffsetChange,
  transform,
  onTransformChange,
  onAspectRatioChange,
  onCanvasReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // 줌 & 이동 상태 (transform prop 우선, 없으면 로컬/offsetY 연동)
  const currentZoom = transform?.zoom ?? 1.0;
  const currentOffsetX = transform?.offsetX ?? 0;
  const currentOffsetY = transform?.offsetY ?? offsetY ?? 0;

  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const initialOffsetXRef = useRef(currentOffsetX);
  const initialOffsetYRef = useRef(currentOffsetY);
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef(currentZoom);

  // 보정된 수치 계산
  const soupMultiplier = portion.excludeSoup ? 0.85 : 1.0;
  const currentScale = portion.scale * soupMultiplier;

  const rawCalories = Math.round(nutrition.calories * currentScale);
  const displayCarbs = Math.round(nutrition.carbs * currentScale);
  const displayProtein = Math.round(nutrition.protein * currentScale);
  const displayFat = Math.round(nutrition.fat * currentScale);

  // 유머 모드에 따른 칼로리 표시 텍스트
  let displayCaloriesText = `${rawCalories}`;
  let caloriesUnitText = 'KCAL';
  let humorTopBadge = '';

  if (portion.humorMode === 'zero_cal') {
    displayCaloriesText = '0';
    caloriesUnitText = 'KCAL';
    humorTopBadge = '맛있으면 0 kcal 🤫';
  } else if (portion.humorMode === 'cheating') {
    displayCaloriesText = 'CHEATING';
    caloriesUnitText = '치팅데이';
    humorTopBadge = '치팅데이 공식 승인 🍕';
  } else if (portion.humorMode === 'cardio') {
    displayCaloriesText = '유산소각';
    caloriesUnitText = '공복유산소';
    humorTopBadge = '내일 공복 유산소 확정 💦';
  }

  // 끼니 라벨 텍스트
  const mealLabelMap: Record<string, string> = {
    breakfast: '아침 BREAKFAST',
    lunch: '점심 LUNCH',
    dinner: '저녁 DINNER',
    snack: '간식 SNACK',
    cheating: '치팅 CHEATING',
  };
  const mealLabel = portion.mealType ? mealLabelMap[portion.mealType] : '';
  const dDayLabel = portion.dDay ? `Day ${portion.dDay}` : '';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetWidth = 1080;
    const targetHeight = aspectRatio === '9:16' ? 1920 : 1080;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const render = (imgElement?: HTMLImageElement) => {
      // 1. 기본 캔버스 배경
      ctx.fillStyle = template === 'pink_receipt' ? '#fdf2f4' : template === 'vintage_ticket' ? '#faf4e8' : '#141416';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // 2. 유저 음식 사진 렌더링
      if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
        const imgW = imgElement.naturalWidth;
        const imgH = imgElement.naturalHeight;

        let drawX = 0;
        let drawY = 0;
        let drawW = targetWidth;
        let drawH = targetHeight;

        const bottomMargin = aspectRatio === '9:16' ? 560 : 400;

        if (template === 'polaroid') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          const framePad = 48;
          drawX = framePad;
          drawY = framePad;
          drawW = targetWidth - framePad * 2;
          drawH = targetHeight - bottomMargin - framePad;
        }

        const isLandscape = imgW > imgH;
        let renderX = drawX;
        let renderY = drawY;
        let renderW = drawW;
        let renderH = drawH;

        if (template === 'polaroid') {
          // 폴라로이드 프레임 내 안착 및 자르기(Clip)
          ctx.save();
          ctx.beginPath();
          ctx.rect(drawX, drawY, drawW, drawH);
          ctx.clip(); // 폴라로이드 화이트 액자 밖으로 나가지 않도록 완벽 크롭

          const centerX = drawX + drawW / 2;
          const centerY = drawY + drawH / 2;

          let baseScale = 1.0;
          if (isLandscape) {
            baseScale = drawW / imgW;
          } else {
            baseScale = Math.min(drawW / imgW, drawH / imgH);
          }

          renderW = imgW * baseScale * currentZoom;
          renderH = imgH * baseScale * currentZoom;
          renderX = centerX - renderW / 2 + currentOffsetX;
          renderY = centerY - renderH / 2 + currentOffsetY;

          ctx.drawImage(imgElement, renderX, renderY, renderW, renderH);
          ctx.restore();
        } else {
          // 영수증/티켓 템플릿: 하단 영수증을 피하여 상단 맑은 공간(Safe Stage)에 음식이 쏙 안착하도록 자동 상향 렌더링!
          const receiptOccupiedH = aspectRatio === '9:16' ? 700 : 450;
          const stageH = targetHeight - receiptOccupiedH;
          const centerX = targetWidth / 2;
          const centerY = stageH / 2;

          let baseScale = 1.0;
          if (isLandscape) {
            baseScale = drawW / imgW;
          } else {
            // 세로 사진도 영수증 윗 공간을 꽉 채우며 돋보이도록 스케일링
            baseScale = Math.max(drawW / imgW, stageH / imgH);
          }

          renderW = imgW * baseScale * currentZoom;
          renderH = imgH * baseScale * currentZoom;
          renderX = centerX - renderW / 2 + currentOffsetX;
          renderY = centerY - renderH / 2 + currentOffsetY;

          ctx.drawImage(imgElement, renderX, renderY, renderW, renderH);
        }

        // 사진 위 그라디언트 비네팅 (폴라로이드 제외)
        if (template !== 'polaroid') {
          const gradient = ctx.createLinearGradient(0, targetHeight * 0.3, 0, targetHeight);
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
          gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }
      } else {
        ctx.fillStyle = '#1e1f24';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.fillStyle = '#a1a1aa';
        ctx.font = '600 36px "Noto Sans KR", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('사진을 촬영하거나 업로드해주세요 📸', targetWidth / 2, targetHeight / 2);
      }

      // 3. 템플릿별 스탬프 합성
      if (template === 'receipt') {
        renderReceiptStamp(ctx, targetWidth, targetHeight, false);
      } else if (template === 'pink_receipt') {
        renderReceiptStamp(ctx, targetWidth, targetHeight, true);
      } else if (template === 'vintage_ticket') {
        renderVintageTicketStamp(ctx, targetWidth, targetHeight);
      } else {
        renderPolaroidStamp(ctx, targetWidth, targetHeight);
      }

      // 4. 상단 감성 뱃지 (공복 시간 & 유머 모드 스티커)
      renderTopFloatingBadges(ctx, targetWidth);

      // 5. 워터마크 (무료 유저일 경우만 우측 하단 자동 인쇄)
      if (!isPro) {
        renderWatermark(ctx, targetWidth, targetHeight, template);
      }

      if (onCanvasReady) {
        onCanvasReady(canvas);
      }
    };

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
    rawCalories,
    displayCarbs,
    displayProtein,
    displayFat,
    displayCaloriesText,
    caloriesUnitText,
    humorTopBadge,
    mealLabel,
    dDayLabel,
    offsetY,
    currentZoom,
    currentOffsetX,
    currentOffsetY,
  ]);

  /**
   * 템플릿 1 & 2: 성수동 카페 영수증 룩 (클래식 화이트 & 성수 핑크 라벨)
   */
  const renderReceiptStamp = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isPink: boolean
  ) => {
    ctx.save();

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

    // 메뉴명 & 중량
    ctx.setLineDash([]);
    ctx.fillStyle = isPink ? '#831843' : '#09090b';
    const maxReceiptTitleW = cardWidth - 80 - 270;
    const receiptTitleFontSize = nutrition.name.length > 20 ? 32 : nutrition.name.length > 12 ? 38 : 46;
    ctx.font = `800 ${receiptTitleFontSize}px "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'left';

    const receiptTitleLines = wrapText(ctx, nutrition.name, maxReceiptTitleW);
    receiptTitleLines.slice(0, 2).forEach((line, idx) => {
      ctx.fillText(line, cardMarginX + 40, cardY + 152 + idx * (receiptTitleFontSize + 6));
    });

    const receiptTitleOffset = receiptTitleLines.length > 1 ? receiptTitleFontSize + 4 : 0;
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
    drawBarcode(ctx, cardMarginX + 60, barcodeY, cardWidth - 120, 50, isPink ? '#831843' : '#18181b');

    // 바코드 밑 일련번호 & 보정 뱃지
    ctx.fillStyle = isPink ? '#9d174d' : '#a1a1aa';
    ctx.font = '500 18px "Space Mono", monospace';
    ctx.textAlign = 'center';
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
  };

  /**
   * 템플릿 3: 빈티지 보딩패스/티켓 룩 (Vintage Boarding Pass Look)
   */
  const renderVintageTicketStamp = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();

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

    // 메뉴명 & 중량 (어휘 단위 자연스러운 줄바꿈)
    ctx.fillStyle = '#1c1917';
    const maxTicketTitleW = cardWidth - 80 - 260;
    const ticketTitleFontSize = nutrition.name.length > 18 ? 30 : nutrition.name.length > 10 ? 36 : 42;
    ctx.font = `800 ${ticketTitleFontSize}px "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'left';

    const ticketTitleLines = wrapText(ctx, nutrition.name, maxTicketTitleW);
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
    drawBarcode(ctx, cardMarginX + 60, cardY + 505, cardWidth - 120, 48, '#451a03');

    ctx.fillStyle = '#a8a29e';
    ctx.font = '400 16px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`GATE: O-SIK-WAN · PASSENGER: PRO DIETER · SEAT: 01A`, cardMarginX + cardWidth / 2, cardY + cardHeight - 24);

    ctx.restore();
  };

  /**
   * 템플릿 4: 미니멀 폴라로이드 룩
   */
  const renderPolaroidStamp = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();

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

    const titleLines = wrapText(ctx, nutrition.name, maxTitleWidth);
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
    const commentLines = wrapText(ctx, `“ ${nutrition.diet_comment} ”`, commentBoxWidth - 36);
    commentLines.slice(0, 2).forEach((line, idx) => {
      ctx.fillText(line, 82, commentY + 34 + idx * 32);
    });

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
  };

  /**
   * 텍스트 어휘 단위(Keep-all) 자동 줄바꿈 헬퍼
   * 띄어쓰기 단어 단위로 묶어 한글 단어가 쪼개지지 않도록 방지하고,
   * 단일 단어가 maxWidth를 초과할 때만 글자 단위로 분할합니다.
   */
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    if (!text) return [];
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth) {
        if (currentLine) {
          lines.push(currentLine);
          // 단어 단독으로도 maxWidth를 넘을 경우 글자 단위로 안전하게 분할
          const wordMetrics = ctx.measureText(word);
          if (wordMetrics.width > maxWidth) {
            let charLine = '';
            for (const char of word) {
              const charTest = charLine + char;
              if (ctx.measureText(charTest).width > maxWidth && charLine) {
                lines.push(charLine);
                charLine = char;
              } else {
                charLine = charTest;
              }
            }
            currentLine = charLine;
          } else {
            currentLine = word;
          }
        } else {
          // 첫 단어부터 maxWidth를 초과하는 경우
          let charLine = '';
          for (const char of word) {
            const charTest = charLine + char;
            if (ctx.measureText(charTest).width > maxWidth && charLine) {
              lines.push(charLine);
              charLine = char;
            } else {
              charLine = charTest;
            }
          }
          currentLine = charLine;
        }
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
   * 고시인성 칩 그리기
   */
  const drawHighContrastChip = (
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
  ) => {
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
  };

  /**
   * 바코드 그리기
   */
  const drawBarcode = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color = '#18181b'
  ) => {
    ctx.save();
    ctx.fillStyle = color;

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
   * 상단 감성 플로팅 뱃지 (16:8 간헐적 단식 공복 시간 & 유머 모드 스티커)
   */
  const renderTopFloatingBadges = (ctx: CanvasRenderingContext2D, width: number) => {
    const badges: { text: string; bg: string; color: string; border: string }[] = [];

    if (nutrition.fastingHours) {
      badges.push({
        text: `⏳ 공복 ${nutrition.fastingHours} 달성 🔥`,
        bg: 'rgba(234, 88, 12, 0.92)',
        color: '#ffffff',
        border: 'rgba(255, 255, 255, 0.4)',
      });
    }

    if (humorTopBadge) {
      badges.push({
        text: humorTopBadge,
        bg: 'rgba(18, 18, 20, 0.9)',
        color: '#facc15',
        border: 'rgba(250, 204, 21, 0.5)',
      });
    }

    if (badges.length === 0) return;

    ctx.save();
    let currentY = 56;
    badges.forEach((b) => {
      ctx.font = '700 24px "Noto Sans KR", sans-serif';
      const textMetrics = ctx.measureText(b.text);
      const badgeW = textMetrics.width + 56;
      const badgeH = 56;
      const badgeX = (width - badgeW) / 2;

      // 그림자
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;

      ctx.fillStyle = b.bg;
      ctx.beginPath();
      ctx.roundRect(badgeX, currentY, badgeW, badgeH, 28);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.strokeStyle = b.border;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = b.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, width / 2, currentY + badgeH / 2 + 1);

      currentY += badgeH + 16;
    });
    ctx.restore();
  };

  /**
   * 무료 유저 워터마크 (인스타 스티커 브랜드 아카이브 라벨화)
   */
  const renderWatermark = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    tpl: StampTemplate
  ) => {
    ctx.save();
    const x = width - 40;
    const y = height - 28;

    ctx.textAlign = 'right';
    ctx.font = '700 20px "Space Mono", monospace';

    if (tpl === 'receipt' || tpl === 'pink_receipt' || tpl === 'vintage_ticket') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    }

    ctx.fillText('DIETSNAP® ARCHIVE', x, y);
    ctx.restore();
  };

  const updateTransform = (partial: Partial<PhotoTransform>) => {
    const next: PhotoTransform = {
      zoom: partial.zoom !== undefined ? partial.zoom : currentZoom,
      offsetX: partial.offsetX !== undefined ? partial.offsetX : currentOffsetX,
      offsetY: partial.offsetY !== undefined ? partial.offsetY : currentOffsetY,
    };
    if (onTransformChange) {
      onTransformChange(next);
    } else if (onOffsetChange && partial.offsetY !== undefined) {
      onOffsetChange(partial.offsetY);
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(3.0, Math.round((currentZoom + 0.15) * 100) / 100);
    updateTransform({ zoom: newZoom });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(1.0, Math.round((currentZoom - 0.15) * 100) / 100);
    updateTransform({ zoom: newZoom });
  };

  const handleResetTransform = () => {
    updateTransform({ zoom: 1.0, offsetX: 0, offsetY: 0 });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartXRef.current = e.touches[0].clientX;
      dragStartYRef.current = e.touches[0].clientY;
      initialOffsetXRef.current = currentOffsetX;
      initialOffsetYRef.current = currentOffsetY;
      initialPinchDistRef.current = null;
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
      initialZoomRef.current = currentZoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const deltaX = e.touches[0].clientX - dragStartXRef.current;
      const deltaY = e.touches[0].clientY - dragStartYRef.current;
      const newOffsetX = Math.max(-500, Math.min(500, initialOffsetXRef.current + deltaX * 2.2));
      const newOffsetY = Math.max(-600, Math.min(400, initialOffsetYRef.current + deltaY * 2.2));
      updateTransform({ offsetX: newOffsetX, offsetY: newOffsetY });
    } else if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / initialPinchDistRef.current;
      const newZoom = Math.max(1.0, Math.min(3.0, Math.round(initialZoomRef.current * ratio * 100) / 100));
      updateTransform({ zoom: newZoom });
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    initialPinchDistRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    initialOffsetXRef.current = currentOffsetX;
    initialOffsetYRef.current = currentOffsetY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartXRef.current;
    const deltaY = e.clientY - dragStartYRef.current;
    const newOffsetX = Math.max(-500, Math.min(500, initialOffsetXRef.current + deltaX * 2.2));
    const newOffsetY = Math.max(-600, Math.min(400, initialOffsetYRef.current + deltaY * 2.2));
    updateTransform({ offsetX: newOffsetX, offsetY: newOffsetY });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    const newZoom = Math.max(1.0, Math.min(3.0, Math.round((currentZoom + zoomDelta) * 100) / 100));
    updateTransform({ zoom: newZoom });
  };

  return (
    <div 
      className="relative w-full max-w-[420px] mx-auto rounded-3xl overflow-hidden shadow-2xl bg-neutral-900 border border-neutral-800/80 cursor-grab active:cursor-grabbing select-none touch-none group"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-auto block pointer-events-none"
        style={{
          aspectRatio: aspectRatio === '9:16' ? '9/16' : '1/1',
        }}
      />

      {/* 좌상단: 9:16 ⇄ 1:1 비율 전환 버튼 & 드래그 안내 */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20">
        {onAspectRatioChange && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAspectRatioChange(aspectRatio === '9:16' ? '1:1' : '9:16');
            }}
            className="bg-neutral-950/85 hover:bg-neutral-900 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full text-[10px] text-white font-bold flex items-center gap-1.5 shadow-xl transition active:scale-95 cursor-pointer"
            title="화면 비율 전환 (9:16 인스타 스토리 ⇄ 1:1 일반 피드)"
          >
            <span className="text-amber-300 font-mono font-black">{aspectRatio}</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-neutral-200 font-normal">
              {aspectRatio === '9:16' ? '스토리' : '피드'}
            </span>
          </button>
        )}

        <div className="bg-black/50 backdrop-blur-sm border border-white/10 px-2 py-1 rounded-full text-[9px] text-white/75 font-medium flex items-center gap-1 shadow-sm pointer-events-none">
          <Move className="w-2.5 h-2.5 text-rose-400 shrink-0" />
          <span>드래그</span>
        </div>
      </div>

      {/* 우상단: 감성 퀵 줌 컨트롤 툴바 */}
      <div className="absolute top-2.5 right-2.5 bg-neutral-950/80 backdrop-blur-md border border-white/15 px-1.5 py-1 rounded-full flex items-center gap-1 shadow-xl z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          disabled={currentZoom <= 1.0}
          className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition active:scale-90"
          title="축소"
        >
          <ZoomOut className="w-3 h-3" />
        </button>

        <span className="text-[10px] font-mono font-bold text-amber-300 px-0.5 min-w-[28px] text-center">
          {currentZoom.toFixed(1)}x
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          disabled={currentZoom >= 3.0}
          className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition active:scale-90"
          title="확대"
        >
          <ZoomIn className="w-3 h-3" />
        </button>

        {(currentZoom > 1.0 || currentOffsetX !== 0 || currentOffsetY !== 0) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResetTransform();
            }}
            className="w-6 h-6 rounded-full bg-rose-500/30 hover:bg-rose-500/50 text-rose-200 border border-rose-400/40 flex items-center justify-center transition active:scale-90 ml-0.5"
            title="기본 구도로 초기화"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
};
