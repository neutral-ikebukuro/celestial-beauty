// 天文計算(事実の層)。Astronomy Engine でブラウザ内だけで計算する。
import * as Astronomy from 'astronomy-engine';

export type BodyKey = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn';

export interface BodyPos {
  key: BodyKey;
  ja: string;
  en: string;
  lon: number; // 黄経(度・その日の春分点基準)
  sign: number; // 0..11
  degInSign: number;
  retro: boolean;
}

export interface Sky {
  dateKey: string; // YYYY-MM-DD(東京)
  dateLabel: string;
  at: Date; // 計算に使った時刻(東京 12:00)
  bodies: BodyPos[];
  moonPhase: number; // 0..360(0 新月, 180 満月)
  moonIllum: number; // 0..1
}

const META: { key: BodyKey; ja: string; en: string; body: Astronomy.Body }[] = [
  { key: 'sun', ja: '太陽', en: 'Sun', body: Astronomy.Body.Sun },
  { key: 'moon', ja: '月', en: 'Moon', body: Astronomy.Body.Moon },
  { key: 'mercury', ja: '水星', en: 'Mercury', body: Astronomy.Body.Mercury },
  { key: 'venus', ja: '金星', en: 'Venus', body: Astronomy.Body.Venus },
  { key: 'mars', ja: '火星', en: 'Mars', body: Astronomy.Body.Mars },
  { key: 'jupiter', ja: '木星', en: 'Jupiter', body: Astronomy.Body.Jupiter },
  { key: 'saturn', ja: '土星', en: 'Saturn', body: Astronomy.Body.Saturn },
];

function eclipticLon(body: Astronomy.Body, t: Astronomy.AstroTime): number {
  if (body === Astronomy.Body.Moon) return Astronomy.EclipticGeoMoon(t).lon;
  if (body === Astronomy.Body.Sun) return Astronomy.SunPosition(t).elon;
  return Astronomy.Ecliptic(Astronomy.GeoVector(body, t, true)).elon;
}

const norm = (d: number) => ((d % 360) + 360) % 360;

/** 東京の今日の日付キー */
export function tokyoDateKey(now = new Date()): string {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' });
  return f.format(now);
}

export function computeSky(now = new Date()): Sky {
  const dateKey = tokyoDateKey(now);
  const [y, m, d] = dateKey.split('-').map(Number);
  // 東京 12:00 = UTC 03:00。その日の結果は一日中変わらない。
  const at = new Date(Date.UTC(y, m - 1, d, 3, 0, 0));
  const t = Astronomy.MakeTime(at);
  const t2 = Astronomy.MakeTime(new Date(at.getTime() + 86400000));
  const bodies = META.map(({ key, ja, en, body }) => {
    const lon = norm(eclipticLon(body, t));
    const lon2 = norm(eclipticLon(body, t2));
    let diff = lon2 - lon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return { key, ja, en, lon, sign: Math.floor(lon / 30), degInSign: lon % 30, retro: diff < 0 };
  });
  const moonPhase = Astronomy.MoonPhase(t);
  const moonIllum = (1 - Math.cos((moonPhase * Math.PI) / 180)) / 2;
  const wd = ['日', '月', '火', '水', '木', '金', '土'][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { dateKey, dateLabel: `${m}月${d}日(${wd})`, at, bodies, moonPhase, moonIllum };
}

export function body(sky: Sky, key: BodyKey): BodyPos {
  return sky.bodies.find((b) => b.key === key)!;
}

export function moonPhaseName(phase: number): string {
  const names = ['新月', '三日月', '上弦の月', '十三夜', '満月', '十六夜', '下弦の月', '有明の月'];
  return names[Math.floor(norm(phase + 22.5) / 45) % 8];
}

export function dayNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}
