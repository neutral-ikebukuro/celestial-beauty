import { useState } from 'react';
import { DAYS_IN_MONTH, SIGNS, isCusp, rangeLabel, signFromDate } from '../data/zodiac';
import { body, type Sky } from '../lib/sky';

interface Props {
  sky: Sky;
  sign: number | null;
  onSign: (s: number) => void;
  onStart: () => void;
  fallback: boolean;
}

export function SelectScreen({ sky, sign, onSign, onStart, fallback }: Props) {
  // 月日はこの画面の中だけで扱い、どこにも保存しない
  const [month, setMonth] = useState<number | ''>('');
  const [day, setDay] = useState<number | ''>('');
  const moon = body(sky, 'moon');
  const s = sign === null ? null : SIGNS[sign];

  const setDate = (m: number | '', d: number | '') => {
    let dd = d;
    if (m !== '' && dd !== '' && dd > DAYS_IN_MONTH[m - 1]) dd = DAYS_IN_MONTH[m - 1];
    setMonth(m); setDay(dd);
    if (m !== '' && dd !== '') onSign(signFromDate(m, dd));
  };

  const step = (dir: number) => {
    setMonth(''); setDay('');
    onSign(sign === null ? (dir > 0 ? 0 : 11) : (sign + dir + 12) % 12);
  };

  const cusp = month !== '' && day !== '' && isCusp(month, day);

  return (
    <main className="select">
      <header className="brand">
        <span className="brand__name">NEUTRAL</span>
        <span className="brand__place">池袋</span>
      </header>

      <section className="hero">
        <h1 className="hero__title"><span>Celestial</span><em>Beauty</em></h1>
        <p className="hero__lead">今日の空と、あなたの一皿。</p>
        <p className="hero__sky">
          <span>{sky.dateLabel}</span>
          <span className="dot" aria-hidden="true" />
          <span>月は{SIGNS[moon.sign].ja}</span>
        </p>
      </section>

      <section className="picker" aria-label="星座を選ぶ">
        <div className="picker__sign">
          <button className="arrow" onClick={() => step(-1)} aria-label="前の星座">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <div className="picker__name" aria-live="polite">
            {s ? (
              <>
                <span className="picker__en">{s.en}</span>
                <span className="picker__ja" key={s.id}>{s.ja}</span>
                <span className="picker__range">{rangeLabel(s.id)}</span>
              </>
            ) : (
              <>
                <span className="picker__en">Your sign</span>
                <span className="picker__ja picker__ja--empty">あなたの星座</span>
                <span className="picker__range">{fallback ? '矢印か誕生日で' : '盤をまわす・誕生日で'}</span>
              </>
            )}
          </div>
          <button className="arrow" onClick={() => step(1)} aria-label="次の星座">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="picker__date">
          <span className="picker__label">誕生日</span>
          <label className="field">
            <select value={month} onChange={(e) => setDate(e.target.value ? Number(e.target.value) : '', day)} aria-label="誕生月">
              <option value="">月</option>
              {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}月</option>)}
            </select>
          </label>
          <label className="field">
            <select value={day} onChange={(e) => setDate(month, e.target.value ? Number(e.target.value) : '')} aria-label="誕生日">
              <option value="">日</option>
              {Array.from({ length: month === '' ? 31 : DAYS_IN_MONTH[month - 1] }, (_, i) => <option key={i} value={i + 1}>{i + 1}日</option>)}
            </select>
          </label>
        </div>
        <p className={`picker__note ${cusp ? 'is-on' : ''}`}>
          {cusp ? '星座の境目の日です。生まれた年によって隣の星座になることがあります。' : '入力した日付は保存・送信されません。'}
        </p>

        <button className="cta" onClick={onStart} disabled={sign === null}>
          <span>今日の空を読む</span>
          <svg viewBox="0 0 40 12" aria-hidden="true"><path d="M0 6h38M33 1l5 5-5 5" /></svg>
        </button>
      </section>
    </main>
  );
}
