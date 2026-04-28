// 5개 탭 + 모달들의 스크린샷을 찍는다.
// 시드 데이터를 미리 localStorage에 주입해 빈 화면이 아닌 실제 사용 모습으로.
// CDN이 막힌 환경이므로 npm 로컬 패키지 + 미리 컴파일한 Tailwind CSS로 응답.
import puppeteer from 'puppeteer';
import { mkdirSync, readFileSync } from 'node:fs';

// 로컬 npm 패키지에서 UMD 번들 + 미리 컴파일된 Tailwind CSS 로드
const LOCAL_REACT = readFileSync('node_modules/react/umd/react.production.min.js');
const LOCAL_REACT_DOM = readFileSync('node_modules/react-dom/umd/react-dom.production.min.js');
const LOCAL_PROP_TYPES = readFileSync('node_modules/prop-types/prop-types.min.js');
const LOCAL_RECHARTS = readFileSync('node_modules/recharts/umd/Recharts.js');
const LOCAL_BABEL = readFileSync('node_modules/@babel/standalone/babel.min.js');
const COMPILED_CSS = readFileSync('/tmp/igt-tailwind.css', 'utf8');

// Tailwind Play CDN을 흉내내는 shim:
// - window.tailwind 객체 노출 (config 할당 무에러)
// - 미리 컴파일된 CSS를 head에 주입
const TAILWIND_SHIM = `
window.tailwind = window.tailwind || { config: {} };
(function () {
  var css = ${JSON.stringify(COMPILED_CSS)};
  function inject() {
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
`;

const URL_MAP = [
  ['react@18/umd/react.production.min.js', LOCAL_REACT, 'application/javascript'],
  ['react-dom@18/umd/react-dom.production.min.js', LOCAL_REACT_DOM, 'application/javascript'],
  ['prop-types@15.8.1/prop-types.min.js', LOCAL_PROP_TYPES, 'application/javascript'],
  ['recharts@2.12.7/umd/Recharts.js', LOCAL_RECHARTS, 'application/javascript'],
  ['@babel/standalone/babel.min.js', LOCAL_BABEL, 'application/javascript'],
  ['cdn.tailwindcss.com', TAILWIND_SHIM, 'application/javascript'],
];

const URL = 'http://localhost:8765/index.html';
const OUT = '/tmp/igt-shots';
mkdirSync(OUT, { recursive: true });

