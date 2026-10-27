import { describe, expect, it } from 'vitest';
import { EPREUVES } from '../config/epreuves';
import { MOTS } from '../data/mots';
import type { Difficulte } from '../lib/types';
import {
  genererTableau,
  generateurCodage,
  initiale,
  similarite,
} from './codage';

const DIFFS: Difficulte[] = [1, 2, 3];
const SENS = ['numero-vers-mot', 'mot-vers-numero'] as const;

describe('liste de mots', () => {
  it('ne contient aucun doublon et uniquement des minuscules', () => {
    expect(new Set(MOTS).size).toBe(MOTS.length);
    for (const m of MOTS) expect(m).toBe(m.toLowerCase());
  });
  it('est assez variée pour un tableau facile (≥ 12 initiales différentes)', () => {
    expect(new Set(MOTS.map(initiale)).size).toBeGreaterThanOrEqual(12);
  });
});

describe('tableaux de codage', () => {
  it.each(DIFFS)('mots et numéros uniques sur 1500 graines (difficulté %i)', (d) => {
    for (let s = 1; s <= 1500; s++) {
      const t = genererTableau(s, 12, d);
      expect(t).toHaveLength(12);
      expect(new Set(t.map((e) => e.mot)).size).toBe(12);
      expect(new Set(t.map((e) => e.numero)).size).toBe(12);
      for (const e of t) {
        if (d === 3) expect(e.numero).toBeGreaterThanOrEqual(100);
        else expect(e.numero).toBeLessThanOrEqual(99);
      }
    }
  });

  it('facile : aucune initiale en commun', () => {
    for (let s = 1; s <= 1500; s++) {
      const t = genererTableau(s, 12, 1);
      expect(new Set(t.map((e) => initiale(e.mot))).size).toBe(12);
    }
  });

  it('difficile : les mots se ressemblent plus qu’en facile', () => {
    const moyenne = (d: Difficulte) => {
      let total = 0;
      let n = 0;
      for (let s = 1; s <= 300; s++) {
        const mots = genererTableau(s, 12, d).map((e) => e.mot);
        for (let i = 0; i < mots.length; i++)
          for (let j = i + 1; j < mots.length; j++) {
            total += similarite(mots[i], mots[j]);
            n++;
          }
      }
      return total / n;
    };
    expect(moyenne(3)).toBeGreaterThan(moyenne(1));
  });
});

describe('générateur codage', () => {
  it.each(DIFFS.flatMap((d) => SENS.map((s) => [d, s] as const)))(
    'items valides sur 1500 graines (difficulté %i, sens %s)',
    (d, sens) => {
      const config = {
        ...EPREUVES.codage,
        parametres: { ...EPREUVES.codage.parametres, sens },
      };
      const refs = generateurCodage.construireRefs({ graineBase: 77, nb: 1500, difficulte: d, config });
      for (const ref of refs) {
        const item = generateurCodage.generer(ref);
        expect(item.stimulus.type).toBe('codage');
        if (item.stimulus.type !== 'codage') continue;
        const { tableau, cible } = item.stimulus;

        expect(item.options).toHaveLength(config.nbChoix);
        expect(new Set(item.options).size).toBe(item.options.length);

        // La bonne réponse correspond bien au tableau.
        const attendu = sens === 'numero-vers-mot' ? cible.mot : String(cible.numero);
        expect(item.options[item.bonneReponse]).toBe(attendu);
        const dansTableau = tableau.find((e) =>
          sens === 'numero-vers-mot' ? e.numero === cible.numero : e.mot === cible.mot,
        );
        expect(dansTableau).toEqual(cible);

        // Les distracteurs sont de vrais couples du tableau, différents de la cible.
        const valides = new Set(tableau.map((e) => (sens === 'numero-vers-mot' ? e.mot : String(e.numero))));
        for (const o of item.options) expect(valides.has(o)).toBe(true);
      }
    },
  );

  it('les questions d’un même groupe partagent le même tableau', () => {
    const refs = generateurCodage.construireRefs({
      graineBase: 5,
      nb: 31,
      difficulte: 2,
      config: EPREUVES.codage,
    });
    const tab = (i: number) => {
      const it = generateurCodage.generer(refs[i]);
      return it.stimulus.type === 'codage' ? it.stimulus.tableau : [];
    };
    expect(tab(0)).toEqual(tab(14));
    expect(tab(0)).not.toEqual(tab(15));
    expect(tab(15)).toEqual(tab(29));
  });

  it('est déterministe', () => {
    const [ref] = generateurCodage.construireRefs({
      graineBase: 9,
      nb: 1,
      difficulte: 2,
      config: EPREUVES.codage,
    });
    expect(generateurCodage.generer(ref)).toEqual(generateurCodage.generer(ref));
  });
});
