import { describe, expect, it } from 'vitest';
import { EPREUVES } from '../config/epreuves';
import { creerPrng } from '../lib/prng';
import type { Difficulte, Grille } from '../lib/types';
import {
  aHuitTransformationsDistinctes,
  antiTransposee,
  cle,
  egales,
  groupeDiedral,
  grilleSansSymetrie,
  miroirH,
  miroirV,
  rot90,
  rotation,
  transposee,
} from './grille';
import { generateurSpatial } from './spatial';

const DIFFS: Difficulte[] = [1, 2, 3];
const CONFIG_GRILLE = { ...EPREUVES.spatial, parametres: { ...EPREUVES.spatial.parametres, variantes: 'grille' } };

const exemple: Grille = [
  [true, false, false],
  [true, true, false],
  [false, false, false],
];

describe('transformations de grille', () => {
  it('rot90 tourne dans le sens horaire', () => {
    // La case noire en haut à gauche passe en haut à droite après un quart de tour horaire.
    expect(rot90(exemple)).toEqual([
      [false, true, true],
      [false, true, false],
      [false, false, false],
    ]);
  });

  it('quatre quarts de tour redonnent la grille', () => {
    expect(rotation(exemple, 4)).toEqual(exemple);
    expect(rotation(exemple, 2)).toEqual(rot90(rot90(exemple)));
    expect(rotation(exemple, -1)).toEqual(rotation(exemple, 3));
  });

  it('les miroirs sont des involutions', () => {
    for (const f of [miroirH, miroirV, transposee, antiTransposee]) {
      expect(f(f(exemple))).toEqual(exemple);
    }
  });

  it('une grille symétrique est détectée', () => {
    const sym: Grille = [
      [true, false, true],
      [false, true, false],
      [true, false, true],
    ];
    expect(aHuitTransformationsDistinctes(sym)).toBe(false);
    expect(aHuitTransformationsDistinctes(exemple)).toBe(true);
  });
});

describe('grilleSansSymetrie', () => {
  it.each([4, 5, 6])('donne 8 transformations distinctes (taille %i)', (n) => {
    const rng = creerPrng(n);
    for (let k = 0; k < 500; k++) {
      const g = grilleSansSymetrie(rng, n);
      expect(new Set(groupeDiedral(g).map((t) => cle(t.grille))).size).toBe(8);
    }
  });
});

describe('générateur spatial (grilles)', () => {
  it.each(DIFFS)('bonne réponse unique sur 2000 graines (difficulté %i)', (d) => {
    const refs = generateurSpatial.construireRefs({
      graineBase: 31,
      nb: 2000,
      difficulte: d,
      config: CONFIG_GRILLE,
    });
    for (const ref of refs) {
      const item = generateurSpatial.generer(ref);
      expect(item.stimulus.type).toBe('grille');
      if (item.stimulus.type !== 'grille') continue;
      const { modele, propositions } = item.stimulus;

      expect(propositions).toHaveLength(EPREUVES.spatial.nbChoix);
      expect(item.options).toHaveLength(propositions.length);

      // Aucune proposition en double.
      expect(new Set(propositions.map(cle)).size).toBe(propositions.length);

      // Exactement une proposition est une rotation du modèle de l'angle demandé.
      const m = /(\d+)° dans le sens (horaire|anti-horaire)/.exec(item.consigne)!;
      const quarts = Number(m[1]) / 90;
      const attendue = rotation(modele, m[2] === 'horaire' ? quarts : 4 - quarts);
      const correspondantes = propositions.filter((p) => egales(p, attendue));
      expect(correspondantes).toHaveLength(1);
      expect(egales(propositions[item.bonneReponse], attendue)).toBe(true);

      // Aucun distracteur n'est une rotation du modèle de l'angle demandé (déjà garanti), et
      // les cases noires ne sont pas toutes identiques.
      for (const p of propositions) expect(p.flat().some(Boolean) && p.flat().some((x) => !x)).toBe(true);
    }
  });

  it('est déterministe', () => {
    const [ref] = generateurSpatial.construireRefs({ graineBase: 4, nb: 1, difficulte: 3, config: CONFIG_GRILLE });
    expect(generateurSpatial.generer(ref)).toEqual(generateurSpatial.generer(ref));
  });

  it('respecte le sens configuré', () => {
    for (const sens of ['horaire', 'antihoraire']) {
      const config = { ...CONFIG_GRILLE, parametres: { ...CONFIG_GRILLE.parametres, sensRotation: sens } };
      const refs = generateurSpatial.construireRefs({ graineBase: 8, nb: 100, difficulte: 2, config });
      for (const ref of refs) {
        const item = generateurSpatial.generer(ref);
        expect(item.consigne).toContain(sens === 'horaire' ? 'sens horaire' : 'sens anti-horaire');
      }
    }
  });
});
