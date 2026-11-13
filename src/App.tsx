import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Celestial, type CelestialHandle } from './components/Celestial';
import { SelectScreen } from './components/SelectScreen';
import { ResultScreen } from './components/ResultScreen';
import { DetailSheet } from './components/DetailSheet';
import { ShareSheet } from './components/ShareSheet';
import { computeSky, tokyoDateKey } from './lib/sky';
import { makeReading } from './lib/reading';
import { pickFood } from './lib/foodRule';

type Phase = 'select' | 'reading' | 'result';

function useReducedMotion() {
  const [rm, setRm] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setRm(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return rm;
}

export default function App() {
  const reducedMotion = useReducedMotion();
  const [dateKey, setDateKey] = useState(() => tokyoDateKey());
  const sky = useMemo(() => computeSky(), [dateKey]);
  const [sign, setSign] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('select');
  const [sheet, setSheet] = useState<'none' | 'detail' | 'share'>('none');
  const [fallback, setFallback] = useState(false);
  const stage = useRef<CelestialHandle>(null);

  // 日付が変わったら空を計算し直す(開きっぱなしの翌朝にも対応)
  useEffect(() => {
    const f = () => { if (!document.hidden) setDateKey(tokyoDateKey()); };
    document.addEventListener('visibilitychange', f);
    const id = setInterval(f, 60_000);
    return () => { document.removeEventListener('visibilitychange', f); clearInterval(id); };
  }, []);

  const reading = useMemo(() => (sign === null ? null : makeReading(sky, sign)), [sky, sign]);
  const pick = useMemo(() => (sign === null ? null : pickFood(sky, sign)), [sky, sign]);

  const choose = useCallback((s: number) => {
    setSign(s);
    stage.current?.select(s);
  }, []);

  const onStageSelect = useCallback((s: number) => { if (phase === 'select') choose(s); }, [phase, choose]);

  const startReading = () => {
    if (sign === null || !reading || !pick) return;
    setPhase('reading');
    history.pushState({ p: 'result' }, '');
    stage.current?.read(sky, reading.links.map((l) => ({ key: l.key, aspect: l.aspect })), pick.colors, () => setPhase('result'));
    if (!stage.current?.ready()) setPhase('result');
    // 描画が止まっている端末でも必ず結果へ進む
    window.setTimeout(() => setPhase((ph) => (ph === 'reading' ? 'result' : ph)), reducedMotion ? 400 : 3400);
  };

  const skip = () => { stage.current?.skip(); setPhase('result'); };

  const back = useCallback(() => {
    setSheet('none');
    setPhase('select');
    stage.current?.reset();
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const f = () => { if (phase !== 'select') back(); };
    window.addEventListener('popstate', f);
    return () => window.removeEventListener('popstate', f);
  }, [phase, back]);

  useEffect(() => {
    document.body.classList.toggle('lock', phase !== 'result' || sheet !== 'none');
  }, [phase, sheet]);

  return (
    <div className={`app phase-${phase} ${fallback ? 'no-webgl' : ''}`}>
      <Celestial ref={stage} sky={sky} reducedMotion={reducedMotion} onSelect={onStageSelect} onFallback={setFallback} />
      <div className="veil" aria-hidden="true" />

      {phase === 'select' && (
        <SelectScreen sky={sky} sign={sign} onSign={choose} onStart={startReading} fallback={fallback} />
      )}

      {phase === 'reading' && reading && (
        <div className="reading" onClick={skip} role="status" aria-live="polite">
          <p className="reading__date">{sky.dateLabel} 12:00 東京の空</p>
          <p className="reading__line">七つの天体を、今日の位置へ。</p>
          <button className="reading__skip" onClick={skip}>スキップ</button>
        </div>
      )}

      {phase === 'result' && reading && pick && (
        <ResultScreen
          sky={sky}
          reading={reading}
          pick={pick}
          reducedMotion={reducedMotion}
          onDetail={() => setSheet('detail')}
          onShare={() => setSheet('share')}
          onBack={() => history.back()}
        />
      )}

      {sheet === 'detail' && pick && <DetailSheet pick={pick} onClose={() => setSheet('none')} />}
      {sheet === 'share' && pick && reading && (
        <ShareSheet sky={sky} reading={reading} pick={pick} snapshot={() => stage.current?.snapshot() ?? null} onClose={() => setSheet('none')} />
      )}
    </div>
  );
}
