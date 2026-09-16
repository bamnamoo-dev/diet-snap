import React, { useState, useEffect } from 'react';
import { NutritionItem, MealType } from '../types/diet';
import { X, Check, Flame, Utensils } from 'lucide-react';

interface EditNutritionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nutrition: NutritionItem;
  mealType?: MealType;
  onSave: (updated: NutritionItem, updatedMealType?: MealType) => void;
}

const MEAL_OPTIONS: { id: MealType; label: string; icon: string }[] = [
  { id: 'breakfast', label: '아침', icon: '🌅' },
  { id: 'lunch', label: '점심', icon: '☀️' },
  { id: 'dinner', label: '저녁', icon: '🌙' },
  { id: 'snack', label: '간식', icon: '🍪' },
  { id: 'cheating', label: '치팅', icon: '🍕' },
];

export const EditNutritionModal: React.FC<EditNutritionModalProps> = ({
  isOpen,
  onClose,
  nutrition,
  mealType = 'lunch',
  onSave,
}) => {
  const [form, setForm] = useState<NutritionItem>({ ...nutrition });
  const [selectedMeal, setSelectedMeal] = useState<MealType>(mealType);

  useEffect(() => {
    setForm({ ...nutrition });
    setSelectedMeal(mealType);
  }, [nutrition, mealType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        ...form,
        calories: Number(form.calories) || 0,
        carbs: Number(form.carbs) || 0,
        protein: Number(form.protein) || 0,
        fat: Number(form.fat) || 0,
      },
      selectedMeal
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#18181b] border border-neutral-800 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-white">식단 상세 수치 직접 수정</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 입력창 */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* 🍽️ 끼니 분류 선택 (아침, 점심, 저녁, 간식, 치팅) */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 block mb-1.5 flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5 text-rose-400" />
              <span>끼니 분류</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {MEAL_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedMeal(opt.id)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 border ${
                    selectedMeal === opt.id
                      ? 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white border-rose-400 shadow-md shadow-rose-500/25 scale-[1.02]'
                      : 'bg-neutral-900 border-neutral-750 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600'
                  }`}
                >
                  <span className="text-sm">{opt.icon}</span>
                  <span className="text-[11px]">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-400 block mb-1">메뉴명</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-emerald-400"
              placeholder="예: 바나나 (1개)"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-neutral-400 block mb-1">총 칼로리 (kcal)</label>
              <input
                type="number"
                value={form.calories}
                onChange={(e) => setForm({ ...form, calories: Number(e.target.value) })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-rose-400 font-bold focus:outline-none focus:border-rose-400"
                placeholder="100"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400 block mb-1">추정 중량 / 단위</label>
              <input
                type="text"
                value={form.serving_size}
                onChange={(e) => setForm({ ...form, serving_size: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-400"
                placeholder="1개 (약 100g)"
              />
            </div>
          </div>

          {/* 탄단지 */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-blue-400 block mb-1">탄수화물 (g)</label>
              <input
                type="number"
                value={form.carbs}
                onChange={(e) => setForm({ ...form, carbs: Number(e.target.value) })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-2.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-emerald-400 block mb-1">단백질 (g)</label>
              <input
                type="number"
                value={form.protein}
                onChange={(e) => setForm({ ...form, protein: Number(e.target.value) })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-2.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-amber-400 block mb-1">지방 (g)</label>
              <input
                type="number"
                value={form.fat}
                onChange={(e) => setForm({ ...form, fat: Number(e.target.value) })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-2.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-400 block mb-1">인스타 감성 한 줄 평</label>
            <input
              type="text"
              value={form.diet_comment}
              onChange={(e) => setForm({ ...form, diet_comment: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-emerald-400"
              placeholder="위트 있는 한 줄 평"
            />
          </div>

          {/* 저장 버튼 */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
            >
              <Check className="w-4 h-4" /> 캔버스에 즉시 반영하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
