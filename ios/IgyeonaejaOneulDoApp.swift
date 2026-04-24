import SwiftUI
import WebKit

// 「이겨내자 오늘도 🎗️」 iOS WKWebView 래퍼
// - 번들에 포함된 index.html을 로드하고, CSS env(safe-area-inset-*)가 제대로 동작하도록 설정
// - localStorage는 WKWebView 기본 저장소(.default)에 유지됨 (앱 삭제 시 함께 삭제)

@main
struct IgyeonaejaOneulDoApp: App {
    var body: some Scene {
        WindowGroup {
            WebContainer()
                .ignoresSafeArea()        // 노치/홈 인디케이터까지 컨텐츠가 뻗도록
                .preferredColorScheme(.light)
        }
    }
}

struct WebContainer: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let webpagePrefs = WKWebpagePreferences()
        webpagePrefs.allowsContentJavaScript = true

        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences = webpagePrefs
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.websiteDataStore = .default()   // localStorage 영구 저장

        let webView = WKWebView(frame: .zero, configuration: config)

        // ★ viewport-fit=cover + env(safe-area-inset-*)가 정상 동작하려면 필수
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.scrollView.alwaysBounceVertical = false
        webView.scrollView.alwaysBounceHorizontal = false
        webView.scrollView.showsVerticalScrollIndicator = false
        webView.scrollView.showsHorizontalScrollIndicator = false

        // 초기 배경색을 앱의 softbg(#FFF8FC)와 맞춰 로딩 플리커 방지
        let softbg = UIColor(red: 1.0, green: 0.973, blue: 0.988, alpha: 1.0)
        webView.isOpaque = false
        webView.backgroundColor = softbg
        webView.scrollView.backgroundColor = softbg

        // 롱프레스 링크 프리뷰는 의료앱 성격상 비활성화
        webView.allowsLinkPreview = false

        // 번들에 추가된 index.html 로드
        if let url = Bundle.main.url(forResource: "index", withExtension: "html") {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } else {
            webView.loadHTMLString(
                """
                <html><body style="font-family:-apple-system;padding:24px;color:#E91E8C">
                <h3>index.html을 Xcode 프로젝트에 추가해주세요</h3>
                <p>Target Membership에 체크되어 있는지도 확인하세요.</p>
                </body></html>
                """,
                baseURL: nil
            )
        }
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
