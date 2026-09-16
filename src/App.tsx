import React, { useState, useRef, useEffect } from 'react';
import { NutritionItem, PortionModifier, StampTemplate, AspectRatio, PhotoTransform, MealType } from './types/diet';
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
  BookOpen,
  Sparkles
} from 'lucide-react';
import { 
  getUserPlan, 
  setUserPlan, 
  getRemainingCount, 
  canTakePhoto, 
  incrementDailyUsage, 
  calculateFastingHours 
} from './utils/subscription';
import { ProModal } from './components/ProModal';
import { EditNutritionModal } from './components/EditNutritionModal';
import { UserPlan } from './types/diet';

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
  // 화면 모드: 'intro' (뷰파인더 첫 촬영화면) | 'editor' (스탬프 편집/확인) | 'gallery' (식단 기록 관리)
  // 📸 앱 첫 접속/새로고침 시 항상 "오늘 뭐 드셨나요? 뷰파인더 촬영화면"으로 시작
  const [currentView, setCurrentView] = useState<'intro' | 'editor' | 'gallery'>('intro');

  useEffect(() => {
    try {
      localStorage.removeItem('dietsnap_active_view');
      sessionStorage.removeItem('dietsnap_active_view');
    } catch {}
  }, []);

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

  const [template, setTemplate] = useState<StampTemplate>('receipt');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [photoTransform, setPhotoTransform] = useState<PhotoTransform>({
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
  });
  const [isEditNutritionOpen, setIsEditNutritionOpen] = useState<boolean>(false);
  
  // 👑 Pro 구독 상태 및 일일 잔여 횟수 관리
  const [userPlan, setUserPlanState] = useState<UserPlan>(getUserPlan);
  const [remainingCount, setRemainingCount] = useState<number>(getRemainingCount);
  const [isProModalOpen, setIsProModalOpen] = useState<boolean>(false);
  const isPro = userPlan === 'pro';

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

  // 뷰 상태 변경 헬퍼
  const changeView = (newView: 'intro' | 'editor' | 'gallery') => {
    setCurrentView(newView);
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

  // 카메라 촬영 트리거 헬퍼 (일일 한도 초과 시 Pro 업그레이드 모달 호출)
  const handleTriggerCapture = () => {
    if (!canTakePhoto()) {
      setIsProModalOpen(true);
      return;
    }

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

  // 앨범 파일 선택 트리거 헬퍼 (일일 한도 초과 시 Pro 업그레이드 모달 호출)
  const handleTriggerGallery = () => {
    if (!canTakePhoto()) {
      setIsProModalOpen(true);
      return;
    }

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

      // ⏳ 16:8 간헐적 단식 공복 시간 자동 계산 (수동 입력 0초)
      const now = new Date();
      const lastRecord = records.length > 0 ? records[0] : null;
      const fasting = calculateFastingHours(
        lastRecord?.dateStr || (lastRecord?.timestamp ? new Date(lastRecord.timestamp).toISOString() : undefined),
        now
      );
      if (fasting) {
        aiResult.fastingHours = fasting;
      }

      // 🔢 일일 사용량 1 증가 및 잔여 횟수 업데이트
      incrementDailyUsage();
      setRemainingCount(getRemainingCount());

      setNutrition(aiResult);
      const initialPortion = { scale: 1.0, excludeSoup: false };
      setPortion(initialPortion);
      setStatusMessage('✨ 분석 완료! 갤러리에 자동 저장되었습니다');
      setTimeout(() => setStatusMessage(''), 3500);

      // 💾 4. 분석된 식단 즉시 IndexedDB 갤러리에 영구 자동 저장!
      const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateKey = now.toISOString().slice(0, 10);
      const newId = `diet_${now.getTime()}`;
      const initialTransform: PhotoTransform = { zoom: 1.0, offsetX: 0, offsetY: 0 };
      setPhotoTransform(initialTransform);

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
        photoTransform: initialTransform,
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
    setPhotoTransform({ zoom: 1.0, offsetX: 0, offsetY: 0 });
    setCompressStats(null);
    setCurrentRecordId(null);
    changeView('editor');
  };

  // 3. 갤러리에서 특정 식단 선택하여 에디터로 불러오기 (기존 확대/자르기 구도 100% 복원)
  const handleSelectRecordFromGallery = (record: SavedDietRecord) => {
    setImageSrc(record.imageSrc);
    setNutrition(record.nutrition);
    setPortion(record.portion);
    if (record.template) setTemplate(record.template);
    if (record.aspectRatio) setAspectRatio(record.aspectRatio);
    setPhotoTransform(record.photoTransform || { zoom: 1.0, offsetX: 0, offsetY: 0 });
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

  // 7. 확대/자르기(이동) 구도 변경 시 현재 레코드도 IndexedDB에 자동 동기화
  const handleTransformChange = (updatedTransform: PhotoTransform) => {
    setPhotoTransform(updatedTransform);
    if (currentRecordId) {
      setRecords((prev) =>
        prev.map((r) => (r.id === currentRecordId ? { ...r, photoTransform: updatedTransform } : r))
      );
      const target = records.find((r) => r.id === currentRecordId);
      if (target) {
        saveDietRecord({ ...target, photoTransform: updatedTransform }).catch(() => {});
      }
    }
  };

  // 8. 비율 변경 (9:16 인스타 스토리 ⇄ 1:1 일반 피드) 시 현재 레코드도 IndexedDB 자동 동기화
  const handleAspectRatioChange = (newRatio: AspectRatio) => {
    setAspectRatio(newRatio);
    if (currentRecordId) {
      setRecords((prev) =>
        prev.map((r) => (r.id === currentRecordId ? { ...r, aspectRatio: newRatio } : r))
      );
      const target = records.find((r) => r.id === currentRecordId);
      if (target) {
        saveDietRecord({ ...target, aspectRatio: newRatio }).catch(() => {});
      }
    }
  };

  // 9. 고화질 JPG 다운로드
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

      const file = new File([blob], 'dietsnap.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: '오늘의 오식완 스탬프',
            text: `${nutrition.name} (#오식완 #DietSnap)`,
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
  const [, setIsFullscreen] = useState(false);
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className={`bg-[#111215] text-neutral-100 flex flex-col items-center font-sans ${
      currentView === 'editor' 
        ? 'h-[100dvh] w-full max-w-md mx-auto overflow-hidden touch-none select-none justify-between' 
        : 'min-h-screen w-full pb-24 justify-start'
    }`}>
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
      <header className="w-full max-w-md px-3 py-2 border-b border-neutral-800/80 sticky top-0 bg-[#111215]/95 backdrop-blur-md z-30 flex items-center justify-between gap-1 shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 상황별 뒤로가기 버튼 */}
          {currentView === 'editor' ? (
            <button
              onClick={() => changeView('intro')}
              className="py-1 px-2 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 hover:text-white transition active:scale-95 flex items-center gap-1 shadow-sm shrink-0"
              title="새 촬영으로 돌아가기"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
              <span className="text-[11px] font-semibold whitespace-nowrap">새 촬영</span>
            </button>
          ) : currentView === 'gallery' ? (
            <button
              onClick={() => changeView('editor')}
              className="py-1 px-2 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 hover:text-white transition active:scale-95 flex items-center gap-1 shadow-sm shrink-0"
              title="에디터로 돌아가기"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
              <span className="text-[11px] font-semibold whitespace-nowrap">에디터</span>
            </button>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
          )}

          <div className="shrink-0 cursor-pointer" onClick={() => changeView('intro')}>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1 whitespace-nowrap">
              DietSnap <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">v1.0</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* 🗂️ 내 식단 갤러리 관리 버튼 (기록 개수 뱃지) */}
          <button
            onClick={() => changeView(currentView === 'gallery' ? 'editor' : 'gallery')}
            className={`text-[11px] px-2 py-1 rounded-xl font-bold flex items-center gap-1 transition-all shadow-sm shrink-0 ${
              currentView === 'gallery'
                ? 'bg-rose-500 text-white shadow-rose-500/30'
                : 'bg-neutral-850 text-neutral-300 border border-neutral-700 hover:text-white'
            }`}
            title="내 오식완 기록 갤러리"
          >
            <BookOpen className="w-3 h-3 shrink-0" />
            <span className="whitespace-nowrap">내 기록</span>
            {records.length > 0 && (
              <span className={`text-[9px] px-1 rounded-full font-mono font-bold ${
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
            className="p-1 rounded-lg bg-neutral-800/90 text-neutral-300 border border-neutral-700 hover:text-white transition active:scale-95 shrink-0"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* 👑 Pro 모달 오픈 버튼 */}
          <button
            onClick={() => setIsProModalOpen(true)}
            className={`text-[11px] px-2 py-1 rounded-full font-bold flex items-center gap-1 transition-all shrink-0 ${
              isPro
                ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
                : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 hover:border-amber-400'
            }`}
          >
            <Crown className={`w-3 h-3 shrink-0 ${isPro ? 'text-neutral-950' : 'text-amber-400'}`} />
            <span className="whitespace-nowrap">{isPro ? `PRO (${remainingCount})` : '월 990원'}</span>
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
          isPro={isPro}
          remainingCount={remainingCount}
          onOpenProModal={() => setIsProModalOpen(true)}
        />
      ) : currentView === 'gallery' ? (
        /* 2. 오식완 식단 갤러리 관리 페이지 */
        <GalleryView
          records={records}
          onSelectRecord={handleSelectRecordFromGallery}
          onDeleteRecord={handleDeleteRecord}
          onNewCaptureClick={handleTriggerCapture}
          isPro={isPro}
          onOpenProModal={() => setIsProModalOpen(true)}
        />
      ) : (
        /* 3. 에디터 화면 (스크롤 0% 100dvh 풀스크린 카메라 에디터) */
        <main className="w-full max-w-md flex-1 min-h-0 px-3 py-1 flex flex-col justify-between overflow-hidden">
          
          {/* 상단 캔버스 스탬프 뷰어 영역 (flex-1 탄력 스케일링) */}
          <div className="relative w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden py-1">
            {isAnalyzing && (
              <div className="absolute inset-0 z-20 bg-neutral-950/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-9 h-9 text-rose-400 animate-spin" />
                <div className="text-center px-4">
                  <p className="text-sm font-bold text-white tracking-tight animate-pulse">
                    {statusMessage || 'AI 식단 정밀 분석 중...'}
                  </p>
                  <p className="text-xs text-neutral-400 pt-1">
                    양념, 토핑, 중량을 실시간 추정하고 있습니다
                  </p>
                </div>
              </div>
            )}

            <div className={`h-full max-h-full flex items-center justify-center transition-all duration-200 ${
              aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square max-w-[380px]'
            }`}>
              <StampCanvas
                imageSrc={imageSrc}
                nutrition={nutrition}
                portion={portion}
                template={template}
                aspectRatio={aspectRatio}
                isPro={isPro}
                transform={photoTransform}
                onTransformChange={handleTransformChange}
                onAspectRatioChange={handleAspectRatioChange}
                onCanvasReady={(canvas) => {
                  canvasElementRef.current = canvas;
                }}
              />
            </div>
          </div>

          {/* 하단 통합 컨트롤러 바 (스크롤 0초 인터랙션) */}
          <div className="w-full shrink-0 space-y-2 pt-1 pb-1">
            {/* 1단: 템플릿 4종 탭 (캔버스 바로 밑 밀착 배치) */}
            <div className="grid grid-cols-4 gap-1 bg-neutral-900/90 p-1 rounded-2xl border border-neutral-800/90 shadow-sm">
              {[
                { id: 'receipt' as StampTemplate, label: '🧾 성수 영수증' },
                { id: 'pink_receipt' as StampTemplate, label: '🌸 핑크 라벨', isPro: true },
                { id: 'polaroid' as StampTemplate, label: '📷 폴라로이드' },
                { id: 'vintage_ticket' as StampTemplate, label: '🎫 빈티지 티켓', isPro: true },
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    if (tpl.isPro && !isPro) {
                      setIsProModalOpen(true);
                      return;
                    }
                    setTemplate(tpl.id);
                  }}
                  className={`py-2 px-1 text-[11px] font-bold rounded-xl transition active:scale-95 flex items-center justify-center gap-0.5 whitespace-nowrap ${
                    template === tpl.id
                      ? 'bg-neutral-100 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="truncate">{tpl.label}</span>
                  {tpl.isPro && !isPro && <Crown className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
                </button>
              ))}
            </div>

            {/* 2단: 끼니 분류 (아침/점심/저녁/간식) & 1초 양 보정 & 수치/끼니 직접 수정 (한 줄 콤팩트 바) */}
            <div className="flex items-center justify-between gap-1.5 px-0.5">
              {/* 끼니 & 양 보정 퀵 칩 스크롤러 */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
                {/* 끼니 4종 원터치 토글 */}
                {[
                  { id: 'breakfast' as MealType, label: '아침 🌅' },
                  { id: 'lunch' as MealType, label: '점심 ☀️' },
                  { id: 'dinner' as MealType, label: '저녁 🌙' },
                  { id: 'snack' as MealType, label: '간식 🍪' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handlePortionChange({ ...portion, mealType: m.id })}
                    className={`py-1 px-2 rounded-lg text-[10px] font-bold whitespace-nowrap border transition active:scale-95 ${
                      (portion.mealType || 'lunch') === m.id
                        ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}

                <span className="w-px h-3.5 bg-neutral-800 shrink-0 mx-0.5" />

                {/* 끼니/유머 퀵 토글 */}
                {['zero_cal', 'cheating'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handlePortionChange({ 
                      ...portion, 
                      humorMode: (portion.humorMode === mode ? 'none' : mode) as any 
                    })}
                    className={`py-1 px-2 rounded-lg text-[10px] font-bold whitespace-nowrap border transition active:scale-95 ${
                      portion.humorMode === mode
                        ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    {mode === 'zero_cal' ? '0 kcal 🤫' : '치팅 🍕'}
                  </button>
                ))}

                {/* 양 보정 소/보통/곱 */}
                {[
                  { label: '소식 (0.8x)', scale: 0.8 },
                  { label: '보통 (1.0x)', scale: 1.0 },
                  { label: '곱 (1.25x)', scale: 1.25 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handlePortionChange({ ...portion, scale: p.scale, activeLabel: p.label })}
                    className={`py-1 px-2 rounded-lg text-[10px] font-bold whitespace-nowrap border transition active:scale-95 ${
                      portion.scale === p.scale
                        ? 'bg-neutral-200 text-neutral-950 border-white shadow-sm'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    {p.label.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* 수치 및 끼니 수정 모달 버튼 */}
              <button
                onClick={() => setIsEditNutritionOpen(true)}
                className="py-1 px-2.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-[10px] font-bold border border-neutral-750 whitespace-nowrap shrink-0 flex items-center gap-1 active:scale-95 transition shadow-sm"
              >
                <span>수치/끼니수정</span>
              </button>
            </div>

            {/* 3단: 메인 빅 액션 버튼 [🚀 인스타 스토리 즉시 공유] & [다시 촬영] / [저장] */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                onClick={handleTriggerCapture}
                className="py-2.5 px-3 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border border-neutral-750 shrink-0 active:scale-95 transition"
                title="다시 촬영"
              >
                <Camera className="w-4 h-4" />
              </button>

              <button
                onClick={handleShare}
                className="flex-1 py-3 px-3 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:opacity-95 text-white rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/20 active:scale-[0.98] transition whitespace-nowrap"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>인스타 스토리 즉시 공유</span>
              </button>

              <button
                onClick={handleDownload}
                className="py-2.5 px-3 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border border-neutral-750 shrink-0 active:scale-95 transition"
                title="고해상도 JPG 파일로 직접 저장"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      )}

      {/* 👑 DietSnap Pro 구독 결제 & 혜택 안내 모달 */}
      <ProModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        onPlanChanged={(newPlan) => {
          setUserPlanState(newPlan);
          setRemainingCount(getRemainingCount());
        }}
      />

      {/* ✏️ 수치 및 끼니(아침/점심/저녁/간식) 직접 수정 모달 */}
      <EditNutritionModal
        isOpen={isEditNutritionOpen}
        onClose={() => setIsEditNutritionOpen(false)}
        nutrition={nutrition}
        mealType={portion.mealType || 'lunch'}
        onSave={(updatedNutrition, updatedMealType) => {
          handleNutritionChange(updatedNutrition);
          if (updatedMealType) {
            handlePortionChange({ ...portion, mealType: updatedMealType });
          }
          setIsEditNutritionOpen(false);
        }}
      />
    </div>
  );
};
