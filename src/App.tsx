import React, { useState, useRef, useEffect } from 'react';
import { NutritionItem, PortionModifier, StampTemplate, AspectRatio } from './types/diet';
import { compressImage, CompressionResult } from './utils/compressImage';
import { StampCanvas } from './components/StampCanvas';
import { PortionChips } from './components/PortionChips';
import { 
  Camera, 
  Upload, 
  Download, 
  Share2, 
  Zap, 
  Sparkles, 
  Crown, 
  CheckCircle2, 
  RefreshCw,
  Maximize2,
  ArrowLeft 
} from 'lucide-react';
import { IntroView, PresetItem } from './components/IntroView';

// 초기 데모용 프리셋 식단 데이터
const SAMPLE_PRESETS: { name: string; img: string; data: NutritionItem }[] = [
  {
    name: '🍱 학교 급식 식판',
    img: 'https://images.unsplash.com/photo-1547496502-affa22d38842?w=800&auto=format&fit=crop&q=80',
    data: {
      name: '제육볶음 급식 식판 (5찬+국)',
      serving_size: '식판 1인분 (약 550g)',
      calories: 780,
      carbs: 98,
      protein: 42,
      fat: 22,
      diet_comment: '오식완! 고단백 급식으로 갓생 채우기 🍱',
      custom_chips: [
        { label: '초등 급식', scale: 0.8 },
        { label: '중고등 (기본)', scale: 1.0 },
        { label: '성인 구내식당', scale: 1.2 },
        { label: '국물 제외', scale: 0.85 },
      ],
    },
  },
  {
    name: '제육볶음 & 현미밥',
    img: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&auto=format&fit=crop&q=80',
    data: {
      name: '제육볶음과 현미밥',
      serving_size: '1인분 (약 380g)',
      calories: 640,
      carbs: 72,
      protein: 36,
      fat: 20,
      diet_comment: '단백질 든든! 완벽한 점심 식단 ✨',
      custom_chips: [
        { label: '소식 (0.8x)', scale: 0.8 },
        { label: '보통 (1.0x)', scale: 1.0 },
        { label: '곱빼기 (1.3x)', scale: 1.3 },
        { label: '국물 제외', scale: 0.85 },
      ],
    },
  },
  {
    name: '연어 아보카도 포케',
    img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
    data: {
      name: '생연어 아보카도 포케',
      serving_size: '1인분 (약 320g)',
      calories: 490,
      carbs: 48,
      protein: 32,
      fat: 16,
      diet_comment: '클린 식단의 정석! 갓생 인정 🥗',
      custom_chips: [
        { label: '기본 (1.0x)', scale: 1.0 },
        { label: '드레싱 뺌', scale: 0.75 },
        { label: '밥 반공기', scale: 0.8 },
        { label: '연어 추가', scale: 1.3 },
      ],
    },
  },
  {
    name: '마라탕 & 꿔바로우',
    img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
    data: {
      name: '마라탕 (보통맛)',
      serving_size: '1그릇 (약 550g)',
      calories: 820,
      carbs: 95,
      protein: 26,
      fat: 34,
      diet_comment: '행복하게 먹고 내일 공복 유산소 고! 💦',
      custom_chips: [
        { label: '보통 (1.0x)', scale: 1.0 },
        { label: '국물 안 먹음', scale: 0.7 },
        { label: '소고기 추가', scale: 1.25 },
        { label: '야채 위주', scale: 0.8 },
      ],
    },
  },
];

