// 占星術としての解釈(トランジット × 太陽星座、ホールサイン方式)。
import { body, moonPhaseName, type BodyKey, type Sky } from './sky';
import { SIGNS } from '../data/zodiac';
import {
  ASPECT_JA, CARE_LINES, KEYWORDS, MOON_LINES, PHASE_LINES, VENUS_LINES, type Aspect,
} from '../data/readings';

export function aspectBetween(a: number, b: number): Aspect {
  const d = (((b - a) % 12) + 12) % 12;
  if (d === 0) return 'conj';
  if (d === 2 || d === 10) return 'sext';
  if (d === 3 || d === 9) return 'square';
  if (d === 4 || d === 8) return 'trine';
  if (d === 6) return 'opp';
  return 'quiet';
}

const W: Record<Aspect, number> = { conj: 1.2, sext: 0.8, trine: 1.2, square: -0.9, opp: -0.4, quiet: 0 };

export interface Link {
  key: BodyKey;
  ja: string;
  aspect: Aspect;
  aspectJa: string;
}

export interface Reading {
  sign: number;
  overall: { level: number; text: string; keyword: string };
  beauty: { level: number; text: string };
  phaseName: string;
  links: Link[];
}

const clampLevel = (v: number) => Math.max(1, Math.min(5, Math.round(v)));

export function makeReading(sky: Sky, sign: number): Reading {
  const links: Link[] = sky.bodies.map((b) => {
    const aspect = aspectBetween(sign, b.sign);
    return { key: b.key, ja: b.ja, aspect, aspectJa: ASPECT_JA[aspect] };
  });
  const asp = (k: BodyKey) => links.find((l) => l.key === k)!.aspect;

  const moon = body(sky, 'moon');
  const mercury = body(sky, 'mercury');
  const phaseIdx = Math.floor((((sky.moonPhase + 22.5) % 360) + 360) % 360 / 45) % 8;

  // 総合運: 月・太陽・木星・火星・土星
  let o = 3 + W[asp('moon')] * 1.1 + W[asp('sun')] * 0.5 + W[asp('jupiter')] * 0.6 + W[asp('mars')] * 0.3 + W[asp('saturn')] * 0.3;
  if (mercury.retro) o -= 0.2;
  // 美容運: 金星・月、月の元素とあなたの元素
  let bScore = 3 + W[asp('venus')] * 1.3 + W[asp('moon')] * 0.5;
  if (SIGNS[moon.sign].element === SIGNS[sign].element) bScore += 0.5;

  const outer: ('jupiter' | 'mars' | 'saturn')[] = ['jupiter', 'mars', 'saturn'];
  const strongest = outer.reduce((best, k) => (Math.abs(W[asp(k)]) > Math.abs(W[asp(best)]) ? k : best), 'jupiter');

  let overallText = `${PHASE_LINES[phaseIdx]}${MOON_LINES[asp('moon')]}`;
  if (mercury.retro) overallText += '水星が逆行中のため、約束や連絡は一度見直してから送ると安心です。';

  return {
    sign,
    overall: { level: clampLevel(o), text: overallText, keyword: KEYWORDS[strongest][asp(strongest)] },
    beauty: { level: clampLevel(bScore), text: `${VENUS_LINES[asp('venus')]}${CARE_LINES[SIGNS[moon.sign].element]}` },
    phaseName: moonPhaseName(sky.moonPhase),
    links,
  };
}
