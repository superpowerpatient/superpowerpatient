# 이겨내자 오늘도 🎗️

항암 치료 중인 분과 가족이 매일의 기록(기분·식이·체중·부작용·복약·병원비)과 사이클 일정을 한 곳에 모을 수 있는 단일 HTML 다이어리 앱입니다.

빌드 도구 없이 `index.html` 하나로 동작하며, 다음 세 가지 형태로 모두 제공됩니다:

1. **PWA** — 어떤 휴대폰에서도 홈 화면 추가 후 풀스크린 앱처럼 동작
2. **iOS / Android 네이티브 앱 (Capacitor)** — 같은 코드로 양쪽 앱스토어 배포 가능
3. **iOS 단독 SwiftUI 래퍼 (`ios-standalone/`)** — Capacitor 없이 가볍게 가고 싶을 때

---

## 🚀 빠른 시작

### 로컬에서 검토

```bash
python3 -m http.server 8000
# 또는
npx serve .
```

`http://localhost:8000` 접속.

> ⚠️ `file://` 직접 열면 iOS Safari에서 CDN/Service Worker가 막힙니다. 반드시 HTTP 서버 경유.

---

## 📱 PWA로 설치하기 (가장 빠름, 무료)

### 배포

`index.html`이 있는 폴더 전체를 정적 호스팅에 올리면 끝.

| 호스팅 | 절차 | 시간 |
|---|---|---|
| **GitHub Pages** | Settings → Pages → 브랜치 선택 → Save | 2분 |
| **Vercel** | [vercel.com](https://vercel.com) → New Project → 리포 import | 1분 |
| **Netlify** | [app.netlify.com/drop](https://app.netlify.com/drop) 에 폴더 드래그 | 30초 |

### 휴대폰에 설치

#### iPhone (Safari)
1. Safari로 배포 URL 접속
2. 하단 가운데 **공유 □↑** 탭
3. **"홈 화면에 추가"** → 핑크 아이콘이 홈 화면에 박힘

#### Galaxy / Android (Chrome)
1. Chrome으로 배포 URL 접속
2. 우상단 **⋮ 메뉴 → "홈 화면에 추가"** 또는 자동 배너의 **"설치"**
3. 앱 서랍에 등록됨

설치 후엔 풀스크린으로 뜨고, Service Worker 덕분에 비행기 모드에서도 한 번 캐시된 자원으로 동작합니다.

---

## 🦾 네이티브 앱 (Capacitor) — App Store / Play Store 배포용

같은 `index.html`을 iOS/Android 네이티브 앱으로 감싸 양쪽 앱스토어에 올릴 수 있습니다.

### 사전 요구사항
- **공통**: Node.js 18+ (현재 환경 v22 권장)
- **Android 빌드**: Android Studio (또는 Java JDK 17 + Android SDK)
- **iOS 빌드**: macOS + Xcode 15+ + CocoaPods (`sudo gem install cocoapods`)

### 처음 셋업

```bash
# 1. 의존성 설치
npm install

# 2. www/ 빌드 (정적 파일 복사)
npm run build

# 3-A. Android 플랫폼 추가 (이미 추가되어 있으면 건너뛰기)
# npx cap add android

# 3-B. iOS 플랫폼 추가 (Mac 필수, 처음 한 번)
npx cap add ios

# 4. 변경사항을 네이티브로 동기화
npx cap sync
```

> 이 저장소는 이미 `android/` 폴더가 포함되어 있어 3-A는 건너뛰셔도 됩니다. Mac에서 처음 클론하셨다면 3-B만 실행.

### 일상 개발 흐름

```bash
# index.html 수정 후
npm run sync             # = build + cap sync
npm run open:android     # Android Studio 실행
npm run open:ios         # Xcode 실행 (Mac)
```

또는 한 번에:

```bash
npm run run:android      # Android 기기/에뮬레이터에서 실행
npm run run:ios          # iOS 시뮬레이터에서 실행
```

### 앱스토어 배포 체크포인트
- **Android**: Android Studio → Build → Generate Signed Bundle/APK → Play Console 업로드 ($25 일회 등록비)
- **iOS**: Xcode → Product → Archive → App Store Connect 업로드 ($99/yr Apple Developer)
- **공통**: 앱 아이콘·스크린샷·개인정보 처리방침·의료 면책 문구 준비 필수

---

## 🧱 프로젝트 구조

```
.
├── index.html                 # 단일 페이지 React 앱 (Babel + Tailwind CDN)
├── manifest.json              # PWA 매니페스트
├── sw.js                      # Service Worker
├── icons/                     # PWA 아이콘 4종
├── capacitor.config.json      # Capacitor 설정 (appId, appName, webDir)
├── package.json               # npm 의존성 + 빌드 스크립트
├── scripts/
│   ├── build-www.mjs          # www/ 폴더 빌드 (cap sync 전에 실행)
│   └── make_icons.py          # 아이콘 재생성 (Pillow 사용)
├── www/                       # Capacitor용 빌드 출력 (gitignored)
├── android/                   # Capacitor가 생성한 Android 프로젝트
├── ios/                       # Capacitor가 생성하는 iOS 프로젝트 (Mac에서 cap add ios 후 생김)
└── ios-standalone/            # Capacitor 없이 SwiftUI WKWebView 래퍼만 쓸 때
```

---

## ✨ 기능

- **📋 오늘**: 화이팅 메시지(형광펜 카드), 5단계 기분 이모지, 오늘 요약
- **💊 치료**: 항암 레지멘 프리셋(8개 암종 + 직접 입력) 3단계 모달, **사이클 캘린더**(투여일/사이클 색상 시각화)
- **🏥 몸상태**: (개발 예정) 체중/BSA/식이
- **📖 일기**: 본문·감사·힘든 점 일기 + 화이팅 갤러리(10가지 그라디언트 카드)
- **💰 병원비**: 카테고리 지출 + 보험 한도 + 도넛/막대/라인 차트 3종

---

## 💾 데이터 저장

모든 데이터는 브라우저 `localStorage`에 JSON으로 저장됩니다.

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
| `igt_profile` | 프로필 |
| `igt_schedule` | 항암 사이클 스케줄 |

### 백업 스니펫

브라우저/웹뷰 콘솔에서 실행:

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

> ⚠️ Capacitor 앱의 localStorage는 앱 삭제 시 함께 삭제됩니다. 향후 Capacitor Filesystem 또는 Preferences 플러그인으로 백업·복원을 네이티브 측에 두는 것을 권장합니다.

---

## 🔄 아이콘 재생성

```bash
python3 -m pip install Pillow
python3 scripts/make_icons.py
```

생성된 아이콘은 PWA + Capacitor 양쪽에서 사용됩니다. Capacitor Android·iOS 런처 아이콘은 별도 — 필요시 [`@capacitor/assets`](https://capacitorjs.com/docs/guides/splash-screens-and-icons)로 자동 생성 가능.

---

## ⚠️ 의료 면책

본 앱은 **기록 보조 도구**이며 의학적 판단을 대체하지 않습니다. 실제 처방·투여 일정·증상 해석은 반드시 담당 의료진의 지시를 따르세요. 항암 레지멘 프리셋의 정보는 일반적인 참고 자료로, 개인 처방과 다를 수 있습니다.
