import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Stage, Mode } from '../three/stage';
import type { Sky } from '../lib/sky';
import type { Aspect } from '../data/readings';

export interface CelestialHandle {
  select(sign: number): void;
  read(sky: Sky, aspects: { key: string; aspect: Aspect }[], colors: string[], done: () => void): void;
  skip(): void;
  reset(): void;
  mode(m: Mode): void;
  snapshot(): HTMLCanvasElement | null;
  ready(): boolean;
}

interface Props {
  sky: Sky;
  reducedMotion: boolean;
  onSelect: (sign: number) => void;
  onFallback: (v: boolean) => void;
}

const BASE = import.meta.env.BASE_URL;

export const Celestial = forwardRef<CelestialHandle, Props>(function Celestial({ sky, reducedMotion, onSelect, onFallback }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const pending = useRef<number | null>(null);
  const [fallback, setFallback] = useState(false);
  const [live, setLive] = useState(false);
  const selectCb = useRef(onSelect);
  selectCb.current = onSelect;

  useEffect(() => {
    let disposed = false;
    (async () => {
      const forceLite = new URLSearchParams(location.search).has('lite');
      const { Stage, detectTier } = await import('../three/stage');
      const tier = forceLite ? 'none' : detectTier();
      if (tier === 'none') { setFallback(true); onFallback(true); return; }
      // 盤の刻印に使う欧文フォントを先に読み込む
      try { await document.fonts.load('300 48px "Cormorant Garamond"'); } catch { /* なくても描ける */ }
      if (disposed || !canvasRef.current) return;
      try {
        const st = new Stage(canvasRef.current, { tier, reducedMotion, onSelect: (s) => selectCb.current(s) });
        stageRef.current = st;
        st.setSky(sky);
        if (pending.current !== null) st.selectSign(pending.current);
        canvasRef.current.addEventListener('webglcontextlost', () => { setFallback(true); onFallback(true); });
        requestAnimationFrame(() => setLive(true));
      } catch {
        setFallback(true); onFallback(true);
      }
    })();
    return () => { disposed = true; stageRef.current?.dispose(); stageRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    select(sign) { if (stageRef.current) stageRef.current.selectSign(sign); else pending.current = sign; },
    read(sky, aspects, colors, done) { if (stageRef.current) stageRef.current.playReading(sky, aspects, colors, done); else done(); },
    skip() { stageRef.current?.skip(); },
    reset() { stageRef.current?.resetForSelect(); },
    mode(m) { stageRef.current?.setMode(m); },
    snapshot() { return stageRef.current ? stageRef.current.snapshot() : null; },
    ready() { return !!stageRef.current; },
  }));

  return (
    <div className={`celestial ${live ? 'is-live' : ''} ${fallback ? 'is-fallback' : ''}`} aria-hidden="true">
      <picture className="celestial__poster">
        <source media="(min-aspect-ratio: 21/20)" type="image/avif" srcSet={`${BASE}img/poster-wide.avif`} />
        <source media="(min-aspect-ratio: 21/20)" type="image/webp" srcSet={`${BASE}img/poster-wide.webp`} />
        <source type="image/avif" srcSet={`${BASE}img/poster-tall.avif`} />
        <img src={`${BASE}img/poster-tall.webp`} alt="" decoding="async" />
      </picture>
      {!fallback && <canvas ref={canvasRef} className="celestial__canvas" />}
    </div>
  );
});
