import React, { useEffect, useRef } from 'react';
import { NutritionItem, PortionModifier, StampTemplate, AspectRatio, PhotoTransform } from '../types/diet';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import { renderStampTemplate } from '../canvas';

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
  const cachedImageRef = useRef<{ src: string; img: HTMLImageElement } | null>(null);

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
      ctx.fillStyle = template === 'pink_receipt' 
        ? '#fdf2f4' 
        : template === 'vintage_ticket' 
        ? '#faf4e8' 
        : template === 'y2k'
        ? '#05070c'
        : template === 'kitsch_diary'
        ? '#fefbf3'
        : '#141416';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      if (template === 'kitsch_diary') {
        // 모눈종이 그리드 패턴
        ctx.strokeStyle = '#f1e7d0';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < targetWidth; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, targetHeight);
          ctx.stroke();
        }
        for (let y = 0; y < targetHeight; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(targetWidth, y);
          ctx.stroke();
        }
      }

      // 2. 유저 음식 사진 렌더링 (줌 & 팬 적용)
      if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
        const imgW = imgElement.naturalWidth;
        const imgH = imgElement.naturalHeight;

        let drawX = 0;
        let drawY = 0;
        let drawW = targetWidth;
        let drawH = targetHeight;

        const bottomMargin = aspectRatio === '9:16' ? 560 : 400;

        if (template === 'polaroid' || template === 'kitsch_diary') {
          const framePad = template === 'kitsch_diary' ? 44 : 48;
          drawX = framePad;
          drawY = template === 'kitsch_diary' ? 95 : framePad;
          drawW = targetWidth - framePad * 2;
          drawH = targetHeight - bottomMargin - drawY + (template === 'kitsch_diary' ? 10 : 0);

          if (template === 'polaroid') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          } else if (template === 'kitsch_diary') {
            // 키치 다이어리: 음식 사진 뒤 흰색 폴라로이드 카드 & 그림자
            ctx.save();
            ctx.shadowColor = 'rgba(180, 140, 100, 0.22)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 8;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(drawX - 12, drawY - 12, drawW + 24, drawH + 24, 28);
            ctx.fill();
            ctx.restore();
          }
        }

        const isLandscape = imgW > imgH;
        let renderX = drawX;
        let renderY = drawY;
        let renderW = drawW;
        let renderH = drawH;

        if (template === 'polaroid' || template === 'kitsch_diary') {
          // 폴라로이드 & 키치 다이어리: 프레임 내 안착 및 자르기(Clip)
          ctx.save();
          ctx.beginPath();
          if (template === 'kitsch_diary') {
            ctx.roundRect(drawX, drawY, drawW, drawH, 24);
          } else {
            ctx.rect(drawX, drawY, drawW, drawH);
          }
          ctx.clip();

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
          // 영수증/티켓/매거진/Y2K 템플릿: 상단 세이프 존 기준으로 음식 안착
          const receiptOccupiedH = aspectRatio === '9:16' ? 700 : 450;
          const stageH = targetHeight - receiptOccupiedH;
          const centerX = targetWidth / 2;

          let baseScale = 1.0;
          if (isLandscape) {
            baseScale = drawW / imgW;
          } else {
            baseScale = Math.max(drawW / imgW, stageH / imgH);
          }

          renderW = imgW * baseScale * currentZoom;
          renderH = imgH * baseScale * currentZoom;
          renderX = centerX - renderW / 2 + currentOffsetX;
          renderY = (stageH / 2) - renderH / 2 + currentOffsetY;

          ctx.drawImage(imgElement, renderX, renderY, renderW, renderH);
        }

        // 사진 위 그라디언트 비네팅 (폴라로이드, Y2K 및 키치 다이어리 제외)
        if (template !== 'polaroid' && template !== 'y2k' && template !== 'kitsch_diary') {
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

      // 3. 모듈화된 템플릿 & 스티커 레이어 합성
      renderStampTemplate({
        ctx,
        canvasWidth: targetWidth,
        canvasHeight: targetHeight,
        aspectRatio,
        imgElement,
        nutrition,
        portion,
        transform,
        isPro,
        template,
        stickers: portion.stickers,
        displayCaloriesText,
        caloriesUnitText,
        humorTopBadge,
        mealLabel,
        dDayLabel,
        displayCarbs,
        displayProtein,
        displayFat,
      });

      // 4. 상단 공복 시간 플로팅 뱃지
      if (nutrition.fastingHours) {
        ctx.save();
        ctx.font = '700 24px "Noto Sans KR", sans-serif';
        const text = `⏳ 공복 ${nutrition.fastingHours} 달성 🔥`;
        const textMetrics = ctx.measureText(text);
        const badgeW = textMetrics.width + 56;
        const badgeH = 56;
        const badgeX = (targetWidth - badgeW) / 2;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 6;

        ctx.fillStyle = 'rgba(234, 88, 12, 0.92)';
        ctx.beginPath();
        ctx.roundRect(badgeX, 56, badgeW, badgeH, 28);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, targetWidth / 2, 56 + badgeH / 2 + 1);
        ctx.restore();
      }

      if (onCanvasReady) {
        onCanvasReady(canvas);
      }
    };

    if (imageSrc) {
      // 🚀 인메모리 캐시 히트: 드래그/줌/보정 조작 시 동일 이미지면 0초 즉시 렌더링 (60fps 보장)
      if (
        cachedImageRef.current &&
        cachedImageRef.current.src === imageSrc &&
        cachedImageRef.current.img.complete
      ) {
        render(cachedImageRef.current.img);
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          cachedImageRef.current = { src: imageSrc, img };
          render(img);
        };
        img.src = imageSrc;
      }
    } else {
      cachedImageRef.current = null;
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
