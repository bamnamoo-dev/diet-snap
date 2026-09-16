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
  X,
  FileText,
  Lock,
  Crown,
  ClipboardCheck,
  CalendarCheck
} from 'lucide-react';

interface GalleryViewProps {
  records: SavedDietRecord[];
  onSelectRecord: (record: SavedDietRecord) => void;
  onDeleteRecord: (id: string) => void;
  onNewCaptureClick: () => void;
  isPro?: boolean;
  onOpenProModal?: () => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onNewCaptureClick,
  isPro = false,
  onOpenProModal,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDailySummaryOpen, setIsDailySummaryOpen] = useState(false);
  const [isTrainerReportOpen, setIsTrainerReportOpen] = useState(false);
  const [isWeeklyWrapOpen, setIsWeeklyWrapOpen] = useState(false);

  const dailyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const trainerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const weeklyCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // 최근 7일(주간) 기록 통계 계산
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const weekRecords = records.filter((r) => r.dateKey >= oneWeekAgo);
  const weekTotalCalories = weekRecords.reduce((sum, r) => {
    const scale = r.portion?.scale ?? 1.0;
    return sum + Math.round(r.nutrition.calories * scale);
  }, 0);
  const weekAvgCalories = weekRecords.length > 0 ? Math.round(weekTotalCalories / Math.min(7, Math.max(1, new Set(weekRecords.map(r => r.dateKey)).size))) : 0;
  const weekAvgProtein = weekRecords.length > 0 ? Math.round(weekRecords.reduce((sum, r) => sum + Math.round(r.nutrition.protein * (r.portion?.scale ?? 1.0)), 0) / weekRecords.length) : 0;

  // 오늘의 3끼 통합 영수증 캔버스 렌더링
  const handleGenerateDailySummary = () => {
    setIsDailySummaryOpen(true);
    setTimeout(() => {
      renderDailyCollage();
    }, 100);
  };

  // PT 쌤 제출용 리포트 모달 열기 (무료 유저일 경우 Pro 모달 호출)
  const handleOpenTrainerReport = () => {
    if (!isPro) {
      if (onOpenProModal) onOpenProModal();
      return;
    }
    setIsTrainerReportOpen(true);
    setTimeout(() => {
      renderTrainerReport();
    }, 100);
  };

  // 주간 오식완 롱 영수증 모달 열기 (무료 유저일 경우 Pro 모달 호출)
  const handleOpenWeeklyWrap = () => {
    if (!isPro) {
      if (onOpenProModal) onOpenProModal();
      return;
    }
    setIsWeeklyWrapOpen(true);
    setTimeout(() => {
      renderWeeklyWrap();
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

  /**
   * 📋 PT / 필라테스 쌤 제출용 원클릭 리포트 캔버스 렌더러 (1080 x 1440)
   */
  const renderTrainerReport = async () => {
    const canvas = trainerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1440;

    // 순백색 고해상도 보고서 배경
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1080, 1440);

    // 상단 브랜딩 바
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1080, 160);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 20px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DIETSNAP COACH REPORT', 64, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 36px "Noto Sans KR", sans-serif';
    ctx.fillText('회원 일일 식단 제출용 리포트', 64, 110);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 22px "Space Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`DATE: ${todayKey}`, 1080 - 64, 110);

    // 식단 항목 목록 (최대 4개)
    const items = todayRecords.slice(0, 4);
    let startY = 190;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const scale = item.portion?.scale ?? 1.0;
      const soupScale = item.portion?.excludeSoup ? 0.85 : 1.0;
      const cals = Math.round(item.nutrition.calories * scale * soupScale);
      const carbs = Math.round(item.nutrition.carbs * scale);
      const protein = Math.round(item.nutrition.protein * scale);
      const fat = Math.round(item.nutrition.fat * scale);

      const rowH = 190;

      // 행 카드 배경
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(64, startY, 1080 - 128, rowH, 20);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 사진 썸네일
      await drawImageCover(ctx, item.imageSrc, 84, startY + 20, 150, 150, 16);

      // 끼니 뱃지 & 시간
      const mealName = item.portion?.mealType ? {
        breakfast: '아침 BREAKFAST',
        lunch: '점심 LUNCH',
        dinner: '저녁 DINNER',
        snack: '간식 SNACK',
        cheating: '치팅 CHEATING'
      }[item.portion.mealType] : `식사 #${i + 1}`;

      ctx.fillStyle = '#2563eb';
      ctx.font = '800 20px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(mealName, 260, startY + 55);

      // 메뉴명
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 28px "Noto Sans KR", sans-serif';
      const menuName = item.nutrition.name.length > 20 ? item.nutrition.name.slice(0, 19) + '...' : item.nutrition.name;
      ctx.fillText(menuName, 260, startY + 100);

      // 칼로리 & 탄단지 상세 수치
      ctx.fillStyle = '#dc2626';
      ctx.font = '800 26px "Space Mono", monospace';
      ctx.fillText(`${cals} kcal`, 260, startY + 145);

      ctx.fillStyle = '#64748b';
      ctx.font = '600 20px "Noto Sans KR", sans-serif';
      ctx.fillText(`(탄 ${carbs}g · 단 ${protein}g · 지 ${fat}g)`, 420, startY + 145);

      startY += rowH + 20;
    }

    // 하단 요약 대형 박스
    const summaryY = 1080;
    const summaryH = 260;

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(64, summaryY, 1080 - 128, summaryH, 24);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 22px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('오늘의 총 영양 결산 요약', 104, summaryY + 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 68px "Space Mono", sans-serif';
    ctx.fillText(`${todayCalories}`, 104, summaryY + 145);

    ctx.font = '700 28px "Space Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('KCAL', 104 + ctx.measureText(`${todayCalories}`).width + 16, summaryY + 145);

    // 매크로 3분할 뱃지
    const macroX = 580;
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(macroX, summaryY + 40, 1080 - 128 - macroX + 24, 180, 16);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 20px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('탄수화물', macroX + 70, summaryY + 85);
    ctx.fillText('단백질', macroX + 190, summaryY + 85);
    ctx.fillText('지방', macroX + 310, summaryY + 85);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 32px "Space Mono", monospace';
    ctx.fillText(`${todayCarbs}g`, macroX + 70, summaryY + 135);
    ctx.fillStyle = '#f43f5e';
    ctx.fillText(`${todayProtein}g`, macroX + 190, summaryY + 135);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${todayFat}g`, macroX + 310, summaryY + 135);

    // 최하단
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 18px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DIETSNAP COACH REPORT · VERIFIED BY AI NUTRITIONIST', 540, 1400);
  };

  /**
   * 🧾 주간 오식완 결산 롱 영수증 캔버스 렌더러 (1080 x 1920)
   */
  const renderWeeklyWrap = async () => {
    const canvas = weeklyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1920;

    // 딥 차콜 배경
    ctx.fillStyle = '#0d0e12';
    ctx.fillRect(0, 0, 1080, 1920);

    // 상단 헤더
    ctx.fillStyle = '#f43f5e';
    ctx.font = '800 24px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WEEKLY DIET WRAP #오식완', 540, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px "Space Mono", monospace';
    ctx.fillText('이번 주 식단 결산', 540, 175);

    ctx.fillStyle = '#71717a';
    ctx.font = '600 22px "Noto Sans KR", sans-serif';
    ctx.fillText(`최근 7일간의 총 ${weekRecords.length}끼 기록 요약`, 540, 220);

    // 사진 4컷 그리드 (최근 기록 4개)
    const recent4 = weekRecords.slice(0, 4);
    const photoY = 270;
    const photoH = 700;

    if (recent4.length >= 2) {
      const w = 450;
      const h = 330;
      if (recent4[0]) await drawImageCover(ctx, recent4[0].imageSrc, 70, photoY, w, h, 20);
      if (recent4[1]) await drawImageCover(ctx, recent4[1].imageSrc, 560, photoY, w, h, 20);
      if (recent4[2]) await drawImageCover(ctx, recent4[2].imageSrc, 70, photoY + h + 20, w, h, 20);
      if (recent4[3]) await drawImageCover(ctx, recent4[3].imageSrc, 560, photoY + h + 20, w, h, 20);
    } else if (recent4.length === 1) {
      await drawImageCover(ctx, recent4[0].imageSrc, 70, photoY, 940, photoH, 24);
    }

    // 하단 주간 영수증 카드
    const cardY = 1010;
    const cardH = 820;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(70, cardY, 940, cardH, 28);
    ctx.fill();

    ctx.fillStyle = '#18181b';
    ctx.font = '800 36px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('WEEKLY STATS', 120, cardY + 80);

    ctx.fillStyle = '#e11d48';
    ctx.font = '700 24px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('PRO VERIFIED', 1080 - 120, cardY + 80);

    // 점선
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(120, cardY + 115);
    ctx.lineTo(1080 - 120, cardY + 115);
    ctx.stroke();
    ctx.setLineDash([]);

    // 주간 지표 4칸 그리드
    const gridY = cardY + 160;

    // 지표 1: 주간 총 칼로리
    ctx.fillStyle = '#71717a';
    ctx.font = '600 22px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('주간 총 칼로리', 120, gridY);
    ctx.fillStyle = '#09090b';
    ctx.font = '900 44px "Space Mono", monospace';
    ctx.fillText(`${weekTotalCalories.toLocaleString()}`, 120, gridY + 55);
    ctx.font = '700 20px "Space Mono", monospace';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('KCAL', 120 + ctx.measureText(`${weekTotalCalories.toLocaleString()}`).width + 12, gridY + 55);

    // 지표 2: 하루 평균 칼로리
    ctx.fillStyle = '#71717a';
    ctx.font = '600 22px "Noto Sans KR", sans-serif';
    ctx.fillText('하루 평균 섭취', 580, gridY);
    ctx.fillStyle = '#e11d48';
    ctx.font = '900 44px "Space Mono", monospace';
    ctx.fillText(`${weekAvgCalories}`, 580, gridY + 55);
    ctx.font = '700 20px "Space Mono", monospace';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('KCAL/DAY', 580 + ctx.measureText(`${weekAvgCalories}`).width + 12, gridY + 55);

    // 지표 3: 평균 단백질
    ctx.fillStyle = '#71717a';
    ctx.font = '600 22px "Noto Sans KR", sans-serif';
    ctx.fillText('끼니당 평균 단백질', 120, gridY + 150);
    ctx.fillStyle = '#2563eb';
    ctx.font = '900 44px "Space Mono", monospace';
    ctx.fillText(`${weekAvgProtein}g`, 120, gridY + 205);

    // 지표 4: 총 기록 수
    ctx.fillStyle = '#71717a';
    ctx.font = '600 22px "Noto Sans KR", sans-serif';
    ctx.fillText('완료한 오식완', 580, gridY + 150);
    ctx.fillStyle = '#16a34a';
    ctx.font = '900 44px "Space Mono", monospace';
    ctx.fillText(`${weekRecords.length}끼`, 580, gridY + 205);

    // 인스타 박제용 한 줄 코멘트 박스
    ctx.fillStyle = '#f4f4f5';
    ctx.beginPath();
    ctx.roundRect(120, cardY + 420, 940 - 100, 150, 20);
    ctx.fill();

    ctx.fillStyle = '#18181b';
    ctx.font = '800 28px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 이번 주도 완벽하게 오식완 성공!', 540, cardY + 480);
    ctx.fillStyle = '#71717a';
    ctx.font = '600 22px "Noto Sans KR", sans-serif';
    ctx.fillText('꾸준한 기록이 만들어낸 멋진 한 주였습니다 ✨', 540, cardY + 525);

    // 바코드
    ctx.fillStyle = '#000000';
    const barY = cardY + 610;
    const barH = 70;
    for (let bx = 220; bx < 860; bx += 8) {
      if (Math.sin(bx * 13) > 0) {
        ctx.fillRect(bx, barY, Math.sin(bx * 7) > 0.4 ? 5 : 2.5, barH);
      }
    }

    ctx.fillStyle = '#71717a';
    ctx.font = '700 20px "Space Mono", monospace';
    ctx.fillText('* WEEKLY-WRAP-2026-SEONGSU *', 540, barY + barH + 40);
  };

  // 트레이너 리포트 다운로드 & 공유
  const handleDownloadTrainerReport = () => {
    const canvas = trainerCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `DietSnap_TrainerReport_${todayKey}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  const handleShareTrainerReport = async () => {
    const canvas = trainerCanvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'dietsnap-coach-report.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'DietSnap 트레이너 쌤 식단 리포트',
            text: `선생님, ${todayKey} 오늘 식단 제출합니다! 🏋️‍♀️`,
          });
        } catch (err) {
          console.log(err);
        }
      } else {
        handleDownloadTrainerReport();
        alert('트레이너 쌤 제출용 식단표가 저장되었습니다! 카톡으로 전송해보세요 🏋️‍♀️');
      }
    }, 'image/jpeg', 0.95);
  };

  // 주간 결산 롱 영수증 다운로드 & 공유
  const handleDownloadWeeklyWrap = () => {
    const canvas = weeklyCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `DietSnap_WeeklyWrap_${todayKey}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  const handleShareWeeklyWrap = async () => {
    const canvas = weeklyCanvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'dietsnap-weekly-wrap.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'DietSnap 이번 주 오식완 결산',
            text: `이번 주도 완벽하게 오식완 성공! 📸`,
          });
        } catch (err) {
          console.log(err);
        }
      } else {
        handleDownloadWeeklyWrap();
        alert('주간 결산 롱 영수증이 저장되었습니다! 인스타 스토리에 공유해보세요 ✨');
      }
    }, 'image/jpeg', 0.95);
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

        {/* 🌟 2대 킬러 보고서: PT 쌤 제출용 식단표 & 주간 오식완 롱 영수증 */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={handleOpenTrainerReport}
            className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
              isPro 
                ? 'bg-sky-500/15 border-sky-500/30 text-sky-300 hover:bg-sky-500/25' 
                : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:border-neutral-700'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span>쌤 제출용 식단표</span>
            {!isPro && (
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[9px] font-black rounded-md flex items-center gap-0.5 border border-amber-500/30 shrink-0">
                <Lock className="w-2.5 h-2.5" /> PRO
              </span>
            )}
          </button>

          <button
            onClick={handleOpenWeeklyWrap}
            className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
              isPro 
                ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25' 
                : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:border-neutral-700'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-purple-400 shrink-0" />
            <span>주간 오식완 결산</span>
            {!isPro && (
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[9px] font-black rounded-md flex items-center gap-0.5 border border-amber-500/30 shrink-0">
                <Lock className="w-2.5 h-2.5" /> PRO
              </span>
            )}
          </button>
        </div>
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

      {/* 5. 📋 PT / 필라테스 쌤 제출용 식단표 모달 */}
      {isTrainerReportOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-4 flex flex-col items-center gap-3 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="w-full flex items-center justify-between pb-1 border-b border-neutral-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-sky-400" /> 트레이너 쌤 식단 제출 리포트
              </span>
              <button
                onClick={() => setIsTrainerReportOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 생성된 캔버스 미리보기 */}
            <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-neutral-800 bg-white">
              <canvas ref={trainerCanvasRef} className="w-full h-auto block" style={{ aspectRatio: '3/4' }} />
            </div>

            {/* 다운로드 및 공유 버튼 */}
            <div className="w-full space-y-2 pt-1">
              <button
                onClick={handleShareTrainerReport}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95 transition"
              >
                <Share2 className="w-4 h-4" /> 카톡으로 쌤에게 즉시 전송
              </button>
              <button
                onClick={handleDownloadTrainerReport}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5" /> 식단표 이미지 파일 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. 🧾 주간 오식완 롱 영수증 모달 */}
      {isWeeklyWrapOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-4 flex flex-col items-center gap-3 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="w-full flex items-center justify-between pb-1 border-b border-neutral-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-purple-400" /> 주간 오식완 결산 롱 영수증
              </span>
              <button
                onClick={() => setIsWeeklyWrapOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 생성된 캔버스 미리보기 */}
            <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-neutral-800 bg-black">
              <canvas ref={weeklyCanvasRef} className="w-full h-auto block" style={{ aspectRatio: '9/16' }} />
            </div>

            {/* 다운로드 및 공유 버튼 */}
            <div className="w-full space-y-2 pt-1">
              <button
                onClick={handleShareWeeklyWrap}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 active:scale-95 transition"
              >
                <Share2 className="w-4 h-4" /> 인스타 스토리 주간 결산 박제
              </button>
              <button
                onClick={handleDownloadWeeklyWrap}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5" /> 롱 영수증 이미지 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
