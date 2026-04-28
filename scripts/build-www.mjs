// Capacitor용 www/ 폴더에 정적 자산을 복사하는 빌드 스크립트.
// 빌드 도구가 없는 단일 HTML 앱이므로, 파일 복사만 수행한다.
// 사용: npm run build
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'www');

const ASSETS = [
  'index.html',
  'manifest.json',
  'sw.js',
  'icons',
];

async function main() {
  if (existsSync(OUT)) {
    await rm(OUT, { recursive: true, force: true });
  }
  await mkdir(OUT, { recursive: true });

  for (const item of ASSETS) {
    const src = resolve(ROOT, item);
    if (!existsSync(src)) {
      console.warn(`  [skip] ${item} (없음)`);
      continue;
    }
    const dst = resolve(OUT, item);
    await cp(src, dst, { recursive: true });
    console.log(`  [copy] ${item}`);
  }
  console.log(`\n  ✅ ${join('www')} 준비 완료`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
