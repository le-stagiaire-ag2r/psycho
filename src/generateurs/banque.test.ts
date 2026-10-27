import { describe, expect, it } from 'vitest';
import { EPREUVES } from '../config/epreuves';
import type { Difficulte } from '../lib/types';
import { BANQUES, generateurAnglais, generateurVerbal } from './banque';

const CAS = [
  ['verbal', generateurVerbal],
  ['anglais', generateurAnglais],
] as const;

describe.each(CAS)('banque %s', (nom, gen) => {
  const items = BANQUES[nom]!;

  it('est assez fournie', () => {
    expect(items.length).toBeGreaterThanOrEqual(nom === 'verbal' ? 100 : 100);
  });

  it('respecte le schéma et ne contient aucun doublon évident', () => {
    const ids = new Set<string>();
    const paires = new Set<string>();
    for (const it of items) {
      expect(ids.has(it.id)).toBe(false);
      ids.add(it.id);
      expect([1, 2, 3]).toContain(it.niveau);
      expect(it.enonce.trim().length).toBeGreaterThan(5);
      expect(it.explication.trim().length).toBeGreaterThan(5);
      expect(it.relecture === null || (typeof it.relecture.par === 'string' && typeof it.relecture.date === 'string')).toBe(true);

      // Au moins 3 fausses réponses, toutes différentes de la bonne et entre elles.
      expect(it.fausses.length).toBeGreaterThanOrEqual(3);
      const toutes = [it.bonne, ...it.fausses.map((f) => f.texte)].map((x) => x.trim().toLowerCase());
      expect(new Set(toutes).size).toBe(toutes.length);
      for (const o of toutes) expect(o.length).toBeGreaterThan(0);

      // Même énoncé + même bonne réponse = doublon.
      const cle = `${it.enonce}|${it.bonne}`;
      expect(paires.has(cle)).toBe(false);
      paires.add(cle);
    }
  });

  it('les phrases à compléter contiennent un trou', () => {
    for (const it of items.filter((x) => x.type === 'grammaire')) {
      expect(/___|…/.test(it.enonce)).toBe(true);
    }
  });

  it.each([1, 2, 3] as Difficulte[])('génère des questions valides (difficulté %i)', (d) => {
    const config = EPREUVES[nom];
    const refs = gen.construireRefs({ graineBase: 321, nb: 400, difficulte: d, config });
    for (const ref of refs) {
      const q = gen.generer(ref);
      expect(q.options).toHaveLength(config.nbChoix);
      expect(new Set(q.options).size).toBe(config.nbChoix);
      const brut = items.find((x) => x.id === ref.params!.item)!;
      expect(q.options[q.bonneReponse]).toBe(brut.bonne);
      // Les fausses réponses affichées viennent bien de l'item.
      for (const o of q.options) expect([brut.bonne, ...brut.fausses.map((f) => f.texte)]).toContain(o);
    }
  });

  it('ne répète pas un item dans une séance tant que la banque n’est pas épuisée', () => {
    const refs = gen.construireRefs({ graineBase: 5, nb: 30, difficulte: 2, config: EPREUVES[nom] });
    expect(new Set(refs.map((r) => r.params!.item)).size).toBe(30);
  });

  it('boucle sur la banque si on en demande plus qu’elle n’en contient', () => {
    const refs = gen.construireRefs({ graineBase: 5, nb: items.length + 20, difficulte: 2, config: EPREUVES[nom] });
    expect(refs).toHaveLength(items.length + 20);
  });

  it('est déterministe, et l’ordre des propositions dépend de la graine', () => {
    const [ref] = gen.construireRefs({ graineBase: 9, nb: 1, difficulte: 2, config: EPREUVES[nom] });
    expect(gen.generer(ref)).toEqual(gen.generer(ref));
    const ordres = new Set<string>();
    for (let s = 1; s <= 60; s++) ordres.add(gen.generer({ ...ref, seed: s }).options.join('|'));
    expect(ordres.size).toBeGreaterThan(5);
  });

  it('refuse un item inconnu', () => {
    const [ref] = gen.construireRefs({ graineBase: 9, nb: 1, difficulte: 2, config: EPREUVES[nom] });
    expect(() => gen.generer({ ...ref, params: { item: 'INCONNU', nbChoix: 4 } })).toThrow();
  });

  it('seulementRelus filtre les items non relus', () => {
    const config = { ...EPREUVES[nom], parametres: { ...EPREUVES[nom].parametres, seulementRelus: 1 } };
    expect(() => gen.construireRefs({ graineBase: 1, nb: 5, difficulte: 2, config })).toThrow();
  });
});

describe('contrôles de qualité propres à l’anglais', () => {
  it('la bonne réponse ne figure jamais deux fois dans les propositions (insensible à la casse)', () => {
    for (const it of BANQUES.anglais!) {
      const bas = it.fausses.map((x) => x.texte.toLowerCase());
      expect(bas).not.toContain(it.bonne.toLowerCase());
    }
  });
});
