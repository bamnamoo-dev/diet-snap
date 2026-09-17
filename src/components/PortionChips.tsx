import React, { useState } from 'react';
import { NutritionItem, PortionModifier, StampTemplate, AspectRatio, MealType, HumorMode, StickerId } from '../types/diet';
import { Edit3, Sparkles, SlidersHorizontal, Sun, Moon, Sunrise, Coffee, Pizza, Crown, Tag } from 'lucide-react';
import { EditNutritionModal } from './EditNutritionModal';
import { STICKER_DEFINITIONS } from '../canvas/stickers/drawStickers';
import { TEMPLATES_LIST } from '../canvas/templates/types';

interface PortionChipsProps {
  portion: PortionModifier;
  onPortionChange: (newPortion: PortionModifier) => void;
  nutrition: NutritionItem;
  onNutritionChange: (updated: NutritionItem) => void;
  template: StampTemplate;
  onTemplateChange: (newTemplate: StampTemplate) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (newRatio: AspectRatio) => void;
  isPro?: boolean;
}

export const PortionChips: React.FC<PortionChipsProps> = ({
  portion,
  onPortionChange,
  nutrition,
  onNutritionChange,
  template,
  onTemplateChange,
  aspectRatio,
  onAspectRatioChange,
  isPro = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 끼니 리스트
  const mealTypes: { type: MealType; label: string; icon: any }[] = [
    { type: 'breakfast', label: '아침', icon: Sunrise },
    { type: 'lunch', label: '점심', icon: Sun },
    { type: 'dinner', label: '저녁', icon: Moon },
    { type: 'snack', label: '간식', icon: Coffee },
    { type: 'cheating', label: '치팅', icon: Pizza },
  ];

  // 유머 모드 리스트
  const humorModes: { mode: HumorMode; label: string; badge?: string }[] = [
    { mode: 'none', label: '정상 수치' },
    { mode: 'zero_cal', label: '0 kcal 🤫' },
    { mode: 'cheating', label: '치팅데이 승인 🍕' },
    { mode: 'cardio', label: '공복유산소각 💦' },
  ];


  // 인스타 감성 퀵 스티커 리스트 (6종 기본 + 마스코트 듀오 2종)
  const availableStickers: StickerId[] = [
    'today_done',
    'clean_diet',
    'cheating_day',
    'high_protein',
    'fasting',
    'no_sugar',
    'snappy_cheer',
    'buddy_walk',
  ];

  const handleToggleSticker = (id: StickerId) => {
    const current = portion.stickers || [];
    const exists = current.includes(id);
    const updated = exists ? current.filter((s) => s !== id) : [...current, id];
    onPortionChange({ ...portion, stickers: updated });
  };

  return (
    <div className="w-full space-y-3.5 pt-1 font-sans">
      
      {/* 1. 메뉴명 & 수치 직접 수정 바 */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="truncate">
            <span className="text-xs font-bold text-neutral-100 block truncate">
              {nutrition.name}
            </span>
            <span className="text-[11px] text-neutral-400 whitespace-nowrap">
              기준: {nutrition.calories} kcal ({nutrition.serving_size || '1인분'})
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 border border-neutral-700 transition active:scale-95 shrink-0 whitespace-nowrap"
        >
          <Edit3 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="whitespace-nowrap">수치 수정</span>
        </button>
      </div>

      {/* 수치 상세 편집 모달 */}
      <EditNutritionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        nutrition={nutrition}
        onSave={onNutritionChange}
      />

      {/* 2. 끼니(Meal) 선택 1초 칩 바 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
          <span className="font-semibold text-neutral-300 whitespace-nowrap">끼니 선택:</span>
          <span className="text-neutral-500 text-[10px] whitespace-nowrap">스탬프에 자동 인쇄</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {mealTypes.map(({ type, label, icon: Icon }) => {
            const isSelected = portion.mealType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onPortionChange({ ...portion, mealType: isSelected ? undefined : type })}
                className={`py-1.5 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all active:scale-95 whitespace-nowrap ${
                  isSelected
                    ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                    : 'bg-neutral-900/90 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 치팅데이 / 유머 스탬프 모드 (수치 공포 해결) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
          <span className="font-semibold text-neutral-300 whitespace-nowrap">인스타 방어 모드:</span>
          <span className="text-rose-400 text-[10px] font-medium whitespace-nowrap">고칼로리 위트 방어</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {humorModes.map(({ mode, label }) => {
            const isSelected = (portion.humorMode ?? 'none') === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onPortionChange({ ...portion, humorMode: mode })}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all active:scale-95 text-center flex items-center justify-center whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-md shadow-amber-400/20'
                    : 'bg-neutral-900/90 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
              >
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. 1초 식사량 보정 칩 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
          <span className="flex items-center gap-1 font-semibold text-neutral-300">
            <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
            {nutrition.custom_chips && nutrition.custom_chips.length > 0 ? 'AI 맞춤형 1초 보정 칩' : '1초 양 보정'}
          </span>
          <span className="text-neutral-500 text-[10px]">수치 즉시 반영</span>
        </div>

        {nutrition.custom_chips && nutrition.custom_chips.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {nutrition.custom_chips.map((chip, idx) => {
              const isSelected = portion.activeLabel
                ? portion.activeLabel === chip.label
                : (chip.scale === 1.0 || chip.label.includes('보통') || chip.label.includes('기본'));

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const isSoup = chip.label.includes('국물') || chip.label.includes('국');
                    onPortionChange({
                      ...portion,
                      scale: chip.scale ?? 1.0,
                      excludeSoup: isSoup,
                      activeLabel: chip.label,
                    });
                  }}
                  className={`py-2 px-1.5 text-xs font-semibold rounded-xl border transition-all text-center flex flex-col items-center justify-center min-h-[42px] ${
                    isSelected
                      ? 'bg-neutral-100 text-neutral-950 border-white shadow-md'
                      : 'bg-neutral-900/90 text-neutral-300 border-neutral-800 hover:bg-neutral-850'
                  }`}
                >
                  <span className="truncate max-w-full">{chip.label}</span>
                  {chip.scale && chip.scale !== 1.0 && (
                    <span className="text-[10px] opacity-75 font-mono">
                      ({chip.scale > 1 ? `+${Math.round((chip.scale - 1) * 100)}%` : `-${Math.round((1 - chip.scale) * 100)}%`})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => onPortionChange({ ...portion, scale: 0.8, activeLabel: '소 (0.8x)' })}
              className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all text-center ${
                portion.scale === 0.8
                  ? 'bg-neutral-100 text-neutral-950 border-white shadow-md'
                  : 'bg-neutral-900/90 text-neutral-300 border-neutral-800 hover:bg-neutral-850'
              }`}
            >
              소 <span className="text-[10px] opacity-75">(0.8x)</span>
            </button>

            <button
              type="button"
              onClick={() => onPortionChange({ ...portion, scale: 1.0, activeLabel: '보통 (1.0x)' })}
              className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all text-center ${
                portion.scale === 1.0 && !portion.excludeSoup
                  ? 'bg-neutral-100 text-neutral-950 border-white shadow-md'
                  : 'bg-neutral-900/90 text-neutral-300 border-neutral-800 hover:bg-neutral-850'
              }`}
            >
              보통 <span className="text-[10px] opacity-75">(1.0x)</span>
            </button>

            <button
              type="button"
              onClick={() => onPortionChange({ ...portion, scale: 1.3, activeLabel: '곱빼기 (1.3x)' })}
              className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all text-center ${
                portion.scale === 1.3
                  ? 'bg-neutral-100 text-neutral-950 border-white shadow-md'
                  : 'bg-neutral-900/90 text-neutral-300 border-neutral-800 hover:bg-neutral-850'
              }`}
            >
              곱빼기 <span className="text-[10px] opacity-75">(1.3x)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onPortionChange({
                  ...portion,
                  excludeSoup: !portion.excludeSoup,
                  activeLabel: !portion.excludeSoup ? '국물제외 (-15%)' : undefined,
                })
              }
              className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all text-center ${
                portion.excludeSoup
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-neutral-900/90 text-neutral-400 border-neutral-800 hover:bg-neutral-850'
              }`}
            >
              국물제외 <span className="text-[10px] opacity-80">(-15%)</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. 템플릿 선택기 (6종) */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
          <span className="font-semibold text-neutral-300 whitespace-nowrap">스탬프 템플릿 (6종):</span>
          <span className="text-amber-400 text-[10px] font-medium flex items-center gap-0.5 whitespace-nowrap">
            <Crown className="w-3 h-3 shrink-0" /> Pro 한정판 포함
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {TEMPLATES_LIST.map((tpl) => {
            const isSelected = template === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onTemplateChange(tpl.id)}
                className={`py-2 px-1.5 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1 active:scale-95 whitespace-nowrap ${
                  isSelected
                    ? 'bg-neutral-100 text-neutral-950 border-white shadow-md'
                    : 'bg-neutral-900/90 text-neutral-300 border-neutral-800 hover:bg-neutral-850'
                }`}
              >
                <span className="truncate">{tpl.emoji} {tpl.name}</span>
                {tpl.isPro && (
                  <span className="text-[8px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono shrink-0">
                    PRO
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. 인스타 감성 퀵 스티커 데코 바 (원터치 부착) */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
          <span className="flex items-center gap-1 font-semibold text-neutral-300">
            <Tag className="w-3 h-3 text-rose-400" />
            인스타 데코 스티커:
          </span>
          <span className="text-neutral-500 text-[10px]">다중 선택 가능</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {availableStickers.map((id) => {
            const meta = STICKER_DEFINITIONS[id];
            const isChecked = (portion.stickers || []).includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleToggleSticker(id)}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all active:scale-95 flex items-center justify-center gap-0.5 whitespace-nowrap ${
                  isChecked
                    ? 'bg-neutral-800 text-white border-rose-500 shadow-md ring-1 ring-rose-500/50'
                    : 'bg-neutral-900/90 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
              >
                <span>{meta.emoji}</span>
                <span className="truncate">{meta.label}</span>
                {isChecked && <span className="text-rose-400 text-[10px]">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. 인스타 비율 스위처 (9:16 vs 1:1) */}
      <div className="bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800 flex items-center gap-1.5">
        <button
          onClick={() => onAspectRatioChange('9:16')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
            aspectRatio === '9:16'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          📱 9:16 인스타 스토리
        </button>
        <button
          onClick={() => onAspectRatioChange('1:1')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
            aspectRatio === '1:1'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          🖼️ 1:1 인스타 피드
        </button>
      </div>
    </div>
  );
};
