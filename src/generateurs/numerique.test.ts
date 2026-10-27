import { describe, expect, it } from 'vitest';
import { EPREUVES } from '../config/epreuves';
import { creerPrng } from '../lib/prng';
import type { Difficulte } from '../lib/types';
import { completerDistracteurs, generateurNumerique, gabaritsPour } from './numerique';
import { GABARITS } from './numerique/gabarits';
import { egal, estDecimal2, formater, q } from '../lib/rationnel';

const DIFFS: Difficulte[] = [1, 2, 3];

describe('gabarits numériques', () => {
  it('sont assez nombreux et ont des identifiants uniques', () => {
    expect(GABARITS.length).toBeGreaterThanOrEqual(35);
    expect(new Set(GABARITS.map((g) => g.id)).size).toBe(GABARITS.length);
  });

  it('chaque difficulté a au moins 12 gabarits', () => {
    for (const d of DIFFS) expect(gabaritsPour(d).length).toBeGreaterThanOrEqual(12);
  });

  it.each(GABARITS.map((g) => [g.id] as const))('%s : 600 tirages valides', (id) => {
    const gabarit = GABARITS.find((g) => g.id === id)!;
    const rng = creerPrng(2024);
    for (let k = 0; k < 600; k++) {
      const t = gabarit.tirer(rng);

      // Solution exacte et représentable dans le format.
      expect(t.verifier()).toBe(true);
      expect(() => formater(t.solution, t.format)).not.toThrow();
      if (t.format.type === 'entier') expect(t.solution.d).toBe(1);
      if (t.format.type === 'decimal') expect(estDecimal2(t.solution)).toBe(true);
      expect(t.solution.n).toBeGreaterThanOrEqual(0);

      // On peut toujours construire 4 distracteurs distincts valides.
      const distr = completerDistracteurs(t.solution, t.pieges, t.format, 4, creerPrng(k));
      expect(distr).toHaveLength(4);
      const textes = [t.solution, ...distr.map((d) => d.valeur)].map((v) => formater(v, t.format));
      expect(new Set(textes).size).toBe(5);
      for (const d of distr) expect(egal(d.valeur, t.solution)).toBe(false);

      expect(t.enonce.length).toBeGreaterThan(10);
      expect(t.explication.length).toBeGreaterThan(10);
    }
  });
});

describe('générateur numérique', () => {
  it.each(DIFFS)('items valides sur 1500 graines (difficulté %i)', (d) => {
    const refs = generateurNumerique.construireRefs({
      graineBase: 99,
      nb: 1500,
      difficulte: d,
      config: EPREUVES.numerique,
    });
    for (const ref of refs) {
      const item = generateurNumerique.generer(ref);
      expect(item.stimulus.type).toBe('texte');
      expect(item.options).toHaveLength(EPREUVES.numerique.nbChoix);
      expect(new Set(item.options).size).toBe(item.options.length);
      expect(item.bonneReponse).toBeGreaterThanOrEqual(0);
      expect(item.bonneReponse).toBeLessThan(item.options.length);
    }
  });

  it('est déterministe', () => {
    const [ref] = generateurNumerique.construireRefs({
      graineBase: 3,
      nb: 1,
      difficulte: 2,
      config: EPREUVES.numerique,
    });
    expect(generateurNumerique.generer(ref)).toEqual(generateurNumerique.generer(ref));
  });

  it('complète les distracteurs sans doublon même quand les pièges sont inutilisables', () => {
    const res = completerDistracteurs(q(7), [{ valeur: q(1, 3), piege: 'non entier' }], { type: 'entier' }, 4, creerPrng(1));
    expect(res).toHaveLength(4);
  });
});
