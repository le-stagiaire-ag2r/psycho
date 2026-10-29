import { describe, expect, it } from 'vitest';
import { EPREUVES } from '../config/epreuves';
import { creerPrng } from '../lib/prng';
import type { Difficulte, ItemRef } from '../lib/types';
import { alterer, generateurAttention, PROBA_SANS_INTRUS, perturber, VERSION_ATTENTION, VERSION_ATTENTION_V1 } from './attention';

const DIFFS: Difficulte[] = [1, 2, 3];

/** Distance de Damerau-Levenshtein : une altération = 1 opération. */
export function distance(a: string, b: string): number {
  const D: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) D[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) D[i][j] = Math.min(D[i][j], D[i - 2][j - 2] + 1);
    }
  return D[a.length][b.length];
}

describe('générateur attention (version 2 : séries, intrus ou « pas d’intrus »)', () => {
  it('est déterministe', () => {
    const [ref] = generateurAttention.construireRefs({ graineBase: 42, nb: 1, difficulte: 2, config: EPREUVES.attention });
    expect(ref.version).toBe(VERSION_ATTENTION);
    expect(generateurAttention.generer(ref)).toEqual(generateurAttention.generer(ref));
  });

  it.each(DIFFS)('items valides sur 3000 graines (difficulté %i)', (d) => {
    const refs = generateurAttention.construireRefs({ graineBase: 1234, nb: 3000, difficulte: d, config: EPREUVES.attention });
    let sansIntrus = 0;
    const positions = new Map<number, number>();
    for (const ref of refs) {
      const item = generateurAttention.generer(ref);
      expect(item.stimulus.type).toBe('attention-series');
      if (item.stimulus.type !== 'attention-series') continue;
      const { series } = item.stimulus;
      const n = series.length;
      expect(n).toBe(EPREUVES.attention.nbChoix - 1);
      expect(item.options).toHaveLength(EPREUVES.attention.nbChoix);
      expect(new Set(item.options).size).toBe(item.options.length);
      expect(item.options[n]).toBe('Pas d’intrus');
      for (const s of series) expect(s).toMatch(/^[A-Z0-9]{4,9}$/);
      const distincts = [...new Set(series)];
      if (item.bonneReponse === n) {
        sansIntrus++;
        expect(distincts).toHaveLength(1);
      } else {
        expect(distincts).toHaveLength(2);
        const base = series.find((_, i) => i !== item.bonneReponse)!;
        // Toutes les autres séries sont identiques et l'intrus diffère d'une seule altération.
        series.forEach((s, i) => {
          if (i === item.bonneReponse) {
            expect(s).not.toBe(base);
            expect(distance(base, s)).toBe(1);
          } else expect(s).toBe(base);
        });
        positions.set(item.bonneReponse, (positions.get(item.bonneReponse) ?? 0) + 1);
      }
      expect(item.pourquoi).toHaveLength(item.options.length);
      expect(new Set(item.pourquoi).size).toBe(item.pourquoi.length);
      expect(item.explication.length).toBeGreaterThan(10);
    }
    const part = sansIntrus / refs.length;
    expect(part).toBeGreaterThan(PROBA_SANS_INTRUS - 0.04);
    expect(part).toBeLessThan(PROBA_SANS_INTRUS + 0.04);
    // L'intrus se trouve à toutes les positions possibles.
    expect(positions.size).toBe(EPREUVES.attention.nbChoix - 1);
  });

  it('alterer() ne recrée jamais le code, même avec des caractères répétés', () => {
    const rng = creerPrng(99);
    for (const base of ['AAAAAA', 'ABABAB', '1111111', '121212', 'O0O0O0', 'QQQQQQQ', 'A1B2C3', '8888']) {
      for (const d of DIFFS) {
        for (let k = 0; k < 300; k++) {
          const p = alterer(base, rng, d);
          expect(p.resultat).not.toBe(base);
          expect(distance(base, p.resultat)).toBe(1);
        }
      }
    }
  });

  it('refuse une version de générateur inconnue', () => {
    expect(() => generateurAttention.generer({ epreuve: 'attention', version: 999, seed: 1, difficulte: 1 })).toThrow();
  });
});

describe('attention : les anciennes questions (version 1) restent rejouables', () => {
  const refsV1 = (d: Difficulte): ItemRef[] =>
    Array.from({ length: 800 }, (_, i) => ({ epreuve: 'attention' as const, version: VERSION_ATTENTION_V1, seed: 9000 + i * 7, difficulte: d }));

  it.each(DIFFS)('deux suites identiques ou non (difficulté %i)', (d) => {
    let identiques = 0;
    for (const ref of refsV1(d)) {
      const item = generateurAttention.generer(ref);
      expect(item.stimulus.type).toBe('attention');
      if (item.stimulus.type !== 'attention') continue;
      const { a, b } = item.stimulus;
      expect(a).toMatch(/^[A-Z]{5,8}$/);
      if (item.bonneReponse === 0) {
        identiques++;
        expect(b).toBe(a);
      } else {
        expect(b).not.toBe(a);
        expect(distance(a, b)).toBe(1);
      }
    }
    expect(identiques / 800).toBeGreaterThan(0.4);
    expect(identiques / 800).toBeLessThan(0.6);
  });

  it('perturber() (version 1) ne recrée jamais la chaîne', () => {
    const rng = creerPrng(99);
    for (const base of ['AAAAAA', 'ABABAB', 'AABBCC', 'QQQQQQQ', 'EFEFEF', 'MNMNMN']) {
      for (const d of DIFFS) for (let k = 0; k < 300; k++) expect(perturber(base, rng, d).resultat).not.toBe(base);
    }
  });
});
