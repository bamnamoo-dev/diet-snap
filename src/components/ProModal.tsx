import React, { useState } from 'react';
import { X, Check, Sparkles, Crown, ShieldCheck } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-[365px] bg-[#16171b] border border-white/10 rounded-3xl p-5 sm:p-6 text-white shadow-2xl relative overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 우측 상단 닫기 */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-full bg-white/5 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 상단 헤더 */}
        <div className="text-center pt-1 pb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold mb-2 tracking-wider whitespace-nowrap">
            <Crown className="w-3.5 h-3.5 shrink-0" /> DIETSNAP PRO
          </div>
          <h2 className="text-xl font-black tracking-tight text-white mb-1 whitespace-nowrap">
            식단 기록의 품격을 높이세요
          </h2>
          <p className="text-xs text-zinc-400 whitespace-nowrap">
            매일 15장 넉넉한 기록과 워터마크 제거까지
          </p>
        </div>

        {/* 요금제 카드 선택 (연간 vs 월간) */}
        <div className="space-y-2.5 my-3">
          {/* 1년 정기권 (BEST) */}
          <div 
            onClick={() => setSelectedTier('yearly')}
            className={`cursor-pointer relative p-3.5 rounded-2xl border transition-all ${
              selectedTier === 'yearly'
                ? 'bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-900/60 border-white/5 hover:border-white/20'
            }`}
          >
            <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
              BEST 54% 할인
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="text-sm font-bold text-white">1년 정기권</span>
                  <span className="text-[10px] text-amber-400 font-semibold">(월 458원 꼴)</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5 whitespace-nowrap">
                  커피 한 잔 값으로 1년 내내 여유롭게
                </div>
              </div>
              <div className="text-right shrink-0 whitespace-nowrap">
                <div className="text-base font-black text-amber-300 font-mono">연 5,500원</div>
                <div className="text-[10px] text-zinc-500 line-through font-mono">11,880원</div>
              </div>
            </div>
          </div>

          {/* 1개월 정기구독 */}
          <div 
            onClick={() => setSelectedTier('monthly')}
            className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
              selectedTier === 'monthly'
                ? 'bg-gradient-to-br from-white/10 to-transparent border-white/40'
                : 'bg-zinc-900/60 border-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-bold text-white whitespace-nowrap">1개월 정기구독</div>
                <div className="text-[11px] text-zinc-400 mt-0.5 whitespace-nowrap">부담 없이 가볍게 시작하는 1달</div>
              </div>
              <div className="text-right shrink-0 whitespace-nowrap">
                <div className="text-base font-black text-white font-mono">월 990원</div>
                <div className="text-[10px] text-zinc-400 whitespace-nowrap">언제든 해지 가능</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pro 핵심 혜택 리스트 */}
        <div className="bg-black/35 rounded-2xl p-3 border border-white/5 my-3 space-y-2 text-[11px]">
          <div className="flex items-center gap-2 text-zinc-300">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span className="whitespace-nowrap"><strong className="text-white">매일 15장</strong> 충전 (간식·커피까지 여유)</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span className="whitespace-nowrap"><strong className="text-white">워터마크 100% 제거</strong> (깔끔한 인스타 룩)</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span className="whitespace-nowrap"><strong className="text-white">트레이너 쌤 제출용 식단표</strong> 무제한</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span className="whitespace-nowrap"><strong className="text-white">주간 오식완 롱 영수증</strong> 결산 리포트</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span className="whitespace-nowrap">4대 감성 템플릿 & <strong className="text-white">치팅/유머 모드</strong> 무제한</span>
          </div>
        </div>

        {/* 결제 및 테스트 스위처 버튼 */}
        <div className="space-y-2 pt-0.5">
          <button
            onClick={() => handleTogglePlan('pro')}
            className="w-full py-3 px-3 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 fill-black shrink-0" />
            <span className="whitespace-nowrap">{selectedTier === 'yearly' ? '연 5,500원으로 시작하기' : '월 990원으로 시작하기'}</span>
          </button>

          {/* 테스트/체험용 스위처 (원클릭 전환) */}
          <div className="pt-1 text-center">
            {currentPlan === 'pro' ? (
              <button
                onClick={() => handleTogglePlan('free')}
                className="text-[11px] text-zinc-500 underline hover:text-zinc-300 transition whitespace-nowrap"
              >
                [체험 모드] 무료 모드로 전환하기
              </button>
            ) : (
              <button
                onClick={() => handleTogglePlan('pro')}
                className="text-[11px] text-zinc-500 underline hover:text-zinc-300 transition whitespace-nowrap"
              >
                [체험 모드] 결제 없이 Pro 즉시 체험하기
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-2.5 text-[10px] text-zinc-500 flex items-center justify-center gap-1 whitespace-nowrap">
          <ShieldCheck className="w-3 h-3 text-zinc-500 shrink-0" />
          <span>언제든 계정 관리에서 자유롭게 해지할 수 있습니다.</span>
        </div>
      </div>
    </div>
  );
};
