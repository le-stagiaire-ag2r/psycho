import { describe, expect, it } from 'vitest';
import { EPREUVES } from '../config/epreuves';
import { creerPrng } from '../lib/prng';
import type { Difficulte } from '../lib/types';
import { generateurAttention, perturber } from './attention';

const DIFFS: Difficulte[] = [1, 2, 3];

describe('générateur attention', () => {
  it('est déterministe', () => {
    const [ref] = generateurAttention.construireRefs({
      graineBase: 42,
      nb: 1,
      difficulte: 2,
      config: EPREUVES.attention,
    });
    expect(generateurAttention.generer(ref)).toEqual(generateurAttention.generer(ref));
  });

  it.each(DIFFS)('items valides sur 3000 graines (difficulté %i)', (d) => {
    const refs = generateurAttention.construireRefs({
      graineBase: 1234,
      nb: 3000,
      difficulte: d,
      config: EPREUVES.attention,
    });
    let identiques = 0;
    for (const ref of refs) {
      const item = generateurAttention.generer(ref);
      expect(item.stimulus.type).toBe('attention');
      if (item.stimulus.type !== 'attention') continue;
      const { a, b } = item.stimulus;
      expect(a).toMatch(/^[A-Z]{5,8}$/);
      expect(new Set(item.options).size).toBe(item.options.length);
      expect(item.explication.length).toBeGreaterThan(10);
      if (item.bonneReponse === 0) {
        identiques++;
        expect(b).toBe(a);
      } else {
        // La chaîne perturbée ne doit jamais recréer l'originale.
        expect(b).not.toBe(a);
        expect(Math.abs(b.length - a.length)).toBeLessThanOrEqual(1);
      }
    }
    // Environ une chance sur deux d'être identiques.
    expect(identiques / refs.length).toBeGreaterThan(0.45);
    expect(identiques / refs.length).toBeLessThan(0.55);
  });

  it('perturber() ne recrée jamais la chaîne, même avec des lettres répétées', () => {
    const rng = creerPrng(99);
    for (const base of ['AAAAAA', 'ABABAB', 'AABBCC', 'QQQQQQQ', 'EFEFEF', 'MNMNMN']) {
      for (const d of DIFFS) {
        for (let k = 0; k < 300; k++) {
          const p = perturber(base, rng, d);
          expect(p.resultat).not.toBe(base);
        }
      }
    }
  });

  it('les transpositions échangent bien deux lettres adjacentes différentes', () => {
    const rng = creerPrng(5);
    let vues = 0;
    for (let k = 0; k < 2000; k++) {
      const p = perturber('AQWZSX', rng, 3);
      if (p.type !== 'transposition') continue;
      vues++;
      expect(p.resultat.length).toBe(6);
      expect([...p.resultat].sort().join('')).toBe([...'AQWZSX'].sort().join(''));
    }
    expect(vues).toBeGreaterThan(0);
  });

  it('refuse une version de générateur inconnue', () => {
    expect(() =>
      generateurAttention.generer({ epreuve: 'attention', version: 999, seed: 1, difficulte: 1 }),
    ).toThrow();
  });
});
