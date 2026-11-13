// WebGL 非対応端末用の静止画を、実際の 3D 画面から書き出す
import { chromium } from '@playwright/test';
const url = process.argv[2] || 'http://127.0.0.1:5188/';
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [name, w, h, dpr] of [['tall', 430, 932, 2], ['wide', 1440, 900, 1.5]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: '.select,.veil{display:none!important}' });
  await p.waitForTimeout(6000);
  await p.screenshot({ path: `../work/poster/${name}.png` });
  await p.close();
}
await b.close();
