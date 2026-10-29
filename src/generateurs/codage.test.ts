import { describe, expect, it } from 'vitest';
import { EPREUVES } from '../config/epreuves';
import { MOTS } from '../data/mots';
import type { Difficulte } from '../lib/types';
import {
  codeVoisin,
  genererTableau,
  genererTableauV2,
  generateurCodage,
  initiale,
  positionsDifferentes,
  similarite,
  VERSION_CODAGE,
  VERSION_CODAGE_V1,
} from './codage';
import { creerPrng } from '../lib/prng';
import type { ItemRef } from '../lib/types';

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

describe('générateur codage (version 2 : codes à 4 chiffres, 4 codes très proches)', () => {
  it('le tableau a 12 mots et 12 codes à 4 chiffres tous différents', () => {
    for (const d of DIFFS) {
      for (let s = 1; s <= 800; s++) {
        const t = genererTableauV2(s, 12, d);
        expect(t).toHaveLength(12);
        expect(new Set(t.map((e) => e.mot)).size).toBe(12);
        expect(new Set(t.map((e) => e.numero)).size).toBe(12);
        for (const e of t) expect(String(e.numero)).toMatch(/^[1-9]\d{3}$/);
      }
    }
  });

  it.each(DIFFS)('items valides sur 1500 graines (difficulté %i)', (d) => {
    const refs = generateurCodage.construireRefs({ graineBase: 77, nb: 1500, difficulte: d, config: EPREUVES.codage });
    for (const ref of refs) {
      expect(ref.version).toBe(VERSION_CODAGE);
      const item = generateurCodage.generer(ref);
      expect(item.stimulus.type).toBe('codage');
      if (item.stimulus.type !== 'codage') continue;
      const { tableau, cible } = item.stimulus;
      expect(item.options).toHaveLength(EPREUVES.codage.nbChoix);
      expect(new Set(item.options).size).toBe(item.options.length);
      const code = String(cible.numero);
      expect(item.options[item.bonneReponse]).toBe(code);
      expect(tableau.find((e) => e.mot === cible.mot)).toEqual(cible);
      const codesTableau = new Set(tableau.map((e) => String(e.numero)));
      item.options.forEach((o, i) => {
        expect(o).toMatch(/^[1-9]\d{3}$/);
        if (i === item.bonneReponse) return;
        // Un faux code ressemble au bon (1 à 3 chiffres changés) et n'est le code d'aucun autre mot.
        const nb = positionsDifferentes(code, o).length;
        expect(nb).toBeGreaterThanOrEqual(1);
        expect(nb).toBeLessThanOrEqual(3);
        expect(codesTableau.has(o)).toBe(false);
      });
      expect(new Set(item.pourquoi).size).toBe(item.pourquoi.length);
    }
  });

  it('la difficulté rapproche les faux codes du bon', () => {
    const moy = (d: Difficulte) => {
      const refs = generateurCodage.construireRefs({ graineBase: 3, nb: 600, difficulte: d, config: EPREUVES.codage });
      let total = 0;
      let n = 0;
      for (const ref of refs) {
        const it = generateurCodage.generer(ref);
        if (it.stimulus.type !== 'codage') continue;
        const code = String(it.stimulus.cible.numero);
        for (const o of it.options) if (o !== code) {
          total += positionsDifferentes(code, o).length;
          n++;
        }
      }
      return total / n;
    };
    expect(moy(1)).toBeGreaterThan(moy(2));
    expect(moy(2)).toBeGreaterThan(moy(3) - 0.0001);
  });

  it('codeVoisin() ne recrée jamais le code et garde un premier chiffre non nul', () => {
    const rng = creerPrng(8);
    for (const base of ['1111', '1010', '9999', '1234', '5005']) {
      for (let k = 0; k < 500; k++) {
        for (const n of [1, 2, 3] as const) {
          const c = codeVoisin(base, rng, n);
          expect(c).not.toBe(base);
          expect(c[0]).not.toBe('0');
          const t = codeVoisin(base, rng, 1, true);
          expect(t).not.toBe(base);
          expect(t[0]).not.toBe('0');
        }
      }
    }
  });

  it('toutes les questions d’une séance partagent le même tableau', () => {
    const refs = generateurCodage.construireRefs({ graineBase: 5, nb: 40, difficulte: 2, config: EPREUVES.codage });
    const tab = (i: number) => {
      const it = generateurCodage.generer(refs[i]);
      return it.stimulus.type === 'codage' ? it.stimulus.tableau : [];
    };
    expect(tab(0)).toEqual(tab(39));
    expect(tab(0)).toHaveLength(12);
  });

  it('est déterministe', () => {
    const [ref] = generateurCodage.construireRefs({ graineBase: 9, nb: 1, difficulte: 2, config: EPREUVES.codage });
    expect(generateurCodage.generer(ref)).toEqual(generateurCodage.generer(ref));
  });
});

describe('codage : les anciennes questions (version 1) restent rejouables', () => {
  it.each(DIFFS.flatMap((d) => SENS.map((s) => [d, s] as const)))('difficulté %i, sens %s', (d, sens) => {
    for (let i = 0; i < 300; i++) {
      const ref: ItemRef = {
        epreuve: 'codage',
        version: VERSION_CODAGE_V1,
        seed: 100 + i,
        difficulte: d,
        params: { tableSeed: 5000 + Math.floor(i / 15), sens, taille: 12, nbChoix: 4 },
      };
      const item = generateurCodage.generer(ref);
      expect(item.stimulus.type).toBe('codage');
      if (item.stimulus.type !== 'codage') continue;
      const attendu = sens === 'numero-vers-mot' ? item.stimulus.cible.mot : String(item.stimulus.cible.numero);
      expect(item.options[item.bonneReponse]).toBe(attendu);
      expect(new Set(item.options).size).toBe(item.options.length);
    }
  });
});
