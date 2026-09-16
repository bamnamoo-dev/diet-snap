import React, { useState, useRef } from 'react';
import { SavedDietRecord } from '../utils/dietStorage';
import { 
  Camera, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  Flame, 
  Clock, 
  Sparkles,
  Utensils,
  Layers,
  Download,
  Share2,
  X
} from 'lucide-react';

interface GalleryViewProps {
  records: SavedDietRecord[];
  onSelectRecord: (record: SavedDietRecord) => void;
  onDeleteRecord: (id: string) => void;
  onNewCaptureClick: () => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onNewCaptureClick,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDailySummaryOpen, setIsDailySummaryOpen] = useState(false);
  const dailyCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 오늘 날짜 키 (YYYY-MM-DD)
  const todayKey = new Date().toISOString().slice(0, 10);

  // 오늘 기록 통계 계산
  const todayRecords = records.filter((r) => r.dateKey === todayKey);
  const todayCalories = todayRecords.reduce((sum, r) => {
    const scale = r.portion?.scale ?? 1.0;
    const soupScale = r.portion?.excludeSoup ? 0.85 : 1.0;
    return sum + Math.round(r.nutrition.calories * scale * soupScale);
  }, 0);

  const todayCarbs = todayRecords.reduce((sum, r) => {
    const scale = r.portion?.scale ?? 1.0;
    return sum + Math.round(r.nutrition.carbs * scale);
  }, 0);

  const todayProtein = todayRecords.reduce((sum, r) => {
    const scale = r.portion?.scale ?? 1.0;
    return sum + Math.round(r.nutrition.protein * scale);
  }, 0);

  const todayFat = todayRecords.reduce((sum, r) => {
    const scale = r.portion?.scale ?? 1.0;
    return sum + Math.round(r.nutrition.fat * scale);
  }, 0);

  // 오늘의 3끼 통합 영수증 캔버스 렌더링
  const handleGenerateDailySummary = () => {
    setIsDailySummaryOpen(true);
    setTimeout(() => {
      renderDailyCollage();
    }, 100);
  };

  const renderDailyCollage = async () => {
    const canvas = dailyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1920;

    // 배경
    ctx.fillStyle = '#111215';
    ctx.fillRect(0, 0, 1080, 1920);

    // 상단 타이틀
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 48px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText("TODAY'S DIET COLLAGE", 540, 110);

    ctx.fillStyle = '#f43f5e';
    ctx.font = '700 24px "Noto Sans KR", sans-serif';
    ctx.fillText(`${todayKey} · 오늘 하루 오식완 결산 📸`, 540, 155);

    // 사진 콜라주 영역 (최대 3~4장 분할)
    const displayItems = todayRecords.slice(0, 4);
    const photoAreaY = 200;
    const photoAreaH = 860;

    if (displayItems.length === 1) {
      // 1장 단독
      await drawImageCover(ctx, displayItems[0].imageSrc, 64, photoAreaY, 1080 - 128, photoAreaH, 24);
    } else if (displayItems.length === 2) {
      // 2장 상하 분할
      const h = (photoAreaH - 16) / 2;
      await drawImageCover(ctx, displayItems[0].imageSrc, 64, photoAreaY, 1080 - 128, h, 20);
      await drawImageCover(ctx, displayItems[1].imageSrc, 64, photoAreaY + h + 16, 1080 - 128, h, 20);
    } else if (displayItems.length === 3) {
      // 3장 (위 1장 + 아래 2장)
      const topH = 460;
      const bottomH = photoAreaH - topH - 16;
      const bottomW = (1080 - 128 - 16) / 2;
      await drawImageCover(ctx, displayItems[0].imageSrc, 64, photoAreaY, 1080 - 128, topH, 20);
      await drawImageCover(ctx, displayItems[1].imageSrc, 64, photoAreaY + topH + 16, bottomW, bottomH, 20);
      await drawImageCover(ctx, displayItems[2].imageSrc, 64 + bottomW + 16, photoAreaY + topH + 16, bottomW, bottomH, 20);
    } else {
      // 4장 (2x2 그리드)
      const w = (1080 - 128 - 16) / 2;
      const h = (photoAreaH - 16) / 2;
      await drawImageCover(ctx, displayItems[0].imageSrc, 64, photoAreaY, w, h, 18);
      await drawImageCover(ctx, displayItems[1].imageSrc, 64 + w + 16, photoAreaY, w, h, 18);
      await drawImageCover(ctx, displayItems[2].imageSrc, 64, photoAreaY + h + 16, w, h, 18);
      await drawImageCover(ctx, displayItems[3].imageSrc, 64 + w + 16, photoAreaY + h + 16, w, h, 18);
    }

    // 하단 일일 총결산 영수증 카드
    const receiptY = photoAreaY + photoAreaH + 40;
    const receiptH = 1920 - receiptY - 60;
    const cardMarginX = 64;
    const cardW = 1080 - cardMarginX * 2;

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 15;
    ctx.beginPath();
    ctx.roundRect(cardMarginX, receiptY, cardW, receiptH, 24);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // 영수증 헤더 점선
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(cardMarginX + 32, receiptY + 80);
    ctx.lineTo(cardMarginX + cardW - 32, receiptY + 80);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#18181b';
    ctx.font = '800 32px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DAILY SUMMARY RECEIPT', cardMarginX + 40, receiptY + 54);

    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'right';
    ctx.font = '800 24px "Space Mono", monospace';
    ctx.fillText(`${todayRecords.length} MEALS TOTAL`, cardMarginX + cardW - 40, receiptY + 54);

    // 오늘 먹은 메뉴 리스트
    let itemY = receiptY + 130;
    todayRecords.slice(0, 4).forEach((r, idx) => {
      const scale = r.portion?.scale ?? 1.0;
      const soupScale = r.portion?.excludeSoup ? 0.85 : 1.0;
      const c = Math.round(r.nutrition.calories * scale * soupScale);

      ctx.fillStyle = '#27272a';
      ctx.font = '700 24px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`0${idx + 1}. ${r.nutrition.name}`, cardMarginX + 40, itemY, cardW - 240);

      ctx.fillStyle = '#71717a';
      ctx.textAlign = 'right';
      ctx.font = '700 22px "Space Mono", monospace';
      ctx.fillText(`${c} kcal`, cardMarginX + cardW - 40, itemY);

      itemY += 46;
    });

    // 구분 실선
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cardMarginX + 40, itemY + 10);
    ctx.lineTo(cardMarginX + cardW - 40, itemY + 10);
    ctx.stroke();

    // 총 칼로리 & 탄단지
    const totalY = itemY + 60;
    ctx.fillStyle = '#18181b';
    ctx.font = '800 28px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('TOTAL CALORIES', cardMarginX + 40, totalY);

    ctx.fillStyle = '#dc2626';
    ctx.font = '900 60px "Space Mono", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${todayCalories}`, cardMarginX + cardW - 40, totalY);
    ctx.font = '700 24px "Space Mono", monospace';
    ctx.fillStyle = '#71717a';
    ctx.fillText('KCAL', cardMarginX + cardW - 40, totalY + 36);

    // 탄단지 서브합
    ctx.fillStyle = '#52525b';
    ctx.font = '700 22px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`탄수화물 ${todayCarbs}g  ·  단백질 ${todayProtein}g  ·  지방 ${todayFat}g`, cardMarginX + cardW / 2, totalY + 90);

    // 하단 워터마크
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '600 18px "Space Mono", monospace';
    ctx.fillText('DIETSNAP® ARCHIVE · OFFICIAL LOG', cardMarginX + cardW / 2, receiptY + receiptH - 24);
  };

  const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    src: string,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
  ): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.clip();

        const imgRatio = img.width / img.height;
        const targetRatio = w / h;
        let sWidth = img.width;
        let sHeight = img.height;
        let sx = 0;
        let sy = 0;

        if (imgRatio > targetRatio) {
          sWidth = img.height * targetRatio;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / targetRatio;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
        ctx.restore();
        resolve();
      };
      img.onerror = () => resolve();
      img.src = src;
    });
  };

  // 모아보기 다운로드
  const handleDownloadSummary = () => {
    const canvas = dailyCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `DietSnap_Daily_${todayKey}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  // 모아보기 인스타 공유
  const handleShareSummary = async () => {
    const canvas = dailyCanvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'dietsnap-daily-summary.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'DietSnap 오늘의 식단 총결산',
            text: `오늘 하루 총 ${todayCalories} kcal 오식완 완료! ✨`,
          });
        } catch (err) {
          console.log('Share canceled', err);
        }
      } else {
        handleDownloadSummary();
        alert('오늘의 총결산 이미지가 저장되었습니다! 인스타 스토리에 공유해보세요 ✨');
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="w-full max-w-md px-4 pt-2 pb-16 flex flex-col items-center gap-4 font-sans">
      
      {/* 1. 오늘의 식단 요약 대시보드 카드 */}
      <div className="w-full bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 rounded-3xl p-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-neutral-200">오늘의 오식완 요약</span>
          </div>
          <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-neutral-500" />
            {todayKey}
          </span>
        </div>

        {/* 오늘 통계 지표 */}
        <div className="grid grid-cols-4 gap-2 pt-3 text-center">
          <div className="flex flex-col items-center bg-neutral-950/60 rounded-xl p-2 border border-neutral-800/50">
            <span className="text-[10px] text-neutral-400">기록</span>
            <span className="text-base font-black text-white">{todayRecords.length}<span className="text-[10px] font-normal text-neutral-500">끼</span></span>
          </div>

          <div className="flex flex-col items-center bg-neutral-950/60 rounded-xl p-2 border border-neutral-800/50">
            <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5" /> 칼로리
            </span>
            <span className="text-base font-black text-amber-300 font-mono">
              {todayCalories}
              <span className="text-[9px] font-normal text-neutral-500 block -mt-0.5">kcal</span>
            </span>
          </div>

          <div className="flex flex-col items-center bg-neutral-950/60 rounded-xl p-2 border border-neutral-800/50">
            <span className="text-[10px] text-rose-400 font-semibold">단백질</span>
            <span className="text-base font-black text-rose-300 font-mono">
              {todayProtein}
              <span className="text-[9px] font-normal text-neutral-500 block -mt-0.5">g</span>
            </span>
          </div>

          <div className="flex flex-col items-center bg-neutral-950/60 rounded-xl p-2 border border-neutral-800/50">
            <span className="text-[10px] text-sky-400 font-semibold">탄/지</span>
            <span className="text-xs font-bold text-neutral-300 font-mono pt-1">
              {todayCarbs} / {todayFat}g
            </span>
          </div>
        </div>

        {/* 🌟 킬러 기능: 오늘 식단이 1개 이상일 때 [오늘의 3끼 모아보기 영수증 발행] 배너 */}
        {todayRecords.length > 0 && (
          <button
            onClick={handleGenerateDailySummary}
            className="mt-3.5 w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 hover:opacity-95 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-[0.98] transition"
          >
            <Layers className="w-4 h-4 text-white" />
            <span>오늘의 {todayRecords.length}끼 모아보기 일일 영수증 발행</span>
          </button>
        )}
      </div>

      {/* 2. 갤러리 피드 헤더 & 새 촬영 버튼 */}
      <div className="w-full flex items-center justify-between pt-1 px-1">
        <div className="flex items-center gap-1.5">
          <Utensils className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-bold text-white">식단 히스토리</h3>
          <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-400 font-mono">
            {records.length}개
          </span>
        </div>

        <button
          onClick={onNewCaptureClick}
          className="text-xs px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 font-bold flex items-center gap-1 shadow-md active:scale-95 transition"
        >
          <Camera className="w-3.5 h-3.5 text-neutral-950" />
          새 식단 촬영
        </button>
      </div>

      {/* 3. 식단 목록 (기록이 없을 때 vs 있을 때) */}
      {records.length === 0 ? (
        <div className="w-full py-16 flex flex-col items-center justify-center text-center gap-3 bg-neutral-900/30 border border-dashed border-neutral-800 rounded-3xl p-6">
          <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-500 border border-neutral-800">
            <Utensils className="w-6 h-6 text-neutral-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-200">아직 저장된 식단이 없어요</p>
            <p className="text-xs text-neutral-500 pt-1 leading-relaxed">
              카메라로 오늘의 식단을 촬영하면<br />
              칼로리와 탄단지가 여기에 차곡차곡 기록됩니다 ✨
            </p>
          </div>
          <button
            onClick={onNewCaptureClick}
            className="mt-2 py-2.5 px-5 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition"
          >
            <Camera className="w-4 h-4" />
            첫 식단 촬영하기
          </button>
        </div>
      ) : (
        <div className="w-full space-y-3">
          {records.map((record) => {
            const scale = record.portion?.scale ?? 1.0;
            const soupScale = record.portion?.excludeSoup ? 0.85 : 1.0;
            const finalCal = Math.round(record.nutrition.calories * scale * soupScale);
            const finalCarbs = Math.round(record.nutrition.carbs * scale);
            const finalProtein = Math.round(record.nutrition.protein * scale);
            const finalFat = Math.round(record.nutrition.fat * scale);

            return (
              <div
                key={record.id}
                className="w-full bg-neutral-900/90 border border-neutral-800/90 rounded-2xl p-3 shadow-md hover:border-neutral-700 transition-all flex flex-col gap-2.5 group"
              >
                {/* 상단 날짜 및 삭제 버튼 */}
                <div className="flex items-center justify-between text-[11px] text-neutral-400 pb-1 border-b border-neutral-800/60">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    {record.dateStr}
                  </span>

                  {deleteConfirmId === record.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-rose-400 font-medium">정말 삭제할까요?</span>
                      <button
                        onClick={() => {
                          onDeleteRecord(record.id);
                          setDeleteConfirmId(null);
                        }}
                        className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold text-[10px]"
                      >
                        삭제
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-1 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[10px]"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(record.id)}
                      className="text-neutral-500 hover:text-rose-400 p-1 transition"
                      title="기록 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 메인 내용: 썸네일 + 영양 정보 */}
                <div className="flex gap-3 items-center">
                  <div 
                    onClick={() => onSelectRecord(record)}
                    className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-950 shrink-0 cursor-pointer border border-neutral-800"
                  >
                    <img
                      src={record.imageSrc}
                      alt={record.nutrition.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  </div>

                  <div className="flex-1 flex flex-col justify-between h-full py-0.5">
                    <div>
                      <h4 
                        onClick={() => onSelectRecord(record)}
                        className="text-xs font-bold text-neutral-100 line-clamp-1 hover:text-white cursor-pointer"
                      >
                        {record.nutrition.name}
                      </h4>
                      {record.portion?.activeLabel && (
                        <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-amber-300 font-medium border border-neutral-700">
                          {record.portion.activeLabel}
                        </span>
                      )}
                    </div>

                    <div className="pt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] font-mono">
                        <span className="font-extrabold text-amber-300">{finalCal} kcal</span>
                        <span className="text-neutral-500 text-[10px]">
                          (탄{finalCarbs}·단{finalProtein}·지{finalFat})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {record.nutrition.diet_comment && (
                  <p className="text-[11px] text-neutral-400 bg-neutral-950/60 rounded-lg px-2.5 py-1.5 border border-neutral-800/50 flex items-center gap-1.5 leading-tight">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="line-clamp-1">{record.nutrition.diet_comment}</span>
                  </p>
                )}

                <button
                  onClick={() => onSelectRecord(record)}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-750 active:scale-[0.99] transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
                  스탬프 재발행 & 인스타 스토리 공유
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. 오늘의 3끼 통합 영수증 모달 */}
      {isDailySummaryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-4 flex flex-col items-center gap-3 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="w-full flex items-center justify-between pb-1 border-b border-neutral-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-rose-400" /> 오늘의 3끼 총결산 영수증
              </span>
              <button
                onClick={() => setIsDailySummaryOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 생성된 캔버스 미리보기 */}
            <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-neutral-800 bg-black">
              <canvas ref={dailyCanvasRef} className="w-full h-auto block" style={{ aspectRatio: '9/16' }} />
            </div>

            {/* 다운로드 및 공유 버튼 */}
            <div className="w-full space-y-2 pt-1">
              <button
                onClick={handleShareSummary}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 active:scale-95 transition"
              >
                <Share2 className="w-4 h-4" /> 인스타 스토리 즉시 공유
              </button>
              <button
                onClick={handleDownloadSummary}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5" /> 고해상도 JPG 파일 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
