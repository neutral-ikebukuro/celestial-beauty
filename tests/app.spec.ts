import { test, expect, type Page } from '@playwright/test';

async function pickBirthday(page: Page) {
  await page.selectOption('select[aria-label="誕生月"]', '11');
  await page.selectOption('select[aria-label="誕生日"]', '8');
  await expect(page.locator('.picker__ja')).toHaveText('蠍座');
}

test('誕生日から鑑定・詳細・共有まで操作できる', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (r) => { const u = new URL(r.url()); if (!['127.0.0.1', 'localhost'].includes(u.hostname) && !u.protocol.startsWith('blob') && !u.protocol.startsWith('data')) external.push(r.url()); });
  await page.goto('/');
  await pickBirthday(page);
  await page.click('.cta');
  await page.locator('.reading__skip').click({ force: true, timeout: 3000 }).catch(() => {}); // 演出が先に終わっていてもよい
  await expect(page.locator('.dish__name')).toBeVisible();
  // 入力した月日が URL・保存領域に残らない
  expect(new URL(page.url()).search + new URL(page.url()).hash).toBe('');
  const stored = await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie]);
  expect(stored).toEqual([0, 0, '']);
  await page.click('.dish__more');
  await expect(page.locator('.detail__nut dt').first()).toBeVisible();
  await page.click('.sheet__close');
  await page.click('.actions .cta');
  await expect(page.locator('.share__preview img')).toBeVisible({ timeout: 15000 });
  expect(external).toEqual([]);
});

test('戻ると星座選択に戻れる', async ({ page }) => {
  await page.goto('/');
  await pickBirthday(page);
  await page.click('.cta');
  await page.locator('.reading__skip').click({ force: true, timeout: 3000 }).catch(() => {}); // 演出が先に終わっていてもよい
  await page.click('.result__bar .textbtn');
  await expect(page.locator('.picker')).toBeVisible();
});

test('WebGL が使えない端末では静止画で表示し、操作できる', async ({ page }) => {
  await page.goto('/?lite');
  await expect(page.locator('.celestial.is-fallback')).toBeVisible();
  await page.click('button[aria-label="次の星座"]');
  await expect(page.locator('.picker__ja')).toHaveText('牡羊座');
  await page.click('.cta');
  await expect(page.locator('.dish__name')).toBeVisible();
});

test('動きを減らす設定でもすぐ結果が出る', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  await pickBirthday(page);
  await page.click('.cta');
  await expect(page.locator('.dish__name')).toBeVisible({ timeout: 2000 });
  await ctx.close();
});

