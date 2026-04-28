# Xcode에서 열어보기

「이겨내자 오늘도 🎗️」 단일 HTML 앱을 iOS 네이티브 앱으로 감싸서 Xcode에서 실행하는 가이드입니다. 이미 만들어진 `index.html`을 WKWebView로 불러오는 얇은 래퍼를 사용합니다.

## 1. 필요 환경
- macOS Sonoma 이상 (권장)
- Xcode 15 이상
- iOS 16+ 시뮬레이터 또는 실기기

## 2. 새 Xcode 프로젝트 만들기 (1분 소요)

1. Xcode 실행 → **File → New → Project...**
2. iOS 탭에서 **App** 선택 후 Next
3. 다음 값 입력:
   - Product Name: `IgyeonaejaOneulDo` (한글도 가능하나 영문 권장)
   - Team: 본인 Apple ID
   - Organization Identifier: 예) `com.yourname`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Storage/Testing 관련 체크박스는 모두 해제
4. 저장 위치 선택 후 Create

## 3. 소스 파일 교체

생성된 기본 템플릿 파일을 이 저장소의 파일로 교체합니다.

1. Xcode 네비게이터에서 자동 생성된 **`IgyeonaejaOneulDoApp.swift`** 와 **`ContentView.swift`** 를 모두 선택 → 우클릭 → **Move to Trash**
2. Finder에서 `ios/IgyeonaejaOneulDoApp.swift` 를 Xcode 프로젝트 폴더로 드래그 앤 드롭
   - "Copy items if needed" 체크 ✅
   - "Add to targets"에 앱 타겟 체크 ✅
3. 저장소 루트의 **`index.html`** 을 Xcode 프로젝트 폴더로 드래그 앤 드롭
   - "Copy items if needed" 체크 ✅
   - "Add to targets"에 앱 타겟 체크 ✅ (이게 꺼져 있으면 번들에 포함되지 않아 로드 실패)

## 4. Info.plist 설정 (권장)

Xcode 15 기본 템플릿은 Info.plist를 자동 생성합니다. 프로젝트 설정 화면의 **Info** 탭에서 다음 키를 추가/확인하세요.

| Key | Value | 설명 |
|---|---|---|
| `CFBundleDisplayName` | `이겨내자 오늘도` | 홈 화면 표시 이름 |
| `UIStatusBarStyle` | `UIStatusBarStyleDefault` | 상태바 기본 스타일 |
| `UIRequiresFullScreen` | `YES` | 분할화면 비활성 (선택) |
| `UISupportedInterfaceOrientations` | `UIInterfaceOrientationPortrait` 만 | 세로 고정 (선택) |

> 📌 CDN(unpkg.com)은 전부 HTTPS이므로 **App Transport Security 예외 설정이 필요 없습니다.** `NSAppTransportSecurity` 키는 건드리지 마세요.

## 5. 실행

- 툴바에서 시뮬레이터(예: iPhone 15 Pro) 또는 연결된 실기기 선택
- **⌘ + R** 로 빌드·실행
- 첫 실행 시 CDN 로드로 1~3초 지연될 수 있습니다 (이후에는 WKWebView 캐시에서 빠르게 로드됨)

## 6. 래퍼 코드가 실제로 하는 일 (`IgyeonaejaOneulDoApp.swift`)

| 설정 | 이유 |
|---|---|
| `contentInsetAdjustmentBehavior = .never` | CSS의 `env(safe-area-inset-*)`가 정확히 동작하도록 iOS의 자동 여백 보정 차단 |
| `scrollView.bounces = false` | 웹뷰 바운스 스크롤 차단 (CSS `overscroll-behavior`와 중복 방지) |
| `websiteDataStore = .default()` | localStorage를 기본 영구 저장소에 저장 |
| `allowsInlineMediaPlayback = true` | 인라인 미디어 재생 허용 (원본 스펙 요구사항) |
| `isOpaque = false` + softbg 배경색 | 로딩 시 흰 플래시 대신 앱 배경색 노출 |
| `allowsLinkPreview = false` | 의료 앱 성격상 롱프레스 프리뷰 비활성 |

## 7. 데이터 백업 / 복원

- **저장 위치**: WKWebView의 기본 저장소(`WKWebsiteDataStore.default()`)
- **앱 삭제 시**: localStorage도 함께 삭제됨 → 중요 의료 데이터는 주기 백업 권장
- **수동 백업 방법**:
  1. 웹 버전(`python3 -m http.server 8000`)을 Safari에서 연다
  2. 개발자 도구 콘솔에서 다음 실행:
     ```js
     const keys = ['igt_cheering','igt_mood','igt_treatment','igt_sideeffects',
                   'igt_medications','igt_vitals','igt_meals','igt_diary',
                   'igt_expenses','igt_insurance','igt_profile'];
     const dump = Object.fromEntries(keys.map(k => [k, JSON.parse(localStorage.getItem(k) || 'null')]));
     const blob = new Blob([JSON.stringify(dump, null, 2)], {type:'application/json'});
     const a = document.createElement('a');
     a.href = URL.createObjectURL(blob);
     a.download = `igt_backup_${new Date().toISOString().slice(0,10)}.json`;
     a.click();
     ```
- **네이티브 측 백업(추천)**: 중요한 의료 데이터는 `UserDefaults` 또는 Keychain으로 미러링하거나, CloudKit/iCloud Drive로 별도 동기화하는 것을 고려하세요.

## 8. 오프라인 사용 시

현재 `index.html`은 React/Tailwind/Recharts를 unpkg CDN에서 로드합니다. 완전한 오프라인 동작이 필요하면:

1. unpkg에서 받은 JS 파일을 번들에 포함 (`react.production.min.js`, `react-dom.production.min.js`, `prop-types.min.js`, `Recharts.js`, `babel.min.js`)
2. `index.html`의 `<script src="...">` 경로를 상대 경로로 변경
3. (선택) Tailwind CLI로 CSS 프리빌드 후 `<link rel="stylesheet">`로 교체 (Play CDN 제거)

번들 크기는 약 3~5 MB 증가합니다.

## 9. 알려진 주의사항

- WKWebView의 localStorage 쿼터는 실질적으로 수십 MB 수준으로 여유가 있지만, 이미지/큰 파일 저장 기능을 추가할 계획이라면 IndexedDB 재설계를 권장합니다.
- 앱 설치 후 첫 실행 시 오프라인이면 CDN 실패로 빈 화면이 뜹니다 → 오프라인 사용이 요구되면 8번 항목 적용 필수.
- iOS 시뮬레이터의 localStorage는 시뮬레이터 리셋 시 삭제됩니다 — 실기기 테스트 권장.
