import React, { useState, useRef, useEffect } from 'react';
import { NutritionItem, PortionModifier, StampTemplate, AspectRatio } from './types/diet';
import { compressImage, CompressionResult } from './utils/compressImage';
import { StampCanvas } from './components/StampCanvas';
import { PortionChips } from './components/PortionChips';
import { IntroView, PresetItem } from './components/IntroView';
import { GalleryView } from './components/GalleryView';
import { 
  SavedDietRecord, 
  getAllDietRecords, 
  saveDietRecord, 
  deleteDietRecord 
} from './utils/dietStorage';
import { 
  Camera, 
  Upload, 
  Download, 
  Share2, 
  Zap, 
  Crown, 
  CheckCircle2, 
  RefreshCw,
  Maximize2,
  ArrowLeft,
  BookOpen
} from 'lucide-react';

// 초기 데모용 프리셋 식단 데이터 (실제 사진과 100% 일치하는 식단 세트)
const SAMPLE_PRESETS: { name: string; img: string; data: NutritionItem }[] = [
  {
    name: '🥗 닭가슴살 샐러드볼',
    img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
    data: {
      name: '닭가슴살 아보카도 샐러드볼',
      serving_size: '1그릇 (약 320g)',
      calories: 420,
      carbs: 35,
      protein: 32,
      fat: 14,
      diet_comment: '클린 식단의 정석! 단백질 든든 갓생 식단 🥗',
      custom_chips: [
        { label: '기본 (1.0x)', scale: 1.0 },
        { label: '드레싱 뺌', scale: 0.8 },
        { label: '토핑 추가', scale: 1.25 },
        { label: '소식 (0.8x)', scale: 0.8 },
      ],
    },
  },
  {
    name: '🍜 돈코츠 차슈 라멘',
    img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
    data: {
      name: '진한 돈코츠 차슈 라멘',
      serving_size: '1그릇 (약 550g)',
      calories: 780,
      carbs: 88,
      protein: 28,
      fat: 32,
      diet_comment: '면치기 제대로! 맛있게 먹고 내일 공복 유산소 고 💦',
      custom_chips: [
        { label: '보통 (1.0x)', scale: 1.0 },
        { label: '국물 남김', scale: 0.75 },
        { label: '면 추가', scale: 1.3 },
        { label: '차슈 추가', scale: 1.2 },
      ],
    },
  },
  {
    name: '🍔 수제 비프버거 & 프라이',
    img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    data: {
      name: '수제 비프버거와 감자튀김',
      serving_size: '1세트 (약 420g)',
      calories: 850,
      carbs: 78,
      protein: 42,
      fat: 42,
      diet_comment: '치팅데이 제대로 즐기기! 소고기 패티 육즙 폭발 🍔',
      custom_chips: [
        { label: '기본 (1.0x)', scale: 1.0 },
        { label: '감튀 제외', scale: 0.65 },
        { label: '패티 추가', scale: 1.25 },
        { label: '번 반쪽', scale: 0.85 },
      ],
    },
  },
  {
    name: '🍕 치즈 페퍼로니 피자',
    img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    data: {
      name: '치즈 페퍼로니 피자',
      serving_size: '2조각 (약 250g)',
      calories: 640,
      carbs: 68,
      protein: 26,
      fat: 28,
      diet_comment: '행복한 피맥 타임! 스트레스 싹 날리는 한 끼 🍕',
      custom_chips: [
        { label: '2조각 (기본)', scale: 1.0 },
        { label: '1조각만 (0.5x)', scale: 0.5 },
        { label: '3조각 (1.5x)', scale: 1.5 },
        { label: '치즈 추가', scale: 1.2 },
      ],
    },
  },
];

