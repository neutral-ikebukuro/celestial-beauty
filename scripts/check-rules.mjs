// 全星座 × 1年分で、鑑定と料理選びが必ず成立するかを確かめる
import { createServer } from 'vite';
const v = await createServer({ server: { middlewareMode: true }, logLevel: 'error' });
const { computeSky } = await v.ssrLoadModule('/src/lib/sky.ts');
const { makeReading } = await v.ssrLoadModule('/src/lib/reading.ts');
const { pickFood } = await v.ssrLoadModule('/src/lib/foodRule.ts');
const { FOODS } = await v.ssrLoadModule('/src/data/foods.ts');
const used = new Set(); let repeats = 0;
for (let sign = 0; sign < 12; sign++) {
  let prev = -1;
  for (let d = 0; d < 365; d++) {
    const sky = computeSky(new Date(Date.UTC(2026, 0, 1, 3) + d * 864e5));
    const r = makeReading(sky, sign); const p = pickFood(sky, sign);
    if (!p.food || !r.overall.text || r.overall.level < 1) throw new Error('empty ' + sign + ' ' + d);
    if (p.food.id === prev) repeats++;
    prev = p.food.id; used.add(p.food.id);
  }
}
const s = computeSky(new Date('2026-11-14T03:00:00Z'));
console.log('料理', FOODS.length, '品 / 1年で使われた', used.size, '品 / 前日と同じ', repeats, '回');
console.log(s.bodies.map((b) => `${b.ja}${b.lon.toFixed(1)}°`).join(' '));
await v.close();