// iPhone 14 Pro 사이즈
const DEVICE = { width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const today = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();
const ymd = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const seedScript = `
  localStorage.clear();
  localStorage.setItem('igt_cheering', JSON.stringify([
    { id:'c1', date: '${today}', mood:'😊', text:'오늘도 힘내자! 작은 한 걸음이 큰 변화를 만든다 💪' },
    { id:'c2', date: '${ymd(-1)}', mood:'😄', text:'어제는 정말 좋은 하루였다. 가족과 함께한 시간이 가장 큰 힘.' },
    { id:'c3', date: '${ymd(-3)}', mood:'😐', text:'힘들었지만 잘 견뎌냈다.' },
    { id:'c4', date: '${ymd(-5)}', mood:'😊', text:'산책하면서 봄바람 맞으니 기분이 좋아졌어.' },
  ]));
  localStorage.setItem('igt_mood', JSON.stringify([
    { date:'${today}', emoji:'😊', value:'good' },
  ]));
  localStorage.setItem('igt_diary', JSON.stringify([
    { id:'d1', date:'${today}', mood:'😊', body:'외래 진료받고 왔다. 다음 사이클 준비.\\n선생님이 잘 견디고 있다고 칭찬해주셨다.', grateful:['가족 응원','맛있는 점심','맑은 하늘'], hard:'아직 입맛이 잘 안 돌아온다.' },
    { id:'d2', date:'${ymd(-2)}', mood:'😐', body:'오늘은 좀 처지는 날. 그래도 일기는 꾸준히.', grateful:['따뜻한 차 한 잔'], hard:'' },
  ]));
  localStorage.setItem('igt_schedule', JSON.stringify([
    { id:'s1', regimen:'FOLFOX', category:'colorectal',
      startDate:'${ymd(-3)}', infusionDays:2, cycleDays:14, cycleNumber:5, memo:'외래 후 46시간 지속주입' },
  ]));
  localStorage.setItem('igt_expenses', JSON.stringify([
    { id:'e1', date:'${today}', item:'외래 진료비', amount:38500, category:'진료비', payment:'카드' },
    { id:'e2', date:'${ymd(-1)}', item:'CT 검사', amount:182000, category:'검사비', payment:'실비청구' },
    { id:'e3', date:'${ymd(-3)}', item:'경구 항암제', amount:124000, category:'약제비', payment:'카드' },
    { id:'e4', date:'${ymd(-7)}', item:'외래', amount:42000, category:'진료비', payment:'카드' },
    { id:'e5', date:'${ymd(-15)}', item:'입원비', amount:380000, category:'입원비', payment:'실비청구' },
  ]));
  localStorage.setItem('igt_insurance', JSON.stringify([
    { id:'ins1', company:'OO생명', type:'실손', limit:50000000, received:8200000 },
    { id:'ins2', company:'△△화재', type:'암보험', limit:30000000, received:25000000 },
  ]));
  localStorage.setItem('igt_medreminders', JSON.stringify([
    { id:'m1', name:'타이레놀', time:'09:00', weekdays:[0,1,2,3,4,5,6], enabled:true, createdAt:'${today}T00:00:00' },
    { id:'m2', name:'경구 항암제', time:'08:00', weekdays:[1,2,3,4,5], enabled:true, createdAt:'${today}T00:00:00' },
    { id:'m3', name:'제토제', time:'14:00', weekdays:[1,3,5], enabled:false, createdAt:'${today}T00:00:00' },
  ]));
  localStorage.setItem('igt_notify_cycle', JSON.stringify(true));
`;

async function shoot(page, name, opts = {}) {
  const file = `${OUT}/${name}.png`;
  await page.screenshot({ path: file, fullPage: !!opts.fullPage });
  console.log(`  📸 ${file}${opts.fullPage ? ' (full)' : ''}`);
  return file;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--lang=ko-KR',
      '--ignore-certificate-errors',
    ],
    ignoreHTTPSErrors: true,
  });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    for (const [needle, body, ct] of URL_MAP) {
      if (url.includes(needle)) {
        return req.respond({
          status: 200,
          contentType: ct,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body,
        });
      }
    }
    req.continue();
  });
  await page.setViewport(DEVICE);
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1');

  page.on('console', (msg) => console.log('  [page]', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('  [pageerror]', err.message));
  page.on('requestfailed', (req) =>
    console.log('  [reqfail]', req.url(), req.failure()?.errorText));

  // 시드 데이터를 먼저 주입
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(seedScript);
  await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });

  // React가 mount되어 탭바가 나타날 때까지 대기
  await page.waitForSelector('button[aria-label="치료"]', { timeout: 25000 });
  await new Promise((r) => setTimeout(r, 800));

  // 1. 홈 탭
  await shoot(page, '01-home', { fullPage: true });

  // 2. 치료 탭
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button[aria-label]')];
    const t = btns.find((b) => b.getAttribute('aria-label') === '치료');
    if (t) t.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  await shoot(page, '02-treatment', { fullPage: true });

  // 3. 일기 탭
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button[aria-label]')];
    const t = btns.find((b) => b.getAttribute('aria-label') === '일기');
    if (t) t.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  await shoot(page, '03-diary', { fullPage: true });

  // 4. 병원비 탭
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button[aria-label]')];
    const t = btns.find((b) => b.getAttribute('aria-label') === '병원비');
    if (t) t.click();
  });
  await new Promise((r) => setTimeout(r, 1500)); // 차트 렌더 대기
  await shoot(page, '04-expense', { fullPage: true });

  // 5. 다시 치료 탭 → 모달 열기
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button[aria-label]')];
    const t = btns.find((b) => b.getAttribute('aria-label') === '치료');
    if (t) t.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const add = btns.find((b) => b.textContent.includes('항암 스케줄 추가'));
    if (add) add.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await shoot(page, '05-modal-step1');

  // 모달 1단계에서 대장암 선택
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const t = btns.find((b) => b.textContent.includes('대장암'));
    if (t) t.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  await shoot(page, '06-modal-step2');

  // FOLFOX 선택
  await page.evaluate(() => {
    const items = [...document.querySelectorAll('button')];
    // FOLFOX 옆 [선택] 버튼 찾기
    const buttons = items.filter((b) => b.textContent.trim() === '선택');
    if (buttons[0]) buttons[0].click();
  });
  await new Promise((r) => setTimeout(r, 400));
  await shoot(page, '07-modal-step3');

  await browser.close();
  console.log('\n  ✅ 완료');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