export const App: React.FC = () => {
  // 상태 관리 (LocalStorage에서 이전 식단 자동 복원)
  const [imageSrc, setImageSrc] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('dietsnap_current_img');
      return saved || SAMPLE_PRESETS[0].img;
    } catch {
      return SAMPLE_PRESETS[0].img;
    }
  });

  const [nutrition, setNutrition] = useState<NutritionItem>(() => {
    try {
      const saved = localStorage.getItem('dietsnap_current_data');
      return saved ? JSON.parse(saved) : SAMPLE_PRESETS[0].data;
    } catch {
      return SAMPLE_PRESETS[0].data;
    }
  });

  const [portion, setPortion] = useState<PortionModifier>(() => {
    try {
      const saved = localStorage.getItem('dietsnap_current_portion');
      return saved ? JSON.parse(saved) : { scale: 1.0, excludeSoup: false };
    } catch {
      return { scale: 1.0, excludeSoup: false };
    }
  });

  const [template, setTemplate] = useState<StampTemplate>('polaroid');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [isPro, setIsPro] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [compressStats, setCompressStats] = useState<CompressionResult | null>(null);

  // 화면 모드: 'intro' (첫 인트로 뷰파인더 화면) | 'editor' (스탬프 편집/저장 화면)
  const [currentView, setCurrentView] = useState<'intro' | 'editor'>('intro');
  const [hasSavedWork, setHasSavedWork] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('dietsnap_current_img'));
    } catch {
      return false;
    }
  });

  // 데이터 변경 시 로컬에 자동 영구 보관 (새로고침 방어)
  useEffect(() => {
    try {
      if (imageSrc && !imageSrc.startsWith('blob:')) {
        localStorage.setItem('dietsnap_current_img', imageSrc);
        setHasSavedWork(true);
      }
      localStorage.setItem('dietsnap_current_data', JSON.stringify(nutrition));
      localStorage.setItem('dietsnap_current_portion', JSON.stringify(portion));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [imageSrc, nutrition, portion]);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);

  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCameraRef = useRef<boolean>(false);

  // 카메라 촬영 및 갤러리 파일 선택 트리거 헬퍼
  const handleTriggerCapture = () => {
    isCameraRef.current = true;
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  const handleTriggerGallery = () => {
    isCameraRef.current = false;
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
      galleryInputRef.current.click();
    }
  };

  // 1. 사진 업로드 및 1024px 클라이언트 압축 후 실제 Gemini AI 분석 호출
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMessage(null);
      setIsAnalyzing(true);
      setCurrentView('editor'); // 촬영/선택 즉시 에디터 화면으로 전환하여 분석 표시

      // ✨ 1. 내 폰 화면 및 저장 캔버스용: 원본 고화질(Original) 그대로 적용 (자동 다운로드 팝업 방지)
      const originalObjectUrl = URL.createObjectURL(file);
      setImageSrc(originalObjectUrl);

      setStatusMessage('사진 최적화 중...');

      // 🚀 2. 구글 API 전송용: 디테일(양념, 김치 조각, 밥알 질감) 정밀 식별을 위해 1536px 고화질 압축본 생성
      const compressed = await compressImage(file, 1536, 0.88);
      setCompressStats(compressed);

      try {
        localStorage.setItem('dietsnap_current_img', compressed.dataUrl);
      } catch (e) {
        console.warn('Backup save failed', e);
      }

      setStatusMessage('AI 분석 중...');

      // 3. 실제 Gemini AI 백엔드 라우트 호출 (/api/analyze)
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: compressed.dataUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 응답 오류 (${response.status})`);
      }

      const aiResult: NutritionItem = await response.json();
      setNutrition(aiResult);
      setPortion({ scale: 1.0, excludeSoup: false });
      setStatusMessage('✨ 분석 완료! 인스타 스토리 공유 또는 저장해보세요');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(err.message || '식단 분석에 실패했습니다.');
    } finally {
      setIsAnalyzing(false);
      if (e.target) e.target.value = '';
    }
  };

  // 2. 프리셋 식단 변경
  const handleSelectPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setImageSrc(preset.img);
    setNutrition(preset.data);
    setPortion({ scale: 1.0, excludeSoup: false });
    setCompressStats(null);
    setCurrentView('editor'); // 프리셋 선택 시 바로 편집기 화면으로 전환
  };

  // 3. 고화질 JPG 다운로드
  const handleDownload = () => {
    const canvas = canvasElementRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `DietSnap_${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  // 4. 인스타그램 스토리 공유 (Web Share API 연동)
  const handleShare = async () => {
    const canvas = canvasElementRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], 'dietsnap-story.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'DietSnap 오식완',
            text: `${nutrition.name} 오식완 완료! ✨`,
          });
        } catch (err) {
          console.log('Share canceled or failed', err);
        }
      } else {
        // Web Share 미지원 시 바로 다운로드로 친절히 대체
        handleDownload();
        alert('이미지가 저장되었습니다! 인스타그램 스토리에서 사진을 불러와 공유해보세요 ✨');
      }
    }, 'image/jpeg', 0.95);
  };

  // 5. 모바일 전체화면 토글
  const [isFullscreen, setIsFullscreen] = useState(false);
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] text-neutral-100 flex flex-col items-center justify-start pb-24 font-sans">
      {/* 1) 카메라 즉시 촬영 전용 숨김 인풋 (capture="environment") */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 2) 갤러리/앨범 선택 전용 숨김 인풋 (capture 없음) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 상단 네비게이션 헤더 */}
      <header className="w-full max-w-md px-4 py-3 border-b border-neutral-800/80 sticky top-0 bg-[#0d0e12]/90 backdrop-blur-md z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* 에디터 모드일 때: 인트로(새 촬영)로 돌아가기 버튼 */}
          {currentView === 'editor' ? (
            <button
              onClick={() => setCurrentView('intro')}
              className="py-1 px-2.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 hover:text-white transition active:scale-95 flex items-center gap-1.5 shadow-sm"
              title="새 촬영으로 돌아가기"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-300" />
              <span className="text-xs font-semibold pr-0.5">새 촬영</span>
            </button>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center shadow-md shadow-rose-500/20">
              <Camera className="w-4 h-4 text-white" />
            </div>
          )}

          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              DietSnap <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">v1.0</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* ⛶ 전체화면 전환 버튼 */}
          <button
            onClick={handleToggleFullscreen}
            title="전체화면 전환"
            className="p-1.5 rounded-lg bg-neutral-800/90 text-neutral-300 border border-neutral-700 hover:text-white transition active:scale-95"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* 3,300원 Pro 워터마크 제거 토글 */}
          <button
            onClick={() => setIsPro(!isPro)}
            className={`text-xs px-2.5 py-1.5 rounded-full font-semibold flex items-center gap-1 transition-all ${
              isPro
                ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
                : 'bg-neutral-800/90 text-neutral-300 border border-neutral-700 hover:border-amber-400/50'
            }`}
          >
            <Crown className={`w-3.5 h-3.5 ${isPro ? 'text-neutral-950' : 'text-amber-400'}`} />
            {isPro ? 'PRO' : '3,300원'}
          </button>
        </div>
      </header>

      {/* 화면 모드별 뷰 렌더링 */}
      {currentView === 'intro' ? (
        /* 1. 첫 인트로 화면 (뷰파인더 & 즉시 촬영 & 1초 체험) */
        <IntroView
          onCaptureClick={handleTriggerCapture}
          onGalleryClick={handleTriggerGallery}
          onSelectPreset={handleSelectPreset}
          presets={SAMPLE_PRESETS}
          hasSavedWork={hasSavedWork}
          onResumeWork={() => setCurrentView('editor')}
        />
      ) : (
        /* 2. 에디터 화면 (스탬프 캔버스 & 1초 보정 칩 & 공유/저장) */
        <main className="w-full max-w-md px-4 pt-4 flex flex-col items-center gap-4">
          {/* 압축 통계 뱃지 */}
          {compressStats && (
            <div className="w-full bg-emerald-950/40 border border-emerald-800/50 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-emerald-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> 초고속 이미지 최적화 완료
              </span>
              <span className="font-mono text-neutral-300">
                {compressStats.originalSizeKB}KB ➔ <b className="text-emerald-400">{compressStats.compressedSizeKB}KB</b> (-{Math.round((1 - compressStats.compressedSizeKB / compressStats.originalSizeKB) * 100)}%)
              </span>
            </div>
          )}

          {/* 빠른 테스트용 프리셋 칩 */}
          <div className="w-full flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] text-neutral-500 font-medium shrink-0">다른 예시:</span>
            {SAMPLE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset)}
                className="text-xs px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-neutral-300 shrink-0 transition active:scale-95"
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* 알림 토스트 */}
          {statusMessage && !isAnalyzing && (
            <div className="w-full bg-emerald-950/60 border border-emerald-500/50 rounded-xl px-3 py-2.5 text-xs text-emerald-300 font-semibold flex items-center justify-center gap-2 shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {statusMessage}
            </div>
          )}

          {/* 캔버스 스탬프 뷰어 영역 */}
          <div className="relative w-full">
            {isAnalyzing && (
              <div className="absolute inset-0 z-20 bg-neutral-950/75 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-rose-400 animate-spin" />
                <div className="text-center px-4">
                  <p className="text-sm font-bold text-white">
                    {statusMessage || 'AI 분석 중...'}
                  </p>
                  <p className="text-xs text-neutral-400 pt-1">
                    1.5초 만에 칼로리 & 탄단지 명세서 발행 중
                  </p>
                </div>
              </div>
            )}

            <StampCanvas
              imageSrc={imageSrc}
              nutrition={nutrition}
              portion={portion}
              template={template}
              aspectRatio={aspectRatio}
              isPro={isPro}
              onCanvasReady={(canvas) => {
                canvasElementRef.current = canvas;
              }}
            />
          </div>

          {/* 1초 보정 칩 & 수치 직접 수정 인터랙션 */}
          <PortionChips
            portion={portion}
            onPortionChange={setPortion}
            nutrition={nutrition}
            onNutritionChange={(updated) => setNutrition(updated)}
            template={template}
            onTemplateChange={setTemplate}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
          />

          {/* 에러 발생 시 안내 배너 */}
          {errorMessage && (
            <div className="w-full bg-rose-950/60 border border-rose-800 rounded-xl p-3 text-xs text-rose-300 flex items-start justify-between">
              <div>
                <p className="font-bold">⚠️ 분석 오류 발생</p>
                <p className="pt-0.5 opacity-90">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-white px-1.5 py-0.5 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* 하단 핵심 액션 버튼 바 */}
          <div className="w-full space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2">
              {/* 1. 즉시 카메라 촬영 버튼 */}
              <button
                onClick={handleTriggerCapture}
                className="py-3 px-3 bg-neutral-100 hover:bg-white text-neutral-950 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition active:scale-[0.98]"
              >
                <Camera className="w-4 h-4 text-neutral-950" />
                다시 촬영
              </button>

              {/* 2. 갤러리 앨범 선택 버튼 */}
              <button
                onClick={handleTriggerGallery}
                className="py-3 px-3 bg-neutral-850 hover:bg-neutral-800 text-neutral-200 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-neutral-750 shadow-md transition active:scale-[0.98]"
              >
                <Upload className="w-4 h-4 text-neutral-400" />
                앨범에서 선택
              </button>
            </div>

            {/* 3. 인스타그램 스토리 공유 버튼 */}
            <button
              onClick={handleShare}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:opacity-95 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 transition active:scale-[0.98]"
            >
              <Share2 className="w-4 h-4" />
              인스타 스토리 즉시 공유
            </button>
          </div>

          {/* JPG 파일 직접 다운로드 링크 */}
          <button
            onClick={handleDownload}
            className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1 pt-1 underline underline-offset-4"
          >
            <Download className="w-3.5 h-3.5" /> 고해상도 JPG 파일로 직접 저장하기
          </button>

          {/* 안내 및 면책 조항 */}
          <p className="text-[11px] text-neutral-500 text-center leading-relaxed pt-3 px-2">
            * 분석된 영양 정보는 식약처 기준 AI 추정치이며 실제 조리법에 따라 오차가 있을 수 있습니다.
          </p>
        </main>
      )}
    </div>
  );
};
