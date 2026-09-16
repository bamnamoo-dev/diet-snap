# 📸 DietSnap (오식완 AI 스탬프 카메라)

> **"식단 기록에 1초 이상 쓰지 마세요. 찍으면 끝나는 성수동 감성 오식완 카메라"**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-diet--snap.vercel.app-emerald?style=for-the-badge&logo=vercel)](https://diet-snap.vercel.app/)
[![License](https://img.shields.io/badge/License-Private-rose?style=for-the-badge)](#)

---

## 🌐 공식 배포 주소
* **공식 웹 & PWA 링크**: **[https://diet-snap.vercel.app/](https://diet-snap.vercel.app/)**
* 스마트폰 크롬/사파리에서 접속 후 **`[홈 화면에 추가]`** 를 누르면 네이티브 앱처럼 전체화면으로 실행됩니다.

---

## ✨ 핵심 기능 (Features)

1. **⚡ 1.2초 초고속 AI 자동 분석 (Google Gemini 3.5 Flash-Lite)**
   - 사진 1장 촬영 시 수동 입력 없이 **메뉴명, 총 칼로리, 탄단지(탄수화물/단백질/지방), 인스타 감성 한 줄 평**을 1.2초 내 자동 도출합니다.
2. **📱 100dvh 풀스크린 노스크롤 에디터 (No-Scroll Interaction)**
   - 모바일 브라우저 스크롤을 0%로 고정하여 화면 흔들림을 원천 차단했습니다.
   - 캔버스 바로 밑에 4종 템플릿과 퀵 보정 바를 밀착 배치하여 손가락 하나로 모든 조작을 끝냅니다.
3. **🔍 음식 사진 실시간 확대 및 자르기 (Zoom & Pan & Crop)**
   - 캔버스 우상단 `[-] 1.0x ~ 3.0x [+]` 미니 툴바 및 핀치 줌 / 마우스 휠 줌을 지원합니다.
   - 상하좌우 자유 드래그로 원하는 음식 구도를 정밀하게 크롭하고, 원클릭 초기화(`↺`)를 지원합니다.
   - 며칠 뒤 갤러리에서 과거 식단을 다시 불러와도 조절해둔 확대/자르기 구도가 100% 복원됩니다.
4. **🍽️ 끼니 분류(아침·점심·저녁·간식·치팅) 자유로운 수정**
   - 에디터 메인 화면 2단 바에서 원터치 칩으로 즉시 전환할 수 있습니다.
   - `[수치/끼니수정]` 모달에서 5종 끼니와 상세 수치를 직접 변경할 수 있으며, 일간/주간 보고서에 자동 반영됩니다.
5. **📐 9:16 (인스타 스토리) 기본 + 1:1 (일반 피드) 원터치 전환**
   - 인스타 스토리에 최적화된 9:16 세로 풀스크린 롱 영수증이 기본으로 렌더링됩니다.
   - 캔버스 좌상단 `[9:16 스토리 ⇄ 1:1 피드]` 버튼 클릭 한 번으로 정사각형 피드/카톡 규격으로 즉시 변환됩니다.
6. **🎨 4대 감성 스탬프 템플릿 & 유머 모드**
   - **🧾 성수 영수증**: 클래식 화이트 아크릴 영수증과 리얼 바코드 그래픽.
   - **🌸 핑크 라벨**: 힙하고 러블리한 성수동 감성 핑크 라벨 영수증.
   - **📷 폴라로이드**: 자동 클리핑(자르기) 화이트 액자와 초볼드 탄단지 카드.
   - **🎫 빈티지 티켓**: 레트로 영화/콘서트 티켓 스타일 스탬프.
   - **유머 모드**: `0 kcal 🤫` (맛있으면 0칼로리), `치팅데이 🍕`, `내일 공복 유산소 확정 💦`.
7. **📊 식단 보고서 3종 (갤러리 대시보드 집약)**
   - **① 일간 식단 보고서**: 오늘 하루 3끼 사진(1~4분할 콜라주) + 총 칼로리/탄단지 합산 롱 영수증.
   - **② 트레이너 쌤 제출용 식단표 (PRO)**: PT 코치 카톡 전송용 A4 화이트 정밀 매크로 표.
   - **③ 주간 결산 영수증 (PRO)**: 최근 7일간 일평균 칼로리 및 단백질 목표 달성률 롱 영수증.
8. **👑 합리적인 비즈니스 모델**
   - 무료: 하루 3장 무료 촬영, 우측 하단 워터마크, 기본 일간 모아보기 제공.
   - Pro: **연 5,500원(월 458원 꼴, BEST) 또는 월 990원**, 매일 15장 충전, 워터마크 제거, 4종 템플릿 및 고급 리포트 무제한.

---

## 🛠️ 기술 스택 (Tech Stack)

* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
* **Graphic Engine**: HTML5 Canvas API (1080x1920 9:16 / 1080x1080 1:1 레티나 실시간 렌더링)
* **AI Engine**: Google Gemini API (`gemini-3.5-flash-lite`, 단일 JSON 응답 캡슐화)
* **Storage Engine**: IndexedDB (대용량 식단 영구 보관) + LocalStorage (세션 즉시 복원 방어)
* **Infrastructure**: Vercel Edge Serverless Function (`/api/analyze.ts`) + GitHub CI/CD

---

## 🚀 로컬 실행 방법

```bash
# 1. 저장소 클론
git clone https://github.com/bamnamoo-dev/diet-snap.git
cd diet-snap

# 2. 패키지 설치
npm install

# 3. 환경 변수 설정 (.env.local)
GEMINI_API_KEY=your_gemini_api_key_here

# 4. 개발 서버 실행
npm run dev
```
