/**
 * Arithmétique exacte sur les rationnels (numérateur / dénominateur entiers).
 * Évite toute erreur de virgule flottante dans les énoncés de maths.
 */
export interface Q {
  n: number;
  d: number;
}

function pgcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function q(n: number, d = 1): Q {
  if (d === 0) throw new Error('Division par zéro');
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d)) throw new Error('Rationnel hors limites');
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = pgcd(n, d);
  return { n: n / g, d: d / g };
}

export const add = (a: Q, b: Q): Q => q(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Q, b: Q): Q => q(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Q, b: Q): Q => q(a.n * b.n, a.d * b.d);
export const div = (a: Q, b: Q): Q => q(a.n * b.d, a.d * b.n);
export const egal = (a: Q, b: Q): boolean => a.n === b.n && a.d === b.d;
export const cmp = (a: Q, b: Q): number => a.n * b.d - b.n * a.d;
export const estEntier = (a: Q): boolean => a.d === 1;
export const enNombre = (a: Q): number => a.n / a.d;

export type TypeFormat = 'entier' | 'decimal' | 'fraction';
export interface Format {
  type: TypeFormat;
  /** Suffixe affiché après la valeur (« € », « km », « % », « min »…) */
  unite?: string;
}

/** Peut-on écrire cette valeur avec au plus 2 décimales exactes ? */
export function estDecimal2(a: Q): boolean {
  return (a.n * 100) % a.d === 0;
}

/** La valeur est-elle représentable dans ce format ? (sans arrondi) */
export function formatable(a: Q, f: Format): boolean {
  if (f.type === 'entier') return estEntier(a);
  if (f.type === 'decimal') return estDecimal2(a);
  return true;
}

/** Sépare les milliers par une espace fine insécable (usage français) : 22400 → 22 400. */
export function grouperMilliers(entiere: string): string {
  return entiere.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
}

/** « jour|jours » : singulier jusqu'à 1 inclus, pluriel au-delà. Sans « | », l'unité est invariable. */
function uniteAccordee(unite: string, a: Q): string {
  if (!unite.includes('|')) return unite;
  const [singulier, pluriel] = unite.split('|');
  return Math.abs(a.n) / a.d > 1 ? pluriel : singulier;
}

export function formater(a: Q, f: Format): string {
  let s: string;
  if (f.type === 'fraction') {
    s = a.d === 1 ? grouperMilliers(String(a.n)) : `${a.n}/${a.d}`;
  } else {
    if (!formatable(a, f)) throw new Error(`Valeur ${a.n}/${a.d} non représentable en ${f.type}`);
    const centiemes = (a.n * 100) / a.d;
    const signe = centiemes < 0 ? '-' : '';
    const abs = Math.abs(centiemes);
    const entiere = Math.floor(abs / 100);
    const frac = abs % 100;
    s = `${signe}${grouperMilliers(String(entiere))}`;
    if (frac !== 0) s += ',' + String(frac).padStart(2, '0').replace(/0$/, '');
  }
  return f.unite ? `${s}\u00a0${uniteAccordee(f.unite, a)}` : s;
}
