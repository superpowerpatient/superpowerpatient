// ProgressCard 단독 스크린샷 — 여러 사이클 완료된 시나리오로 레벨업 표시 확인
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
  function inject() {
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }
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

// FOLFOX 14일 주기, 7차수 (5차 완료, 1차 진행 중, 1차 예정)
function ymdOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const seedScript = `
  localStorage.clear();
  localStorage.setItem('igt_schedule', JSON.stringify([
    { id:'s1', regimen:'FOLFOX', category:'colorectal', startDate:'${ymdOffset(-84)}', infusionDays:2, cycleDays:14, cycleNumber:1, memo:'1차' },
    { id:'s2', regimen:'FOLFOX', category:'colorectal', startDate:'${ymdOffset(-70)}', infusionDays:2, cycleDays:14, cycleNumber:2, memo:'2차' },
    { id:'s3', regimen:'FOLFOX', category:'colorectal', startDate:'${ymdOffset(-56)}', infusionDays:2, cycleDays:14, cycleNumber:3, memo:'3차' },
    { id:'s4', regimen:'FOLFOX', category:'colorectal', startDate:'${ymdOffset(-42)}', infusionDays:2, cycleDays:14, cycleNumber:4, memo:'4차' },
    { id:'s5', regimen:'FOLFOX', category:'colorectal', startDate:'${ymdOffset(-28)}', infusionDays:2, cycleDays:14, cycleNumber:5, memo:'5차' },
    { id:'s6', regimen:'FOLFOX', category:'colorectal', startDate:'${ymdOffset(-7)}',  infusionDays:2, cycleDays:14, cycleNumber:6, memo:'6차 진행 중' },
    { id:'s7', regimen:'FOLFOX', category:'colorectal', startDate:'${ymdOffset(7)}',   infusionDays:2, cycleDays:14, cycleNumber:7, memo:'7차 예정' },
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
  page.on('pageerror', (e) => console.log('  [pageerror]', e.message));

  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(seedScript);
  await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('button[aria-label="치료"]', { timeout: 25000 });
  await new Promise((r) => setTimeout(r, 800));

  // 치료 탭으로 이동
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button[aria-label]')];
    const t = btns.find((b) => b.getAttribute('aria-label') === '치료');
    if (t) t.click();
  });
  await new Promise((r) => setTimeout(r, 1500)); // 차트 렌더 시간

  // 풀페이지 + ProgressCard만 클립
  await page.screenshot({ path: `${OUT}/08-treatment-progress.png`, fullPage: true });
  console.log(`  📸 ${OUT}/08-treatment-progress.png (full)`);

  await browser.close();
  console.log('  ✅ 완료');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
