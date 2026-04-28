// 다이어리 테마 6종 + 스티커 확인
import puppeteer from 'puppeteer';
import { mkdirSync, readFileSync } from 'node:fs';

const LOCAL_REACT = readFileSync('node_modules/react/umd/react.production.min.js');
const LOCAL_REACT_DOM = readFileSync('node_modules/react-dom/umd/react-dom.production.min.js');
const LOCAL_PROP_TYPES = readFileSync('node_modules/prop-types/prop-types.min.js');
const LOCAL_RECHARTS = readFileSync('node_modules/recharts/umd/Recharts.js');
const LOCAL_BABEL = readFileSync('node_modules/@babel/standalone/babel.min.js');
const COMPILED_CSS = readFileSync('/tmp/igt-tailwind.css', 'utf8');

const TAILWIND_SHIM = `
window.tailwind = window.tailwind || { config: {} };
(function () {
  var css = ${JSON.stringify(COMPILED_CSS)};
  function inject() { var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
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

const ymd = (off) => {
  const d = new Date();
  d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const seedScript = `
  localStorage.clear();
  localStorage.setItem('igt_diarytheme', JSON.stringify('wood'));
  localStorage.setItem('igt_diary', JSON.stringify([
    { id:'d1', date:'${ymd(0)}',  mood:'😊', themeKey:'pink', stickers:['❤️','🌸','✨'],
      body:'외래 진료 받고 왔다. 다음 사이클 준비.\\n선생님이 잘 견디고 있다고 칭찬해주셨다.',
      grateful:['가족 응원','맛있는 점심','맑은 하늘'], hard:'아직 입맛이 잘 안 돌아온다.' },
    { id:'d2', date:'${ymd(-2)}', mood:'😐', themeKey:'navy', stickers:['⭐','🌙','🍀'],
      body:'오늘은 처지는 날. 그래도 일기는 꾸준히 쓰자.', grateful:['따뜻한 차 한 잔'], hard:'' },
    { id:'d3', date:'${ymd(-5)}', mood:'😄', themeKey:'wood', stickers:['🎀','🎗️'],
      body:'산책하면서 봄바람 맞으니 기분이 좋아졌어.', grateful:['봄 햇살'], hard:'' },
    { id:'d4', date:'${ymd(-8)}', mood:'😢', themeKey:'gray', stickers:['💙'],
      body:'피곤한 하루였다.', grateful:[], hard:'몸이 무겁다.' },
  ]));
  localStorage.setItem('igt_cheering', JSON.stringify([]));
`;

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=ko-KR', '--ignore-certificate-errors'],
    ignoreHTTPSErrors: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1');
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    for (const [needle, body, ct] of URL_MAP) {
      if (url.includes(needle)) {
        return req.respond({ status: 200, contentType: ct, headers: { 'Access-Control-Allow-Origin': '*' }, body });
      }
    }
    req.continue();
  });
  page.on('pageerror', (e) => console.log('  [pageerror]', e.message));

  await page.evaluateOnNewDocument(seedScript);
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('button[aria-label="일기"]', { timeout: 25000 });
  await new Promise((r) => setTimeout(r, 800));

  // 일기 탭
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button[aria-label]')].find((b) => b.getAttribute('aria-label') === '일기');
    if (t) t.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({ path: `${OUT}/16a-diary-themes.png`, fullPage: true });
  console.log(`  📸 ${OUT}/16a-diary-themes.png`);

  // 스티커 패널 열기 → 작성 폼 부분 보기 위해 스크롤
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTop = 700;
  });
  await new Promise((r) => setTimeout(r, 200));
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('스티커 패널 열기'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: `${OUT}/16b-sticker-panel.png` });
  console.log(`  📸 ${OUT}/16b-sticker-panel.png`);

  // 일기 카드 탭 → 모달
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTop = 99999;
  });
  await new Promise((r) => setTimeout(r, 200));
  await page.evaluate(() => {
    // 일기 목록의 첫 카드 클릭
    const lis = [...document.querySelectorAll('li')];
    const target = lis.find((li) => li.textContent.includes('외래 진료'));
    if (target) {
      const btn = target.querySelector('button');
      if (btn) btn.click();
    }
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${OUT}/16c-diary-modal.png` });
  console.log(`  📸 ${OUT}/16c-diary-modal.png`);

  await browser.close();
  console.log('  ✅ 완료');
})().catch((e) => { console.error(e); process.exit(1); });
