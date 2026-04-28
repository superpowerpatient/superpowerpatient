// 캘린더 날짜 탭 → DailyRecordModal 검증
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
  localStorage.setItem('igt_schedule', JSON.stringify([
    { id:'s1', regimen:'FOLFOX', category:'colorectal', startDate:'${ymd(-3)}', infusionDays:2, cycleDays:14, cycleNumber:5, memo:'5차' },
  ]));
  localStorage.setItem('igt_dailyrecord', JSON.stringify([
    { date:'${ymd(-3)}', fever:38.4, sideEffects:{pain:2, nausea:3, vomit:1, diarrhea:0, constipation:0, fatigue:2, appetite:1, mouth:0, handfoot:0, hairloss:0, numb:1}, other:'어지러움', memo:'1일차 입원, 컨디션 안 좋음', updatedAt:'${ymd(-3)}T20:00:00' },
    { date:'${ymd(-2)}', fever:37.2, sideEffects:{pain:1, nausea:1, vomit:0, diarrhea:0, constipation:0, fatigue:1, appetite:0, mouth:0, handfoot:0, hairloss:0, numb:0}, other:'', memo:'2일차, 조금 회복', updatedAt:'${ymd(-2)}T20:00:00' },
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
  await new Promise((r) => setTimeout(r, 1500));

  // 캘린더 영역만 스크린샷
  await page.screenshot({ path: `${OUT}/09-calendar-with-dots.png`, fullPage: false });
  console.log(`  📸 ${OUT}/09-calendar-with-dots.png`);

  // 어제 날짜 칸 클릭 → 모달 열기
  const yesterdayKey = ymd(-1);
  await page.evaluate((dateKey) => {
    const btns = [...document.querySelectorAll('button[aria-label]')];
    const cell = btns.find((b) => b.getAttribute('aria-label') === `${dateKey} 기록 열기`);
    if (cell) cell.click();
  }, yesterdayKey);
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${OUT}/10-record-modal-empty.png`, fullPage: false });
  console.log(`  📸 ${OUT}/10-record-modal-empty.png`);

  // 모달 닫기
  await page.evaluate(() => {
    const close = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '닫기');
    if (close) close.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  // 3일 전 (기록 있음) 클릭
  await page.evaluate((dateKey) => {
    const btns = [...document.querySelectorAll('button[aria-label]')];
    const cell = btns.find((b) => b.getAttribute('aria-label') === `${dateKey} 기록 열기`);
    if (cell) cell.click();
  }, ymd(-3));
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${OUT}/11-record-modal-filled.png`, fullPage: true });
  console.log(`  📸 ${OUT}/11-record-modal-filled.png`);

  await browser.close();
  console.log('  ✅ 완료');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
