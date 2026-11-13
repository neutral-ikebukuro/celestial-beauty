import { useEffect, useRef, useState } from 'react';
import { SIGNS } from '../data/zodiac';
import type { Sky } from '../lib/sky';
import type { Reading } from '../lib/reading';
import type { FoodPick } from '../lib/foodRule';

interface Props {
  sky: Sky;
  reading: Reading;
  pick: FoodPick;
  snapshot: () => HTMLCanvasElement | null;
  onClose: () => void;
}

const W = 1080;
const H = 1350;
const ROTATE = new Set(['ー', '〜', '…', '-', '—']);

function drawVertical(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, gap = 1.12) {
  let cy = y;
  for (const ch of text) {
    if (ch === ' ') { cy += size * 0.5; continue; }
    ctx.save();
    ctx.translate(x, cy + size / 2);
    if (ROTATE.has(ch)) ctx.rotate(Math.PI / 2);
    if ('ゃゅょっぁぃぅぇぉャュョッァィゥェォ'.includes(ch)) ctx.translate(size * 0.12, -size * 0.12);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    cy += size * gap;
  }
  return cy;
}

export function ShareSheet({ sky, reading, pick, snapshot, onClose }: Props) {
  const [withSign, setWithSign] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const blobRef = useRef<Blob | null>(null);
  const shot = useRef<HTMLCanvasElement | null>(null);

  // WebGL の画面は開いた瞬間に1度だけ写す
  useEffect(() => {
    const src = snapshot();
    if (src) {
      const c = document.createElement('canvas');
      c.width = src.width; c.height = src.height;
      c.getContext('2d')!.drawImage(src, 0, 0);
      shot.current = c;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      await Promise.all([
        document.fonts.load('500 120px "Shippori Mincho B1"', pick.food.name),
        document.fonts.load('300 60px "Cormorant Garamond"'),
        document.fonts.load('italic 300 60px "Cormorant Garamond"'),
        document.fonts.load('400 30px "Noto Sans JP"', '総合運美容運今日のラッキーフード'),
      ]).catch(() => {});
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d')!;
      ctx.fillStyle = '#170D19';
      ctx.fillRect(0, 0, W, H);
      const src = shot.current;
      if (src) {
        // 天体盤の写真を上部に
        const sw = src.width, sh = src.height;
        const scale = Math.max(W / sw, (H * 0.8) / sh);
        const dw = sw * scale, dh = sh * scale;
        ctx.globalAlpha = 0.9;
        ctx.drawImage(src, (W - dw) / 2, -dh * 0.12, dw, dh);
        ctx.globalAlpha = 1;
      } else {
        const img = new Image();
        img.src = `${import.meta.env.BASE_URL}img/poster-tall.webp`;
        await img.decode().catch(() => {});
        if (img.naturalWidth) {
          const scale = W / img.naturalWidth;
          ctx.globalAlpha = 0.9;
          ctx.drawImage(img, 0, -H * 0.08, W, img.naturalHeight * scale);
          ctx.globalAlpha = 1;
        }
      }
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(23,13,25,0.15)');
      g.addColorStop(0.42, 'rgba(23,13,25,0.55)');
      g.addColorStop(0.7, 'rgba(23,13,25,0.94)');
      g.addColorStop(1, 'rgba(23,13,25,1)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // 文字
      ctx.fillStyle = '#ECE8F1';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      const name = pick.food.name;
      const parts = name.split(' ');
      const longest = Math.max(...parts.map((p) => [...p].length));
      const size = Math.min(104, Math.floor(700 / (longest * 1.12)));
      ctx.font = `500 ${size}px "Shippori Mincho B1", serif`;
      parts.forEach((p, i) => drawVertical(ctx, p, W - 150 - i * size * 1.35, 330 + i * size * 1.2, size));

      ctx.textAlign = 'left';
      ctx.fillStyle = '#CCB4E5';
      ctx.font = 'italic 300 46px "Cormorant Garamond", serif';
      ctx.fillText('Today’s lucky food', 84, 360);
      ctx.fillStyle = '#ECE8F1';
      ctx.font = '400 30px "Noto Sans JP", sans-serif';
      ctx.fillText(sky.dateLabel, 84, 420);
      if (withSign) ctx.fillText(SIGNS[reading.sign].ja, 84, 470);

      // 総合運・美容運
      const meter = (y: number, label: string, level: number) => {
        ctx.fillStyle = '#ECE8F1';
        ctx.font = '400 28px "Noto Sans JP", sans-serif';
        ctx.fillText(label, 84, y);
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = i < level ? '#E24B91' : 'rgba(236,232,241,0.22)';
          ctx.fillRect(220 + i * 46, y - 2, 34, 3);
        }
      };
      meter(H - 330, '総合運', reading.overall.level);
      meter(H - 270, '美容運', reading.beauty.level);
      ctx.fillStyle = '#ECE8F1';
      ctx.font = '500 52px "Shippori Mincho B1", serif';
      ctx.fillText(reading.overall.keyword, 84, H - 405);

      ctx.strokeStyle = 'rgba(236,232,241,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(84, H - 170); ctx.lineTo(W - 84, H - 170); ctx.stroke();
      ctx.font = '300 40px "Cormorant Garamond", serif';
      ctx.fillStyle = '#ECE8F1';
      ctx.fillText('NEUTRAL', 84, H - 110);
      ctx.font = '400 24px "Noto Sans JP", sans-serif';
      ctx.fillStyle = 'rgba(236,232,241,0.7)';
      ctx.fillText('美容占星術と今日の一皿', 300, H - 110);

      const blob: Blob | null = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.92));
      if (!alive || !blob) return;
      blobRef.current = blob;
      setUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(blob); });
    })();
    return () => { alive = false; };
  }, [withSign, pick, reading, sky]);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const text = `今日のラッキーフードは「${pick.food.name}」。${withSign ? `(${SIGNS[reading.sign].ja})` : ''}`;
  const pageUrl = location.origin + location.pathname; // 入力した情報は入れない

  const share = async () => {
    const blob = blobRef.current;
    if (!blob) return;
    const file = new File([blob], 'celestial-beauty.jpg', { type: 'image/jpeg' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, url: pageUrl });
      } else if (navigator.share) {
        await navigator.share({ text, url: pageUrl });
      } else {
        await navigator.clipboard.writeText(`${text} ${pageUrl}`);
        setMsg('文章をコピーしました');
      }
    } catch { /* キャンセル */ }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(`${text} ${pageUrl}`); setMsg('文章をコピーしました'); } catch { setMsg('コピーできませんでした'); }
  };

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="結果を共有">
      <div className="sheet__scrim" onClick={onClose} />
      <div className="sheet__panel sheet__panel--share">
        <button className="sheet__close" onClick={onClose} aria-label="閉じる">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <h2 className="share__title">結果を共有する</h2>
        <p className="fine">誕生日は入りません。画像と文章だけを共有します。</p>
        <div className="share__preview">{url ? <img src={url} alt="共有用の画像" /> : <div className="share__wait" />}</div>
        <label className="toggle">
          <input type="checkbox" checked={withSign} onChange={(e) => setWithSign(e.target.checked)} />
          <span className="toggle__ui" aria-hidden="true" />
          星座名を入れる
        </label>
        <div className="share__btns">
          <button className="cta" onClick={share} disabled={!url}><span>画像を共有</span></button>
          {url && <a className="ghost" href={url} download="celestial-beauty.jpg">画像を保存</a>}
          <button className="ghost" onClick={copy}>文章をコピー</button>
        </div>
        <p className="share__msg" aria-live="polite">{msg}</p>
      </div>
    </div>
  );
}