export const App: React.FC = () => {
  // 화면 모드: 'intro' (뷰파인더 첫화면) | 'editor' (스탬프 편집/확인) | 'gallery' (식단 기록 관리)
  // ✨ 모바일 카메라 촬영 후 브라우저 새로고침(Reload) 시에도 첫화면으로 튕기지 않도록 상태 복원
  const [currentView, setCurrentView] = useState<'intro' | 'editor' | 'gallery'>(() => {
    try {
      const saved = sessionStorage.getItem('dietsnap_active_view') || localStorage.getItem('dietsnap_active_view');
      if (saved === 'editor' || saved === 'gallery') return saved;
      return 'intro';
    } catch {
      return 'intro';
    }
  });

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

  // 식단 히스토리 갤러리 레코드 목록 및 현재 작업 레코드 ID
  const [records, setRecords] = useState<SavedDietRecord[]>([]);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);

  // 앱 마운트 시 IndexedDB에서 기존 저장된 식단 히스토리 불러오기
  useEffect(() => {
    getAllDietRecords()
      .then((loaded) => {
        setRecords(loaded);
      })
      .catch((err) => {
        console.warn('Failed to load diet records', err);
      });
  }, []);

  const [hasSavedWork, setHasSavedWork] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('dietsnap_current_img'));
    } catch {
      return false;
    }
  });

  // 뷰 상태 변경 시 세션/로컬 동시 저장 (새로고침 방어)
  const changeView = (newView: 'intro' | 'editor' | 'gallery') => {
    setCurrentView(newView);
    try {
      sessionStorage.setItem('dietsnap_active_view', newView);
      localStorage.setItem('dietsnap_active_view', newView);
    } catch (e) {
      console.warn('Session save failed', e);
    }
  };

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

  // 카메라 촬영 트리거 헬퍼 (카메라 앱 전환 전 에디터 뷰로 사전 마킹하여 새로고침 방어)
  const handleTriggerCapture = () => {
    try {
      sessionStorage.setItem('dietsnap_active_view', 'editor');
      localStorage.setItem('dietsnap_active_view', 'editor');
    } catch {}
    isCameraRef.current = true;
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  // 앨범 파일 선택 트리거 헬퍼
  const handleTriggerGallery = () => {
    try {
      sessionStorage.setItem('dietsnap_active_view', 'editor');
      localStorage.setItem('dietsnap_active_view', 'editor');
    } catch {}
    isCameraRef.current = false;
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
      galleryInputRef.current.click();
    }
  };

  // 1. 사진 업로드/촬영 완료 시: 즉시 에디터 화면 전환 및 원본 프리뷰 표시 후 AI 분석
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMessage(null);
      setIsAnalyzing(true);

      // ✨ 핵심 1: 사용자가 사진을 확인하는 즉시 에디터 모드로 화면 전환 & 고정
      changeView('editor');

      // ✨ 핵심 2: 내 폰 화면 및 저장 캔버스용: 원본 고화질(Original) 그대로 0.01초 즉각 프리뷰 렌더링!
      const originalObjectUrl = URL.createObjectURL(file);
      setImageSrc(originalObjectUrl);

      setStatusMessage('사진 최적화 중...');

      // 🚀 구글 API 전송용: 1536px 고화질 압축본 생성
      const compressed = await compressImage(file, 1536, 0.88);
      setCompressStats(compressed);

      try {
        localStorage.setItem('dietsnap_current_img', compressed.dataUrl);
      } catch (e) {
        console.warn('Backup save failed', e);
      }

      setStatusMessage('AI 칼로리 & 탄단지 분석 중...');

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
      const initialPortion = { scale: 1.0, excludeSoup: false };
      setPortion(initialPortion);
      setStatusMessage('✨ 분석 완료! 갤러리에 자동 저장되었습니다');
      setTimeout(() => setStatusMessage(''), 3500);

      // 💾 4. 분석된 식단 즉시 IndexedDB 갤러리에 영구 자동 저장!
      const now = new Date();
      const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateKey = now.toISOString().slice(0, 10);
      const newId = `diet_${now.getTime()}`;

      const newRecord: SavedDietRecord = {
        id: newId,
        timestamp: now.getTime(),
        dateStr,
        timeStr,
        dateKey,
        imageSrc: compressed.dataUrl,
        nutrition: aiResult,
        portion: initialPortion,
        template,
        aspectRatio,
      };

      await saveDietRecord(newRecord);
      setRecords((prev) => [newRecord, ...prev.filter((r) => r.id !== newId)]);
      setCurrentRecordId(newId);

    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(err.message || '식단 분석에 실패했습니다.');
    } finally {
      setIsAnalyzing(false);
      if (e.target) e.target.value = '';
    }
  };

  // 2. 프리셋 식단 선택
  const handleSelectPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setImageSrc(preset.img);
    setNutrition(preset.data);
    setPortion({ scale: 1.0, excludeSoup: false });
    setCompressStats(null);
    setCurrentRecordId(null);
    changeView('editor');
  };

  // 3. 갤러리에서 특정 식단 선택하여 에디터로 불러오기
  const handleSelectRecordFromGallery = (record: SavedDietRecord) => {
    setImageSrc(record.imageSrc);
    setNutrition(record.nutrition);
    setPortion(record.portion);
    if (record.template) setTemplate(record.template);
    if (record.aspectRatio) setAspectRatio(record.aspectRatio);
    setCurrentRecordId(record.id);
    changeView('editor');
  };

  // 4. 갤러리에서 특정 식단 삭제하기
  const handleDeleteRecord = async (id: string) => {
    await deleteDietRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (currentRecordId === id) {
      setCurrentRecordId(null);
    }
  };

  // 5. 보정 칩 변경 시 현재 레코드도 IndexedDB에 자동 동기화
  const handlePortionChange = (updatedPortion: PortionModifier) => {
    setPortion(updatedPortion);
    if (currentRecordId) {
      setRecords((prev) =>
        prev.map((r) => (r.id === currentRecordId ? { ...r, portion: updatedPortion } : r))
      );
      const target = records.find((r) => r.id === currentRecordId);
      if (target) {
        saveDietRecord({ ...target, portion: updatedPortion }).catch(() => {});
      }
    }
  };

  // 6. 수치 직접 수정 시 현재 레코드도 자동 동기화
  const handleNutritionChange = (updatedNutrition: NutritionItem) => {
    setNutrition(updatedNutrition);
    if (currentRecordId) {
      setRecords((prev) =>
        prev.map((r) => (r.id === currentRecordId ? { ...r, nutrition: updatedNutrition } : r))
      );
      const target = records.find((r) => r.id === currentRecordId);
      if (target) {
        saveDietRecord({ ...target, nutrition: updatedNutrition }).catch(() => {});
      }
    }
  };

  // 7. 고화질 JPG 다운로드
  const handleDownload = () => {
    const canvas = canvasElementRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `DietSnap_${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  // 8. 인스타그램 스토리 공유 (Web Share API 연동)
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
        handleDownload();
        alert('이미지가 저장되었습니다! 인스타그램 스토리에서 사진을 불러와 공유해보세요 ✨');
      }
    }, 'image/jpeg', 0.95);
  };

  // 9. 모바일 전체화면 토글
  const [isFullscreen, setIsFullscreen] = useState(false);
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#111215] text-neutral-100 flex flex-col items-center justify-start pb-24 font-sans">
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
      <header className="w-full max-w-md px-4 py-3 border-b border-neutral-800/80 sticky top-0 bg-[#111215]/90 backdrop-blur-md z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* 상황별 뒤로가기 버튼 */}
          {currentView === 'editor' ? (
            <button
              onClick={() => changeView('intro')}
              className="py-1 px-2.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 hover:text-white transition active:scale-95 flex items-center gap-1.5 shadow-sm"
              title="새 촬영으로 돌아가기"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-300" />
              <span className="text-xs font-semibold pr-0.5">새 촬영</span>
            </button>
          ) : currentView === 'gallery' ? (
            <button
              onClick={() => changeView('editor')}
              className="py-1 px-2.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 hover:text-white transition active:scale-95 flex items-center gap-1.5 shadow-sm"
              title="에디터로 돌아가기"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-300" />
              <span className="text-xs font-semibold pr-0.5">에디터</span>
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
          {/* 🗂️ 내 식단 갤러리 관리 버튼 (기록 개수 뱃지) */}
          <button
            onClick={() => changeView(currentView === 'gallery' ? 'editor' : 'gallery')}
            className={`text-xs px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              currentView === 'gallery'
                ? 'bg-rose-500 text-white shadow-rose-500/30'
                : 'bg-neutral-850 text-neutral-300 border border-neutral-700 hover:text-white'
            }`}
            title="내 오식완 기록 갤러리"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>내 기록</span>
            {records.length > 0 && (
              <span className={`text-[10px] px-1 rounded-full font-mono font-bold ${
                currentView === 'gallery' ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'
              }`}>
                {records.length}
              </span>
            )}
          </button>

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
          onResumeWork={() => changeView('editor')}
          onOpenHistoryClick={() => changeView('gallery')}
          historyCount={records.length}
        />
      ) : currentView === 'gallery' ? (
        /* 2. 오식완 식단 갤러리 관리 페이지 */
        <GalleryView
          records={records}
          onSelectRecord={handleSelectRecordFromGallery}
          onDeleteRecord={handleDeleteRecord}
          onNewCaptureClick={handleTriggerCapture}
        />
      ) : (
        /* 3. 에디터 화면 (스탬프 캔버스 & 1초 보정 칩 & 공유/저장) */
        <main className="w-full max-w-md px-4 pt-4 flex flex-col items-center gap-4">
          {/* 빠른 테스트용 프리셋 칩 */}
          <div className="w-full flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] text-neutral-400 font-semibold shrink-0">추천 식단:</span>
            {SAMPLE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset)}
                className="text-xs px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-neutral-300 shrink-0 transition active:scale-95 font-medium"
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* 알림 토스트 */}
          {statusMessage && !isAnalyzing && (
            <div className="w-full bg-emerald-950/60 border border-emerald-500/50 rounded-2xl px-3.5 py-2.5 text-xs text-emerald-300 font-bold flex items-center justify-center gap-2 shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {statusMessage}
            </div>
          )}

          {/* 캔버스 스탬프 뷰어 영역 */}
          <div className="relative w-full">
            {isAnalyzing && (
              <div className="absolute inset-0 z-20 bg-neutral-950/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-9 h-9 text-rose-400 animate-spin" />
                <div className="text-center px-4">
                  <p className="text-sm font-extrabold text-white">
                    {statusMessage || 'AI 분석 중...'}
                  </p>
                  <p className="text-xs text-rose-300/80 pt-1 font-medium">
                    1.2초 만에 성수동 감성 영수증 발행 중 ✨
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
            onPortionChange={handlePortionChange}
            nutrition={nutrition}
            onNutritionChange={handleNutritionChange}
            template={template}
            onTemplateChange={setTemplate}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            isPro={isPro}
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
