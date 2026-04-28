// 증상 추이 차트 (통증·체온·구토) 검증
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

// 14일치 시뮬레이션: 사이클 1일차에 가장 심하고 점진 회복
function makeRecord(offset, pain, fever, vomitC, vomitChar = '') {
  const r = {
    date: ymd(offset),
    fever: fever || null,
    sideEffects: { pain: pain || 0, nausea: pain >= 5 ? 2 : 0, vomit: vomitC > 0 ? 2 : 0, diarrhea: 0, constipation: 0, fatigue: pain >= 4 ? 2 : 1, appetite: 0, mouth: 0, handfoot: 0, hairloss: 0, numb: 0 },
    vomitCount: vomitC || 0,
    vomitChar,
    diarrheaCount: 0,
    diarrheaChar: '',
    meals: { breakfast:{content:'', ratio:0}, lunch:{content:'', ratio:0}, snack:{content:'', ratio:0}, dinner:{content:'', ratio:0}, water: 0 },
    meds: { painkiller:{taken:false,name:'',count:0}, antiemetic:{taken:false,name:'',count:0}, laxative:{taken:false,name:'',count:0}, antidiarrhea:{taken:false,name:'',count:0} },
    other: '',
    memo: '',
    updatedAt: ymd(offset) + 'T20:00:00',
  };
  return r;
}

const records = [
  makeRecord(-13, 6, 38.4, 4, '노란 거품'),
  makeRecord(-12, 7, 38.7, 5, '음식물'),
  makeRecord(-11, 5, 37.9, 2, '거품'),
  makeRecord(-10, 4, 37.4, 1),
  makeRecord(-9,  3, 37.0, 0),
  makeRecord(-8,  2, 36.8, 0),
  makeRecord(-7,  1, 36.6, 0),
  makeRecord(-6,  1, 36.5, 0),
  makeRecord(-5,  0, null, 0),
  makeRecord(-4,  0, null, 0),
  makeRecord(-3,  3, 37.2, 1),  // 다음 사이클 시작
  makeRecord(-2,  6, 38.1, 3, '노란 거품'),
  makeRecord(-1,  5, 37.8, 2, '음식물'),
  makeRecord(0,   4, 37.5, 1),
];

const seedScript = `
  localStorage.clear();
  localStorage.setItem('igt_dailyrecord', ${JSON.stringify(JSON.stringify(records))});
  localStorage.setItem('igt_profile', JSON.stringify({ height: 170 }));
  localStorage.setItem('igt_vitals', JSON.stringify([
    { id:'v1', date:'${ymd(-13)}', weight:67.5, bsa:1.78, bmi:23.4 },
    { id:'v2', date:'${ymd(-7)}',  weight:65.5, bsa:1.76, bmi:22.7 },
    { id:'v3', date:'${ymd(-1)}',  weight:63.0, bsa:1.72, bmi:21.8 },
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

  await page.evaluateOnNewDocument(seedScript);
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('button[aria-label="몸상태"]', { timeout: 25000 });
  await new Promise((r) => setTimeout(r, 800));

  // 몸상태 탭
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button[aria-label]')].find((b) => b.getAttribute('aria-label') === '몸상태');
    if (t) t.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  await page.screenshot({ path: `${OUT}/15-symptom-trends.png`, fullPage: true });
  console.log(`  📸 ${OUT}/15-symptom-trends.png`);

  await browser.close();
  console.log('  ✅ 완료');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
