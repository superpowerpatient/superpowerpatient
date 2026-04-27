# 이겨내자 오늘도 🎗️

항암 치료 중인 분과 가족이 매일의 기록(기분·식이·체중·부작용·복약·병원비)과 사이클 일정을 한 곳에 모을 수 있는 단일 HTML 다이어리 앱입니다.

빌드 도구 없이 `index.html` 하나로 동작하며, **PWA**로 홈 화면에 설치할 수 있습니다.

---

## 🚀 빠른 시작

### 로컬에서 열기 (개발/검토)

```bash
python3 -m http.server 8000
# 또는
npx serve .
```

브라우저로 `http://localhost:8000` 접속.

> ⚠️ `file://` 프로토콜로 직접 열면 iOS Safari에서 CDN/Service Worker가 막힙니다. 반드시 HTTP 서버를 통해 여세요.

### 휴대폰에서 PWA로 설치하기

1. 아래 호스팅 중 한 곳에 배포 (5분)
2. 휴대폰에서 그 URL을 열고 "홈 화면에 추가"

#### iOS (iPhone Safari)
1. Safari로 배포 URL 접속
2. 하단 가운데 **공유** 버튼 (□↑) 탭
3. **"홈 화면에 추가"** 선택
4. 이름 확인 후 "추가" — 앱 아이콘이 홈 화면에 박힘
5. 아이콘을 탭하면 풀스크린 앱처럼 동작

#### Android (Chrome)
1. Chrome으로 배포 URL 접속
2. 우상단 **⋮ 메뉴** → **"홈 화면에 추가"** 또는 자동으로 뜨는 설치 배너
3. "설치" 탭 — 일반 앱처럼 앱 서랍에 등록

---

## ☁️ 5분 배포 옵션

### 옵션 A: GitHub Pages (이미 GitHub에 올렸을 때 가장 빠름)

1. 저장소 **Settings → Pages**
2. Source: `Deploy from a branch`
3. Branch: `main` (또는 본인 브랜치) / `/ (root)`
4. Save → 1~2분 후 `https://<유저>.github.io/<리포>/` 활성화

### 옵션 B: Vercel (도메인 자동 발급)

1. [vercel.com](https://vercel.com) 가입 → "Add New Project"
2. GitHub 저장소 import (또는 폴더를 그냥 드래그)
3. Framework: **Other** / Root Directory: `./`
4. Deploy → `xxx.vercel.app` 즉시 발급

### 옵션 C: Netlify (드래그앤드롭)

1. [app.netlify.com/drop](https://app.netlify.com/drop) 접속
2. 프로젝트 폴더를 그대로 드래그
3. 즉시 URL 발급

---

## 🧱 프로젝트 구조

```
.
├── index.html                # 단일 페이지 React 앱 (Babel + Tailwind CDN)
├── manifest.json             # PWA 매니페스트
├── sw.js                     # Service Worker (셸 캐시 + CDN stale-while-revalidate)
├── icons/                    # PWA 아이콘 4종 (192/512/maskable/apple-touch)
├── scripts/
│   └── make_icons.py         # 아이콘 재생성 (디자인 변경 시 사용)
└── ios/                      # WKWebView 래퍼 (Xcode 네이티브 앱용, 선택)
    ├── IgyeonaejaOneulDoApp.swift
    └── README.md
```

---

## ✨ 기능

- **📋 오늘**: 화이팅 메시지(형광펜 카드), 5단계 기분 이모지, 오늘의 요약
- **💊 치료**: 항암 레지멘 프리셋(8개 암종 + 직접 입력) 3단계 모달, **사이클 캘린더**(투여일 진한 핑크 / 사이클 기간 옅은 핑크 / 오늘 링)
- **🏥 몸상태**: (개발 예정) 체중/BSA/식이
- **📖 일기**: 본문·감사·힘든 점 일기 + 화이팅 갤러리(10가지 그라디언트 카드)
- **💰 병원비**: 카테고리별 지출 + 보험/실비 한도 + 도넛/막대/라인 차트 3종

---

## 💾 데이터 저장

모든 데이터는 브라우저 `localStorage`에 JSON으로 저장됩니다 (네트워크 요청 없음).

| 키 | 내용 |
|---|---|
| `igt_cheering` | 화이팅 메시지 |
| `igt_mood` | 일별 기분 |
| `igt_treatment` | (예약) 치료 기록 |
| `igt_sideeffects` | 부작용 체크리스트 |
| `igt_medications` | 약물 복용 |
| `igt_vitals` | 체중·BSA·BMI |
| `igt_meals` | 식이량 |
| `igt_diary` | 일기 |
| `igt_expenses` | 병원비 |
| `igt_insurance` | 보험 한도 |
| `igt_profile` | 사용자 프로필 |
| `igt_schedule` | 항암 사이클 스케줄 |

### 데이터 백업

브라우저 콘솔에서 다음을 실행하면 JSON으로 다운로드됩니다:

```js
const keys = ['igt_cheering','igt_mood','igt_treatment','igt_sideeffects',
              'igt_medications','igt_vitals','igt_meals','igt_diary',
              'igt_expenses','igt_insurance','igt_profile','igt_schedule'];
const dump = Object.fromEntries(keys.map(k => [k, JSON.parse(localStorage.getItem(k) || 'null')]));
const blob = new Blob([JSON.stringify(dump, null, 2)], {type:'application/json'});
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = `igt_backup_${new Date().toLocaleDateString('sv-SE')}.json`;
a.click();
```

> ⚠️ **PWA로 설치한 경우 브라우저 데이터를 지우면 함께 삭제됩니다.** 중요한 의료 데이터는 주기적으로 백업하세요.

---

## 🔄 아이콘 재생성

```bash
python3 -m pip install Pillow
python3 scripts/make_icons.py
```

`icons/` 디렉터리에 192/512/maskable/apple-touch 4종 PNG가 새로 생성됩니다.

---

## 📱 네이티브 앱으로 빌드하기 (선택)

- **iOS**: `ios/README.md` 참고. SwiftUI + WKWebView 래퍼로 1~2분이면 Xcode에서 열림
- **Android**: WebView 래퍼는 향후 추가 예정 (Capacitor / Android Studio 둘 다 가능)

---

## ⚠️ 의료 면책

본 앱은 **기록 보조 도구**이며 의학적 판단을 대체하지 않습니다. 실제 처방·투여 일정·증상 해석은 반드시 담당 의료진의 지시를 따르세요. 항암 레지멘 프리셋의 정보는 일반적인 참고 자료로, 개인 처방과 다를 수 있습니다.
