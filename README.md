# 📸 DietSnap (오식완 AI 스탬프 카메라)

> **"식단 기록에 1초 이상 쓰지 마세요. 찍으면 끝나는 성수동 감성 오식완 카메라"**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-diet--snap.vercel.app-emerald?style=for-the-badge&logo=vercel)](https://diet-snap.vercel.app/)
[![License](https://img.shields.io/badge/License-Private-rose?style=for-the-badge)](#)

---

## 🌐 공식 배포 주소
* **웹 & PWA 링크**: **[https://diet-snap.vercel.app/](https://diet-snap.vercel.app/)**
* 스마트폰 크롬/사파리에서 접속 후 **`[홈 화면에 추가]`** 를 누르면 네이티브 앱처럼 전체화면으로 실행됩니다.

---

## ✨ 핵심 기능 (Features)

1. **⚡ 1.2초 초고속 AI 자동 분석 (Google Gemini 3.5 Flash-Lite)**
   - 사진 1장 촬영 시 수동 입력 없이 **메뉴명, 총 칼로리, 탄단지(탄수화물/단백질/지방), 인스타 감성 한 줄 평**을 1.2초 내 자동 도출합니다.
2. **🎨 성수동 감성 2종 스탬프 그래픽 (HTML5 Canvas 레티나 렌더링)**
   - **🧾 영수증 룩 (Receipt Look)**: 트렌디한 아크릴 영수증과 리얼 바코드 그래픽 합성
   - **📷 미니멀 폴라로이드 룩 (Polaroid Look)**: 38px 초볼드 탄단지 카드와 날짜 뱃지 합성
3. **🍱 무손실 프레이밍 & Safe Paper Zone**
   - **식판 가로 사진**: 가로폭 100% 핏으로 좌우 잘림 0%, 상하단 순백색 액자 마감
   - **Safe Paper Zone (560px)**: 어두운 배경(노트북 키보드 등)을 찍어도 하단 텍스트 영역을 순백색 종이로 100% 분리하여 글씨가 가려지지 않음
4. **🔘 음식 연동형 1초 맞춤 보정 칩 (단 1회 API 호출 캡슐화)**
   - 음식 종류를 인식하여 AI가 실시간 맞춤 칩을 제공 (예: `초등 급식`, `성인 식판`, `드레싱 뺌`, `시럽 뺌` 등)
   - 탭 한 번으로 칼로리와 탄단지가 즉시 재계산되며 스탬프 하단에 반영
5. **📲 인스타그램 스토리 즉시 공유 & 갤러리 저장**
   - Web Share API를 통해 인스타 스토리로 원클릭 공유
   - 브라우저 강제 다운로드 팝업 없이 깔끔한 고해상도 JPG 수동 저장 지원

---

## 🛠️ 기술 스택 (Tech Stack)

* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
* **Graphic Engine**: HTML5 Canvas API (1080x1920 9:16 / 1080x1080 1:1)
* **AI Engine**: Google Gemini API (`gemini-3.5-flash-lite`)
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
