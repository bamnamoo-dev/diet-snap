import React, { useState } from 'react';
import { SavedDietRecord } from '../utils/dietStorage';
import { 
  Camera, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  Flame, 
  Clock, 
  Sparkles,
  Utensils
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

  return (
    <div className="w-full max-w-md px-4 pt-2 pb-16 flex flex-col items-center gap-4 font-sans">
      
      {/* 1. 오늘의 식단 요약 대시보드 카드 */}
      <div className="w-full bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 rounded-3xl p-4 shadow-xl relative overflow-hidden">
        {/* 은은한 배경 효과 */}
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
          className="text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-400 hover:opacity-95 text-white font-bold flex items-center gap-1 shadow-md shadow-rose-500/20 active:scale-95 transition"
        >
          <Camera className="w-3.5 h-3.5 text-white" />
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
                  {/* 사진 썸네일 */}
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

                  {/* 메뉴 및 영양 수치 */}
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

                {/* 한 줄 평 */}
                {record.nutrition.diet_comment && (
                  <p className="text-[11px] text-neutral-400 bg-neutral-950/60 rounded-lg px-2.5 py-1.5 border border-neutral-800/50 flex items-center gap-1.5 leading-tight">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="line-clamp-1">{record.nutrition.diet_comment}</span>
                  </p>
                )}

                {/* 하단 에디터 열기 버튼 */}
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
    </div>
  );
};
