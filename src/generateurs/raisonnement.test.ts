import { describe, expect, it } from 'vitest';
import { EPREUVES } from '../config/epreuves';
import { creerPrng } from '../lib/prng';
import type { Difficulte } from '../lib/types';
import { FAMILLES_RAISONNEMENT, generateurRaisonnement } from './raisonnement';
import { genererSuiteLettres, predictionsSuiteLettres } from './raisonnement/suitesLettres';
import { genererSuiteMots, pasCompatible } from './raisonnement/suitesMots';
import { genererSuiteNombres, predictionsSuiteNombres } from './raisonnement/suitesNombres';
import { classementsCompatibles, genererTransitive, que } from './raisonnement/transitive';

const DIFFS: Difficulte[] = [1, 2, 3];
const prochains = (termes: number[]) => new Set(predictionsSuiteNombres(termes).map((p) => `${p.prochain.n}/${p.prochain.d}`));

describe('solveur de suites de nombres', () => {
  it('reconnaît les suites classiques de l’exemple (x2, +n croissant, carrés, Fibonacci…)', () => {
    expect([...prochains([2, 4, 8, 16])]).toEqual(['32/1']);
    expect([...prochains([5, 10, 20, 40])]).toEqual(['80/1']);
    expect([...prochains([1, 4, 9, 16])]).toEqual(['25/1']);
    expect([...prochains([2, 4, 7, 11, 16])]).toEqual(['22/1']);
    expect([...prochains([1, 1, 2, 3, 5, 8])]).toEqual(['13/1']);
    expect([...prochains([1, 3, 7, 15, 31])]).toEqual(['63/1']);
    expect([...prochains([1, 8, 27, 64, 125])]).toEqual(['216/1']);
    expect([...prochains([1, 10, 2, 20, 3])]).toEqual(['30/1']);
  });

  it('détecte l’ambiguïté : 2, 3, 5, 8 peut donner 12 (écarts +1, +2, +3, +4) ou 13 (somme des deux précédents)', () => {
    expect([...prochains([2, 3, 5, 8])].sort()).toEqual(['12/1', '13/1']);
    expect(prochains([4, 6, 10, 16]).size).toBe(2);
  });

  it.each(DIFFS)('génère des suites à réponse unique sur 2000 graines (difficulté %i)', (d) => {
    for (let s = 1; s <= 2000; s++) {
      const suite = genererSuiteNombres(creerPrng(s), d);
      const p = prochains(suite.termes);
      expect(p.size).toBe(1);
      expect([...p][0]).toBe(`${suite.suivant}/1`);
      expect(suite.termes.length).toBeGreaterThanOrEqual(4);
      expect(suite.explication.length).toBeGreaterThan(10);
    }
  });
});

describe('solveur de suites de lettres', () => {
  const idx = (s: string) => [...s].map((c) => c.charCodeAt(0) - 65);
  it('retrouve l’exemple A-C-F-J-O → U', () => {
    const preds = predictionsSuiteLettres(idx('ACFJO'));
    expect(new Set(preds.map((p) => p.prochain))).toEqual(new Set([20]));
  });
  it('gère le passage de Z à A', () => {
    const preds = predictionsSuiteLettres(idx('VXZBD'));
    expect(new Set(preds.map((p) => p.prochain))).toEqual(new Set([5])); // F
  });
  it.each(DIFFS)('génère des suites à réponse unique sur 2000 graines (difficulté %i)', (d) => {
    for (let s = 1; s <= 2000; s++) {
      const suite = genererSuiteLettres(creerPrng(s), d);
      const preds = predictionsSuiteLettres(suite.lettres.map((c) => c.charCodeAt(0) - 65));
      expect(new Set(preds.map((p) => p.prochain)).size).toBe(1);
      expect(String.fromCharCode(65 + preds[0].prochain)).toBe(suite.suivante);
    }
  });
});

describe('suites de mots', () => {
  it('le pas est déduit des mots affichés', () => {
    expect(pasCompatible([0, 1, 2], 7)).toEqual([1]);
    expect(pasCompatible([0, 2, 5], 7)).toEqual([]);
  });
  it.each(DIFFS)('est circulaire et sans doublon (difficulté %i)', (d) => {
    for (let s = 1; s <= 1000; s++) {
      const r = genererSuiteMots(creerPrng(s), d);
      expect(new Set(r.mots).size).toBe(r.mots.length);
      expect(r.voisins).not.toContain(r.suivant);
    }
  });
});

describe('logique de comparaison', () => {
  it('le solveur énumère les classements compatibles', () => {
    const e = [
      { plus: 'A', moins: 'B' },
      { plus: 'B', moins: 'C' },
    ];
    expect(classementsCompatibles(['A', 'B', 'C'], e)).toEqual([['A', 'B', 'C']]);
    // Un énoncé manquant laisse plusieurs classements possibles : item à rejeter.
    expect(classementsCompatibles(['A', 'B', 'C'], [e[0]]).length).toBeGreaterThan(1);
  });
  it.each(DIFFS)('génère des énoncés à réponse unique (difficulté %i)', (d) => {
    for (let s = 1; s <= 1000; s++) {
      const t = genererTransitive(creerPrng(s), d);
      expect(t.personnes).toContain(t.reponse);
      expect(t.personnes.length).toBe(d === 3 ? 4 : 3);
      expect(t.enonce).toMatch(/Qui est/);
    }
  });
});

describe('langue des énoncés de raisonnement', () => {
  it('l’élision est respectée (« qu’Adam », jamais « que Adam »)', () => {
    expect(que('Adam')).toBe("qu'Adam");
    expect(que('Éric')).toBe("qu'Éric");
    expect(que('Paul')).toBe('que Paul');
    for (let s = 1; s <= 1500; s++) {
      const t = genererTransitive(creerPrng(s), 3);
      expect(t.enonce).not.toMatch(/que [AEIOUÉ]/);
    }
  });
  it('les suites de mots disent « recule de » pour un pas négatif', () => {
    for (let s = 1; s <= 600; s++) {
      const r = genererSuiteMots(creerPrng(s), 3);
      expect(r.explication).not.toMatch(/avance de -|de -\d/);
      expect(r.explication).toMatch(/(avance|recule) de \d/);
    }
  });
});

describe('générateur de raisonnement général', () => {
  it.each(DIFFS)('items valides, tous types confondus (difficulté %i)', (d) => {
    const refs = generateurRaisonnement.construireRefs({ graineBase: 11, nb: 800, difficulte: d, config: EPREUVES.raisonnement });
    const familles = new Set<string>();
    for (const ref of refs) {
      const item = generateurRaisonnement.generer(ref);
      familles.add(String(ref.params!.famille));
      expect(item.options).toHaveLength(EPREUVES.raisonnement.nbChoix);
      expect(new Set(item.options).size).toBe(item.options.length);
      expect(item.bonneReponse).toBeGreaterThanOrEqual(0);
      expect(item.stimulus.type).toBe('texte');
    }
    expect([...familles].sort()).toEqual([...FAMILLES_RAISONNEMENT].sort());
  });
  it('est déterministe', () => {
    const [ref] = generateurRaisonnement.construireRefs({ graineBase: 4, nb: 1, difficulte: 2, config: EPREUVES.raisonnement });
    expect(generateurRaisonnement.generer(ref)).toEqual(generateurRaisonnement.generer(ref));
  });
});
