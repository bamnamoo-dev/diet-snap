import React, { useState } from 'react';
import { X, Check, Sparkles, Crown, Zap, ShieldCheck } from 'lucide-react';
import { getUserPlan, setUserPlan } from '../utils/subscription';
import { UserPlan } from '../types/diet';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanChanged?: (newPlan: UserPlan) => void;
}

export const ProModal: React.FC<ProModalProps> = ({ isOpen, onClose, onPlanChanged }) => {
  const [selectedTier, setSelectedTier] = useState<'yearly' | 'monthly'>('yearly');
  const currentPlan = getUserPlan();

  if (!isOpen) return null;

  const handleTogglePlan = (targetPlan: UserPlan) => {
    setUserPlan(targetPlan);
    if (onPlanChanged) onPlanChanged(targetPlan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-sm bg-[#16171b] border border-white/10 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 우측 상단 닫기 */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 상단 헤더 */}
        <div className="text-center pt-2 pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3 tracking-wider">
            <Crown className="w-3.5 h-3.5" /> DIETSNAP PRO
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-1">
            식단 기록의 품격을 높이세요
          </h2>
          <p className="text-xs text-zinc-400">
            하루 15장 넉넉한 기록과 워터마크 제거, 전용 리포트까지
          </p>
        </div>

        {/* 요금제 카드 선택 (연간 vs 월간) */}
        <div className="space-y-3 my-4">
          {/* 1년 정기권 (BEST) */}
          <div 
            onClick={() => setSelectedTier('yearly')}
            className={`cursor-pointer relative p-4 rounded-2xl border transition-all ${
              selectedTier === 'yearly'
                ? 'bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-900/60 border-white/5 hover:border-white/20'
            }`}
          >
            <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
              BEST 54% 할인
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>1년 정기권</span>
                  <span className="text-[11px] text-amber-400 font-medium">(월 458원 꼴)</span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">커피 한 잔 값으로 1년 내내 넉넉하게</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-amber-300">연 5,500원</div>
                <div className="text-[10px] text-zinc-500 line-through">11,880원</div>
              </div>
            </div>
          </div>

          {/* 1개월 정기구독 */}
          <div 
            onClick={() => setSelectedTier('monthly')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              selectedTier === 'monthly'
                ? 'bg-gradient-to-br from-white/10 to-transparent border-white/40'
                : 'bg-zinc-900/60 border-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">1개월 정기구독</div>
                <div className="text-xs text-zinc-400 mt-0.5">부담 없이 가볍게 시작하는 1달</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-white">월 990원</div>
                <div className="text-[10px] text-zinc-400">언제든 해지 가능</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pro 핵심 혜택 리스트 */}
        <div className="bg-black/30 rounded-2xl p-3.5 border border-white/5 my-4 space-y-2.5 text-xs">
          <div className="flex items-center gap-2.5 text-zinc-300">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span><strong>매일 15장</strong> 즉시 충전 (간식·커피·야식까지 여유)</span>
          </div>
          <div className="flex items-center gap-2.5 text-zinc-300">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span><strong>DietSnap 워터마크 100% 완전 제거</strong> (클린 룩)</span>
          </div>
          <div className="flex items-center gap-2.5 text-zinc-300">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span><strong>PT/필라테스 쌤 제출용 보고서</strong> 무제한 발행</span>
          </div>
          <div className="flex items-center gap-2.5 text-zinc-300">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span><strong>주간 오식완 롱 영수증</strong> 인스타 결산 템플릿 제공</span>
          </div>
          <div className="flex items-center gap-2.5 text-zinc-300">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span>4대 감성 템플릿 및 <strong>치팅/0 kcal 유머 모드</strong> 무제한</span>
          </div>
        </div>

        {/* 결제 및 테스트 스위처 버튼 */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => handleTogglePlan('pro')}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            {selectedTier === 'yearly' ? '연 5,500원으로 시작하기 (BEST)' : '월 990원으로 시작하기'}
          </button>

          {/* 테스트/체험용 스위처 (실기기 테스트 시 원클릭 전환) */}
          <div className="pt-2 text-center">
            {currentPlan === 'pro' ? (
              <button
                onClick={() => handleTogglePlan('free')}
                className="text-[11px] text-zinc-500 underline hover:text-zinc-300 transition"
              >
                [테스트용] 현재 Pro 활성 상태 ➔ 무료 모드로 전환하기
              </button>
            ) : (
              <button
                onClick={() => handleTogglePlan('pro')}
                className="text-[11px] text-zinc-500 underline hover:text-zinc-300 transition"
              >
                [테스트용] 결제 없이 Pro 기능 즉시 체험 활성화
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-3 text-[10px] text-zinc-600 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-zinc-500" />
          언제든 계정 관리에서 자유롭게 해지할 수 있습니다.
        </div>
      </div>
    </div>
  );
};
