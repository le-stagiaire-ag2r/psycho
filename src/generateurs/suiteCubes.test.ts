import { describe, expect, it } from 'vitest';
import { EPREUVES } from '../config/epreuves';
import type { Difficulte, Vue3 } from '../lib/types';
import {
  cleV,
  generateurLogique,
  predictionsCompatibles,
  reglesElementaires,
  reglesProfondeur2,
  type Regle,
} from './suiteCubes';

const DIFFS: Difficulte[] = [1, 2, 3];
const depart: Vue3 = [
  { sym: 0, k: 0, mir: false },
  { sym: 1, k: 1, mir: false },
  { sym: 2, k: 2, mir: false },
];

describe('règles de la grammaire', () => {
  const regles = reglesElementaires();

  it('chaque règle élémentaire a un inverse exact', () => {
    for (const r of regles) {
      expect(cleV(r.inverse(r.f(depart)))).toBe(cleV(depart));
      expect(cleV(r.f(r.inverse(depart)))).toBe(cleV(depart));
    }
  });

  it('les règles ne produisent que des symboles et orientations valides', () => {
    for (const r of regles) {
      for (const f of r.f(depart)) {
        expect(f.k).toBeGreaterThanOrEqual(0);
        expect(f.k).toBeLessThan(4);
        expect(f.sym).toBeGreaterThanOrEqual(0);
        expect(f.sym).toBeLessThan(8);
      }
    }
  });

  it('la rotation du cube autour de l’axe de vue est d’ordre 3', () => {
    const r = regles.find((x) => x.id === 'cube-120-1')!;
    expect(cleV(r.f(r.f(r.f(depart))))).toBe(cleV(depart));
    expect(cleV(r.f(depart))).not.toBe(cleV(depart));
  });

  it('il y a 27 règles élémentaires', () => {
    expect(regles).toHaveLength(27);
    expect(reglesProfondeur2().length).toBe(27 + 27 * 27);
  });
});

describe('solveur d’unicité', () => {
  it('détecte une suite ambiguë : deux règles compatibles qui prédisent des cubes différents', () => {
    // Deux « règles » qui coïncident sur les transitions affichées mais divergent ensuite.
    const a: Regle = { id: 'a', description: '', f: (v) => v.map((f, i) => (i === 0 ? { ...f, k: (f.k + 1) % 4 } : f)) as Vue3, inverse: (v) => v };
    const b: Regle = {
      id: 'b',
      description: '',
      f: (v) => (v[0].k >= 2 ? (v.map((f, i) => (i === 0 ? { ...f, k: 0 } : f)) as Vue3) : a.f(v)),
      inverse: (v) => v,
    };
    const suite: Vue3[] = [depart, a.f(depart)];
    expect(predictionsCompatibles([a, b], suite).size).toBe(1); // k: 0 → 1 → prédiction 2 pour les deux
    const suite3: Vue3[] = [depart, a.f(depart), a.f(a.f(depart))];
    expect(predictionsCompatibles([a, b], suite3).size).toBe(2); // 3 pour a, 0 pour b
  });

  it('ne retient que les règles compatibles avec la suite', () => {
    const regles = reglesProfondeur2();
    const r = reglesElementaires().find((x) => x.id === 'rot-avant-1')!;
    const suite = [depart, r.f(depart), r.f(r.f(depart))];
    const predictions = predictionsCompatibles(regles, suite);
    expect(predictions.size).toBe(1);
    expect(predictions.has(cleV(r.f(suite[2])))).toBe(true);
  });
});

describe('générateur de suites de cubes', () => {
  it.each(DIFFS)('items valides et à réponse unique sur 300 graines (difficulté %i)', (d) => {
    const refs = generateurLogique.construireRefs({
      graineBase: 17,
      nb: 300,
      difficulte: d,
      config: EPREUVES.logique,
    });
    const regles = reglesProfondeur2();
    for (const ref of refs) {
      const item = generateurLogique.generer(ref);
      expect(item.stimulus.type).toBe('suite-cubes');
      if (item.stimulus.type !== 'suite-cubes') continue;
      const { suite, propositions } = item.stimulus;
      expect(suite).toHaveLength(d === 3 ? 4 : 3);
      expect(propositions).toHaveLength(5);
      expect(new Set(propositions.map(cleV)).size).toBe(5);

      // Vérification indépendante : une seule prédiction possible, et c'est la bonne réponse.
      const predictions = predictionsCompatibles(regles, suite);
      expect(predictions.size).toBe(1);
      expect(predictions.has(cleV(propositions[item.bonneReponse]))).toBe(true);
      // Aucun distracteur n'est une prédiction valide.
      propositions.forEach((p, i) => {
        if (i !== item.bonneReponse) expect(predictions.has(cleV(p))).toBe(false);
      });
      // Les cubes de la suite sont tous différents.
      expect(new Set(suite.map(cleV)).size).toBe(suite.length);
    }
  });

  it('est déterministe', () => {
    const [ref] = generateurLogique.construireRefs({ graineBase: 2, nb: 1, difficulte: 3, config: EPREUVES.logique });
    expect(generateurLogique.generer(ref)).toEqual(generateurLogique.generer(ref));
  });
});
