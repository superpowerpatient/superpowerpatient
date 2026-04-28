// BodyTab 스크린샷 — 신체계측 + BSA 결과 + 체중 추이 차트
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

const ymd = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const seedScript = `
  localStorage.clear();
  localStorage.setItem('igt_profile', JSON.stringify({ height: 170 }));
  localStorage.setItem('igt_vitals', JSON.stringify([
    { id:'v1', date:'${ymd(-56)}', weight:67.5, bsa:1.78, bmi:23.4 },
    { id:'v2', date:'${ymd(-42)}', weight:66.8, bsa:1.77, bmi:23.1 },
    { id:'v3', date:'${ymd(-28)}', weight:65.5, bsa:1.76, bmi:22.7 },
    { id:'v4', date:'${ymd(-21)}', weight:64.2, bsa:1.74, bmi:22.2 },
    { id:'v5', date:'${ymd(-14)}', weight:63.1, bsa:1.72, bmi:21.8 },
    { id:'v6', date:'${ymd(-7)}',  weight:62.8, bsa:1.72, bmi:21.7 },
    { id:'v7', date:'${ymd(-3)}',  weight:62.5, bsa:1.71, bmi:21.6 },
    { id:'v8', date:'${ymd(-1)}',  weight:63.0, bsa:1.72, bmi:21.8 },
  ]));
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

  // 시드를 페이지 로드 전에 주입 (reload 회피)
  await page.evaluateOnNewDocument(seedScript);
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('button[aria-label="몸상태"]', { timeout: 25000 });
  await new Promise((r) => setTimeout(r, 800));

  // 몸상태 탭으로 이동
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button[aria-label]')];
    const t = btns.find((b) => b.getAttribute('aria-label') === '몸상태');
    if (t) t.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // 키/체중 입력
  await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input[type="number"]')];
    if (inputs[1]) {
      inputs[1].focus();
    }
  });
  await page.keyboard.type('63');
  await new Promise((r) => setTimeout(r, 300));

  // BSA 계산 버튼
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('BSA 계산'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: `${OUT}/12-body-vitals.png`, fullPage: true });
  console.log(`  📸 ${OUT}/12-body-vitals.png`);

  await browser.close();
  console.log('  ✅ 완료');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
