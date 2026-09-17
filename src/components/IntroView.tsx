import React from 'react';
import { Camera, Upload, Sparkles, Zap, Receipt, ArrowRight, RotateCcw } from 'lucide-react';
import { NutritionItem, PersonaTheme } from '../types/diet';
import { PERSONA_THEMES, PERSONA_THEMES_LIST } from '../canvas/themes/themeHelper';

export interface PresetItem {
  name: string;
  img: string;
  data: NutritionItem;
}

interface IntroViewProps {
  onCaptureClick: () => void;
  onGalleryClick: () => void;
  onSelectPreset: (preset: PresetItem) => void;
  presets: PresetItem[];
  hasSavedWork: boolean;
  onResumeWork: () => void;
  onOpenHistoryClick?: () => void;
  historyCount?: number;
  isPro?: boolean;
  remainingCount?: number;
  onOpenProModal?: () => void;
  currentTheme?: PersonaTheme;
  onThemeChange?: (theme: PersonaTheme) => void;
}

export const IntroView: React.FC<IntroViewProps> = ({
  onCaptureClick,
  onGalleryClick,
  onSelectPreset,
  presets,
  hasSavedWork,
  onResumeWork,
  onOpenHistoryClick,
  historyCount = 0,
  isPro = false,
  remainingCount = 3,
  onOpenProModal,
  currentTheme = 'seongsu',
  onThemeChange,
}) => {
  const themeMeta = PERSONA_THEMES[currentTheme] || PERSONA_THEMES.seongsu;

  return (
    <div className="w-full max-w-md px-3 pt-2 pb-12 flex flex-col items-center gap-3.5 font-sans">
      
      {/* 🌟 3대 페르소나 감성 테마 선택 바 (첫 화면 상단 고정) */}
      <div className="w-full grid grid-cols-3 gap-1 bg-neutral-900/95 p-1 rounded-2xl border border-neutral-800 shadow-sm backdrop-blur-md">
        {PERSONA_THEMES_LIST.map((th) => {
          const isActive = currentTheme === th.id;
          return (
            <button
              key={th.id}
              type="button"
              onClick={() => onThemeChange?.(th.id)}
              className={`py-2 px-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 active:scale-95 whitespace-nowrap ${
                isActive
                  ? th.themeActiveTabClass
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>{th.emoji}</span>
              <span className="truncate">{th.shortName} 테마</span>
            </button>
          );
        })}
      </div>
      
      {/* 📸 카메라 뷰파인더 포커싱 히어로 카드 (앱의 핵심 첫인상) */}
      <div className="relative w-full aspect-[4/3] rounded-3xl bg-gradient-to-b from-neutral-900/95 via-neutral-900/70 to-neutral-950 border border-neutral-800/90 p-5 flex flex-col items-center justify-between overflow-hidden shadow-2xl backdrop-blur-md">
        
        {/* 은은한 테마별 배경 빛 번짐 효과 (Glow Accent) */}
        <div className={`absolute -top-12 -left-12 w-36 h-36 rounded-full blur-3xl pointer-events-none ${themeMeta.glowLeftClass}`} />
        <div className={`absolute -bottom-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none ${themeMeta.glowRightClass}`} />

        {/* 뷰파인더 코너 포커싱 레티클 (4개 모서리 카메라 가이드라인) */}
        <div className={`absolute top-3.5 left-3.5 w-6 h-6 border-t-2 border-l-2 ${themeMeta.reticleBorderClass} rounded-tl-sm pointer-events-none`} />
        <div className={`absolute top-3.5 right-3.5 w-6 h-6 border-t-2 border-r-2 ${themeMeta.reticleBorderClass} rounded-tr-sm pointer-events-none`} />
        <div className={`absolute bottom-3.5 left-3.5 w-6 h-6 border-b-2 border-l-2 ${themeMeta.reticleBorderClass} rounded-bl-sm pointer-events-none`} />
        <div className={`absolute bottom-3.5 right-3.5 w-6 h-6 border-b-2 border-r-2 ${themeMeta.reticleBorderClass} rounded-br-sm pointer-events-none`} />

        {/* 뷰파인더 상단 인디케이터 & 잔여 촬영 횟수 */}
        <div className="w-full flex items-center justify-between text-[11px] font-mono z-10 px-1">
          <span className={`flex items-center gap-1.5 font-semibold ${themeMeta.indicatorColor}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            TODAY'S DIET LOG
          </span>
          
          <button
            onClick={onOpenProModal}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition active:scale-95 whitespace-nowrap shrink-0 ${
              isPro 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : 'bg-white/10 text-neutral-200 hover:bg-white/15 border border-white/10'
            }`}
          >
            {isPro ? (
              <span>👑 PRO · {remainingCount}/15장 남음</span>
            ) : (
              <span>무료 {remainingCount}/3장 남음 · <span className="text-amber-400 font-extrabold">UPGRADE</span></span>
            )}
          </button>
        </div>

        {/* 중앙 감성 셔터 렌즈 비주얼 */}
        <div className="flex flex-col items-center justify-center my-auto text-center z-10">
          <div className="relative mb-3.5 group cursor-pointer" onClick={onCaptureClick}>
            {/* 펄스 링 */}
            <div className={`absolute -inset-2.5 rounded-full blur-sm animate-pulse bg-gradient-to-tr ${themeMeta.lensPulseGradient}`} />
            <div className={`relative w-16 h-16 rounded-full p-[2px] shadow-lg flex items-center justify-center transition-transform active:scale-90 bg-gradient-to-tr ${themeMeta.lensRingGradient}`}>
              <div className="w-full h-full rounded-full bg-[#121318] flex items-center justify-center">
                <Camera className="w-7 h-7 text-white transition-transform group-hover:scale-110" />
              </div>
            </div>
            {/* 반짝이/캐릭터 배지 */}
            <div className={`absolute -bottom-1 -right-1 p-1 rounded-full shadow-md text-xs flex items-center justify-center leading-none ${themeMeta.lensBadgeBgClass}`}>
              {themeMeta.lensBadgeEmoji}
            </div>
          </div>

          <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5 whitespace-nowrap">
            {themeMeta.headingText} {themeMeta.headingEmoji}
          </h2>
          <p className="text-xs text-neutral-400 pt-1 leading-relaxed max-w-[290px] break-keep mx-auto">
            {themeMeta.subtext}
          </p>
        </div>

        {/* 뷰파인더 하단 눈금자 느낌 */}
        <div className="w-full flex items-center justify-center gap-1.5 opacity-40 z-10">
          <div className="w-1.5 h-1 bg-neutral-400 rounded-full" />
          <div className="w-4 h-[1px] bg-neutral-500" />
          <div className="w-2 h-1 bg-current rounded-full" />
          <div className="w-4 h-[1px] bg-neutral-500" />
          <div className="w-1.5 h-1 bg-neutral-400 rounded-full" />
        </div>
      </div>

      {/* 3. 빅 액션 버튼 2종 (주요 CTA) */}
      <div className="w-full space-y-2.5">
        {/* 카메라로 바로 촬영 (Main Primary CTA) */}
        <button
          onClick={onCaptureClick}
          className={`w-full py-4 px-5 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition active:scale-[0.98] whitespace-nowrap ${themeMeta.shutterBtnClass}`}
        >
          <Camera className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap">카메라로 바로 촬영하기</span>
        </button>

        {/* 앨범에서 사진 선택 (Secondary CTA) */}
        <button
          onClick={onGalleryClick}
          className="w-full py-3.5 px-5 rounded-2xl bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-750 font-bold text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98] whitespace-nowrap"
        >
          <Upload className="w-4 h-4 text-neutral-400 shrink-0" />
          <span className="whitespace-nowrap">앨범에서 사진 가져오기</span>
        </button>
      </div>

      {/* 4. 핵심 기능 3대 포인트 칩 */}
      <div className="w-full grid grid-cols-3 gap-2 pt-1">
        <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-xl p-2.5 flex flex-col items-center text-center">
          <Zap className="w-4 h-4 text-amber-400 mb-1 shrink-0" />
          <span className="text-[11px] font-bold text-neutral-200 whitespace-nowrap">1.2초 분석</span>
          <span className="text-[9px] text-neutral-500 whitespace-nowrap">수동 입력 0초</span>
        </div>
        <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-xl p-2.5 flex flex-col items-center text-center">
          <Receipt className="w-4 h-4 text-rose-400 mb-1 shrink-0" />
          <span className="text-[11px] font-bold text-neutral-200 whitespace-nowrap">성수동 영수증</span>
          <span className="text-[9px] text-neutral-500 whitespace-nowrap">인스타 감성 룩</span>
        </div>
        <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-xl p-2.5 flex flex-col items-center text-center">
          <Sparkles className="w-4 h-4 text-pink-400 mb-1 shrink-0" />
          <span className="text-[11px] font-bold text-neutral-200 whitespace-nowrap">1초 보정 칩</span>
          <span className="text-[9px] text-neutral-500 whitespace-nowrap">국물·양 빠른 보정</span>
        </div>
      </div>

      {/* 4-1. 내 식단 갤러리 바로가기 버튼 */}
      {onOpenHistoryClick && (
        <button
          onClick={onOpenHistoryClick}
          className="w-full py-3 px-3.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-rose-500/40 text-neutral-200 flex items-center justify-between shadow-md transition active:scale-[0.98]"
        >
          <span className="flex items-center gap-2 text-xs font-bold text-white whitespace-nowrap">
            <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
              <Receipt className="w-4 h-4" />
            </span>
            <span className="whitespace-nowrap">내 식단 기록 갤러리</span>
          </span>
          <span className="text-xs font-mono text-rose-400 font-bold flex items-center gap-1 whitespace-nowrap shrink-0">
            {historyCount > 0 ? `${historyCount}개 보관` : '보관함'} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>
      )}

      {/* 5. 샘플 식단으로 1초 체험하기 섹션 */}
      <div className="w-full pt-3">
        <div className="flex items-center justify-between pb-2.5 px-0.5">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-xs font-bold text-white">💡 미리보기</span>
            <span className="text-[11px] text-neutral-400">샘플 식단으로 1초 체험</span>
          </div>
          <span className="text-[10px] text-neutral-500 whitespace-nowrap">탭하여 바로 확인</span>
        </div>

        {/* 2x2 감성 카드 그리드 */}
        <div className="grid grid-cols-2 gap-2.5">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onSelectPreset(preset)}
              className="group text-left relative rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 overflow-hidden transition-all duration-200 active:scale-[0.97] flex flex-col shadow-sm"
            >
              {/* 음식 썸네일 이미지 */}
              <div className="relative w-full aspect-[4/3] overflow-hidden bg-neutral-950">
                <img
                  src={preset.img}
                  alt={preset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
                
                {/* 칼로리 뱃지 */}
                <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded-md bg-neutral-900/80 backdrop-blur-sm border border-neutral-700/60 text-[10px] font-mono font-bold text-amber-300">
                  {preset.data.calories} kcal
                </div>
              </div>

              {/* 하단 텍스트 정보 */}
              <div className="p-2.5 flex flex-col justify-between flex-1">
                <span className="text-xs font-bold text-neutral-200 line-clamp-1 group-hover:text-white transition-colors">
                  {preset.name}
                </span>
                <div className="flex items-center justify-between pt-1 gap-1">
                  <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                    탄{preset.data.carbs}·단{preset.data.protein}·지{preset.data.fat}
                  </span>
                  <span className="text-[10px] text-rose-400 font-semibold group-hover:translate-x-0.5 transition-transform whitespace-nowrap shrink-0">
                    체험 →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 바닥 안내 텍스트 */}
      <p className="text-[11px] text-neutral-500 text-center leading-relaxed pt-2 px-2 break-keep">
        * 내 폰의 사진은 외부 서버에 저장되지 않고 로컬에서 안전하게 처리됩니다.
      </p>
    </div>
  );
};
