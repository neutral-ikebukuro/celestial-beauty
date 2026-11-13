import { useEffect, useRef } from 'react';
import { SIGNS, ELEMENT_JA } from '../data/zodiac';
import { INGREDIENTS } from '../data/ingredients';
import { ASPECT_NOTE } from '../data/readings';
import type { Sky } from '../lib/sky';
import type { Reading } from '../lib/reading';
import type { FoodPick } from '../lib/foodRule';

interface Props {
  sky: Sky;
  reading: Reading;
  pick: FoodPick;
  reducedMotion: boolean;
  onDetail: () => void;
  onShare: () => void;
  onBack: () => void;
}

export function Meter({ level, label }: { level: number; label: string }) {
  return (
    <div className="meter" role="img" aria-label={`${label} 5段階中${level}`}>
      {Array.from({ length: 5 }, (_, i) => <span key={i} className={i < level ? 'on' : ''} />)}
    </div>
  );
}

export function ResultScreen({ sky, reading, pick, reducedMotion, onDetail, onShare, onBack }: Props) {
  const root = useRef<HTMLElement>(null);
  const s = SIGNS[reading.sign];
  const name = pick.food.name;
  // 長い料理名は、縦組みで2行に分ける(スペースがあればそこで)
  const parts = name.includes(' ') ? name.split(' ') : [name];

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (reducedMotion) { el.querySelectorAll('.rv').forEach((n) => n.classList.add('in')); return; }
    // 最初の画面(料理名)はすぐに出す。clip-path の要素は交差判定に乗らないため
    const raf = requestAnimationFrame(() => el.querySelectorAll('.dish .rv').forEach((n) => n.classList.add('in')));
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.15 });
    el.querySelectorAll('.rv:not(.dish .rv)').forEach((n) => io.observe(n));
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [reducedMotion]);

  return (
    <main className="result" ref={root}>
      <header className="result__bar">
        <button className="textbtn" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>星座を選び直す
        </button>
        <span className="result__who">{s.ja}<i>{s.en}</i></span>
      </header>

      <section className="dish" aria-label="今日のラッキーフード">
        <div className="dish__meta rv">
          <p className="eyebrow">Today&rsquo;s lucky food</p>
          <p className="dish__date">{sky.dateLabel}</p>
          <ul className="dish__ing">
            {pick.food.ing.map((k) => (
              <li key={k}><span className="swatch" style={{ background: INGREDIENTS[k].c, color: INGREDIENTS[k].c }} />{INGREDIENTS[k].ja}</li>
            ))}
          </ul>
          <p className="dish__genre">{pick.food.genre}・{ELEMENT_JA[pick.food.element]}の一皿</p>
        </div>
        <h2 className="dish__name rv" style={{ ['--len' as string]: Math.max(...parts.map((p) => [...p].length), 5) }}>
          {parts.map((p, i) => <span key={i}>{p}</span>)}
        </h2>
        <button className="dish__more rv" onClick={onDetail}>
          <span>この一皿の栄養と、選ばれた理由</span>
          <svg viewBox="0 0 40 12" aria-hidden="true"><path d="M0 6h38M33 1l5 5-5 5" /></svg>
        </button>
      </section>

      <section className="fortune">
        <article className="fortune__item rv">
          <header>
            <h3>総合運</h3>
            <Meter level={reading.overall.level} label="総合運" />
          </header>
          <p className="fortune__key">{reading.overall.keyword}</p>
          <p className="fortune__text">{reading.overall.text}</p>
        </article>
        <article className="fortune__item rv">
          <header>
            <h3>美容運</h3>
            <Meter level={reading.beauty.level} label="美容運" />
          </header>
          <p className="fortune__text">{reading.beauty.text}</p>
        </article>
      </section>

      <section className="skytable rv" aria-label="今日の天体">
        <header className="skytable__head">
          <h3>今日の空</h3>
          <p>{sky.dateLabel} 12:00 東京 ・ {reading.phaseName}</p>
        </header>
        <table>
          <thead>
            <tr><th scope="col">天体</th><th scope="col">位置</th><th scope="col">{s.ja}との角度</th></tr>
          </thead>
          <tbody>
            {sky.bodies.map((b) => {
              const l = reading.links.find((x) => x.key === b.key)!;
              const tone = l.aspect === 'conj' || l.aspect === 'trine' || l.aspect === 'sext' ? 'good' : l.aspect === 'quiet' ? 'calm' : 'tense';
              return (
                <tr key={b.key}>
                  <th scope="row">{b.ja}{b.retro && <small>逆行</small>}</th>
                  <td>{SIGNS[b.sign].ja} <span className="num">{Math.floor(b.degInSign)}°</span></td>
                  <td><span className={`asp asp--${tone}`} title={ASPECT_NOTE[l.aspect]}>{l.aspectJa}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="fine">天体の位置は Astronomy Engine による計算値(地心・黄経)。角度は星座どうしの関係で見ています。</p>
      </section>

      <section className="actions rv">
        <button className="cta" onClick={onShare}>
          <span>結果を共有する</span>
          <svg viewBox="0 0 40 12" aria-hidden="true"><path d="M0 6h38M33 1l5 5-5 5" /></svg>
        </button>
        <p className="fine">占いは日々を楽しむためのものです。栄養の説明は一般的な情報で、効果を保証するものではありません。</p>
      </section>

      <footer className="foot">
        <span className="brand__name">NEUTRAL</span>
        <span>池袋</span>
      </footer>
    </main>
  );
}
