import { useEffect, useRef } from 'react';
import { INGREDIENTS } from '../data/ingredients';
import { NUTRIENTS, NUTRITION_NOTE, type NutrientKey } from '../data/nutrients';
import { ELEMENT_JA } from '../data/zodiac';
import { nutrientsOf, type FoodPick } from '../lib/foodRule';

export function DetailSheet({ pick, onClose }: { pick: FoodPick; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const all = nutrientsOf(pick.food);
  const focus = all.filter((n) => pick.focusNutrients.includes(n));
  const others = all.filter((n) => !pick.focusNutrients.includes(n));
  const ordered: NutrientKey[] = [...focus, ...others];

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => { window.removeEventListener('keydown', k); prev?.focus(); };
  }, [onClose]);

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={`${pick.food.name}の詳細`}>
      <div className="sheet__scrim" onClick={onClose} />
      <div className="sheet__panel" ref={ref} tabIndex={-1}>
        <button className="sheet__close" onClick={onClose} aria-label="閉じる">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <div className="detail__light" style={{ background: `radial-gradient(60% 80% at 30% 20%, ${pick.colors[0]}55, transparent 70%), radial-gradient(50% 70% at 80% 30%, ${(pick.colors[1] || pick.colors[0])}40, transparent 70%)` }} />
        <p className="eyebrow">{pick.food.genre}・{ELEMENT_JA[pick.food.element]}の一皿</p>
        <h2 className="detail__name">{pick.food.name}</h2>

        <section className="detail__block">
          <h3>主な食材</h3>
          <ul className="detail__ing">
            {pick.food.ing.map((k) => {
              const ing = INGREDIENTS[k];
              return (
                <li key={k}>
                  <span className="swatch swatch--lg" style={{ background: ing.c, color: ing.c }} />
                  <span className="detail__ingname">{ing.ja}</span>
                  <span className="detail__ingn">{ing.n.map((n) => NUTRIENTS[n].ja).join('・') || '香りと風味'}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="detail__block">
          <h3>含まれる栄養素の働き</h3>
          <dl className="detail__nut">
            {ordered.map((n) => (
              <div key={n} className={focus.includes(n) ? 'is-focus' : ''}>
                <dt>{NUTRIENTS[n].ja}{focus.includes(n) && <small>今日の優先</small>}</dt>
                <dd>{NUTRIENTS[n].role}</dd>
              </div>
            ))}
          </dl>
          <p className="fine">{NUTRITION_NOTE}</p>
        </section>

        <section className="detail__block detail__rule">
          <h3>この一皿が選ばれた理由</h3>
          <ol>{pick.reasons.map((r, i) => <li key={i}>{r}</li>)}</ol>
          <p className="fine">料理の選び方は NEUTRAL 池袋の独自ルールです。占星術の伝統的な解釈ではありません。</p>
        </section>

        {pick.alternatives.length > 0 && (
          <section className="detail__block">
            <h3>同じ条件のほかの一皿</h3>
            <ul className="detail__alt">
              {pick.alternatives.map((f) => <li key={f.id}><span>{f.name}</span><i>{f.genre}</i></li>)}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
