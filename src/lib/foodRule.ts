// NEUTRALの独自ルール(占星術の伝統的な解釈ではない)。
// 1) 今日の月とあなたの星座が調和する角度なら「今日の空の元素」、そうでなければ「あなた自身の元素」の料理を選ぶ。
// 2) 金星のいる星座の元素で、優先する栄養素を決める。
// 3) 日付と星座から決まる順番で1品を選ぶ(同じ条件なら同じ料理。個人情報は使わない)。
import { body, dayNumber, type Sky } from './sky';
import { aspectBetween } from './reading';
import { FOODS, type Food } from '../data/foods';
import { INGREDIENTS } from '../data/ingredients';
import { NUTRIENTS, type NutrientKey } from '../data/nutrients';
import { ELEMENT_JA, SIGNS, type Element } from '../data/zodiac';

export const FOCUS: Record<Element, { nutrients: NutrientKey[]; label: string }> = {
  fire: { nutrients: ['protein', 'iron', 'zinc'], label: 'たんぱく質・鉄・亜鉛' },
  earth: { nutrients: ['fiber', 'magnesium', 'calcium'], label: '食物繊維・マグネシウム・カルシウム' },
  air: { nutrients: ['vitC', 'vitE', 'vitA'], label: 'ビタミンC・E・A' },
  water: { nutrients: ['n3', 'vitB2', 'vitB6', 'calcium'], label: 'n-3系脂肪酸・ビタミンB群' },
};

export interface FoodPick {
  food: Food;
  alternatives: Food[];
  targetElement: Element;
  focusLabel: string;
  focusNutrients: NutrientKey[];
  reasons: string[];
  colors: string[];
}

export function nutrientsOf(food: Food): NutrientKey[] {
  const set = new Set<NutrientKey>();
  food.ing.forEach((k) => INGREDIENTS[k]?.n.forEach((n) => set.add(n)));
  return [...set];
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function seededOrder<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickFood(sky: Sky, sign: number): FoodPick {
  const moon = body(sky, 'moon');
  const venus = body(sky, 'venus');
  const user = SIGNS[sign];
  const moonSign = SIGNS[moon.sign];
  const venusSign = SIGNS[venus.sign];
  const asp = aspectBetween(sign, moon.sign);
  const harmonious = asp === 'conj' || asp === 'sext' || asp === 'trine';
  const targetElement: Element = harmonious ? moonSign.element : user.element;
  const focus = FOCUS[venusSign.element];

  const scored = FOODS.filter((f) => f.element === targetElement).map((f) => {
    const ns = nutrientsOf(f);
    const hit = focus.nutrients.filter((n) => ns.includes(n)).length;
    return { f, hit };
  });
  const pool = scored.filter((s) => s.hit > 0).map((s) => s.f);
  const candidates = pool.length >= 6 ? pool : scored.map((s) => s.f);
  // 星座・条件ごとに固定の並び → 日付で順番に進む(続けて同じ料理になりにくい)
  const order = seededOrder(candidates, hash(`${sign}-${targetElement}-${venusSign.element}`));
  const idx = dayNumber(sky.dateKey) % order.length;
  const food = order[idx];
  const alternatives = [order[(idx + 1) % order.length], order[(idx + 2) % order.length]].filter((f) => f.id !== food.id);

  const reasons = [
    harmonious
      ? `今日の月は${moonSign.ja}(${ELEMENT_JA[moonSign.element]})。あなたの${user.ja}と調和する角度なので、今日の空と同じ「${ELEMENT_JA[targetElement]}」の性質の料理から選びました。`
      : `今日の月は${moonSign.ja}(${ELEMENT_JA[moonSign.element]})。あなたの${user.ja}とは調和の角度ではないため、あなた自身の「${ELEMENT_JA[targetElement]}」の性質の料理から選びました。`,
    `金星は${venusSign.ja}(${ELEMENT_JA[venusSign.element]})。この元素に合わせて、${focus.label}を含む食材を優先しました。`,
  ];
  const colors = food.ing.map((k) => INGREDIENTS[k]?.c).filter(Boolean) as string[];
  return { food, alternatives, targetElement, focusLabel: focus.label, focusNutrients: focus.nutrients, reasons, colors };
}

export function describeNutrient(k: NutrientKey) {
  return NUTRIENTS[k];
}
