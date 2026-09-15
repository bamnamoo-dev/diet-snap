import React, { useState } from 'react';
import { NutritionItem, PortionModifier, StampTemplate, AspectRatio } from '../types/diet';
import { Edit3, Sparkles, SlidersHorizontal } from 'lucide-react';
import { EditNutritionModal } from './EditNutritionModal';

interface PortionChipsProps {
  portion: PortionModifier;
  onPortionChange: (newPortion: PortionModifier) => void;
  nutrition: NutritionItem;
  onNutritionChange: (updated: NutritionItem) => void;
  template: StampTemplate;
  onTemplateChange: (newTemplate: StampTemplate) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (newRatio: AspectRatio) => void;
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
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-full space-y-4 pt-2">
      {/* 1. 메뉴명 & 수치 직접 수정 바 */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="truncate">
            <span className="text-sm font-semibold text-neutral-100 block truncate">
              {nutrition.name}
            </span>
            <span className="text-[11px] text-neutral-400">
              기준: {nutrition.calories} kcal ({nutrition.serving_size || '1인분'})
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 bg-neutral-800 text-emerald-400 hover:text-emerald-300 font-semibold text-xs rounded-lg flex items-center gap-1.5 border border-neutral-700 hover:bg-neutral-700 transition active:scale-95 shrink-0"
        >
          <Edit3 className="w-3.5 h-3.5" /> 수치 수정
        </button>
      </div>

      {/* 수치 상세 편집 모달 */}
      <EditNutritionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        nutrition={nutrition}
        onSave={onNutritionChange}
      />

      {/* 2. 1초 보정 칩 (음식 맞춤형 AI 연동 칩 또는 기본 양 조절) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span className="flex items-center gap-1 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" /> 
            {nutrition.custom_chips && nutrition.custom_chips.length > 0 ? 'AI 맞춤형 1초 보정 칩' : '1초 식사량 보정'}
          </span>
          <span className="text-neutral-500">수치 즉시 반영</span>
        </div>

        {nutrition.custom_chips && nutrition.custom_chips.length > 0 ? (
          /* 음식 맞춤형 연동 칩 목록 */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                  className={`py-2 px-1.5 text-xs font-semibold rounded-xl border transition-all text-center flex flex-col items-center justify-center min-h-[44px] ${
                    isSelected
                      ? 'bg-neutral-100 text-neutral-950 border-white shadow-lg'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
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
          /* 기본 4개 보정 칩 폴백 */
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => onPortionChange({ ...portion, scale: 0.8, activeLabel: '소 (0.8x)' })}
              className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all text-center ${
                portion.scale === 0.8
                  ? 'bg-neutral-100 text-neutral-950 border-white shadow-lg'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              소 <span className="text-[10px] opacity-75">(0.8x)</span>
            </button>

            <button
              type="button"
              onClick={() => onPortionChange({ ...portion, scale: 1.0, activeLabel: '보통 (1.0x)' })}
              className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all text-center ${
                portion.scale === 1.0 && !portion.excludeSoup
                  ? 'bg-neutral-100 text-neutral-950 border-white shadow-lg'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              보통 <span className="text-[10px] opacity-75">(1.0x)</span>
            </button>

            <button
              type="button"
              onClick={() => onPortionChange({ ...portion, scale: 1.3, activeLabel: '곱빼기 (1.3x)' })}
              className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all text-center ${
                portion.scale === 1.3
                  ? 'bg-neutral-100 text-neutral-950 border-white shadow-lg'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
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
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              국물제외 <span className="text-[10px] opacity-80">(-15%)</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. 템플릿 & 비율 스위처 */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {/* 템플릿 선택 */}
        <div className="bg-neutral-900 p-1.5 rounded-xl border border-neutral-800 flex items-center">
          <button
            onClick={() => onTemplateChange('receipt')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              template === 'receipt'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            🧾 영수증 룩
          </button>
          <button
            onClick={() => onTemplateChange('polaroid')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              template === 'polaroid'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            📷 폴라로이드
          </button>
        </div>

        {/* 비율 선택 */}
        <div className="bg-neutral-900 p-1.5 rounded-xl border border-neutral-800 flex items-center">
          <button
            onClick={() => onAspectRatioChange('9:16')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              aspectRatio === '9:16'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            9:16 스토리
          </button>
          <button
            onClick={() => onAspectRatioChange('1:1')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              aspectRatio === '1:1'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            1:1 정방형
          </button>
        </div>
      </div>
    </div>
  );
};
