import { describe, expect, it } from 'vitest';
import { creerPrng, melangerGraines } from './prng';

describe('prng à graine', () => {
  it('donne la même suite pour la même graine', () => {
    const a = creerPrng(48213);
    const b = creerPrng(48213);
    for (let i = 0; i < 100; i++) expect(a.suivant()).toBe(b.suivant());
  });

  it('donne des suites différentes pour des graines différentes', () => {
    expect(creerPrng(1).suivant()).not.toBe(creerPrng(2).suivant());
  });

  it('entier() reste dans les bornes et les atteint', () => {
    const rng = creerPrng(7);
    const vus = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const x = rng.entier(3, 8);
      expect(x).toBeGreaterThanOrEqual(3);
      expect(x).toBeLessThanOrEqual(8);
      vus.add(x);
    }
    expect(vus.size).toBe(6);
  });

  it('melanger() est une permutation et ne modifie pas l’original', () => {
    const rng = creerPrng(3);
    const src = [1, 2, 3, 4, 5, 6];
    const m = rng.melanger(src);
    expect(src).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...m].sort()).toEqual(src);
  });

  it('chance(0.5) est à peu près équilibré', () => {
    const rng = creerPrng(11);
    let vrai = 0;
    for (let i = 0; i < 10000; i++) if (rng.chance(0.5)) vrai++;
    expect(vrai).toBeGreaterThan(4700);
    expect(vrai).toBeLessThan(5300);
  });

  it('melangerGraines est déterministe et sensible à l’ordre', () => {
    expect(melangerGraines(1, 2)).toBe(melangerGraines(1, 2));
    expect(melangerGraines(1, 2)).not.toBe(melangerGraines(2, 1));
  });
});
