import { describe, expect, it } from 'vitest';
import { EPREUVES } from '../config/epreuves';
import { ROTATIONS } from '../lib/geometrie3d';
import { creerPrng } from '../lib/prng';
import type { Difficulte, PatronCube } from '../lib/types';
import { FACES_3D, cleVue, creerCube, toutesLesVues, vue } from './cube';
import { cross, egalV, neg, type V3 } from '../lib/geometrie3d';
import { generateurSpatial } from './spatial';

const DIFFS: Difficulte[] = [1, 2, 3];
const FORMES = ['patron', 'vues'] as const;

describe('pliage du patron (vérification indépendante des arêtes)', () => {
  // Patron en croix :        dessus
  //                gauche  avant  droite  arriere
  //                        dessous
  // Pour deux carrés voisins dans le patron, la direction « vers le voisin » tracée sur une face
  // doit être la normale de la face voisine (sinon l'arête ne se recolle pas correctement).
  const direction = (nom: keyof typeof FACES_3D, d: 'haut' | 'bas' | 'gauche' | 'droite'): V3 => {
    const { n, haut } = FACES_3D[nom];
    const droite = cross(haut, n);
    return d === 'haut' ? haut : d === 'bas' ? neg(haut) : d === 'droite' ? droite : neg(droite);
  };
  const voisins: [keyof typeof FACES_3D, 'haut' | 'bas' | 'gauche' | 'droite', keyof typeof FACES_3D][] = [
    ['avant', 'haut', 'dessus'],
    ['avant', 'bas', 'dessous'],
    ['avant', 'gauche', 'gauche'],
    ['avant', 'droite', 'droite'],
    ['droite', 'droite', 'arriere'],
    // et dans l'autre sens
    ['dessus', 'bas', 'avant'],
    ['dessous', 'haut', 'avant'],
    ['gauche', 'droite', 'avant'],
    ['droite', 'gauche', 'avant'],
    ['arriere', 'gauche', 'droite'],
  ];
  it.each(voisins)('%s → %s rejoint la face %s', (a, d, b) => {
    expect(egalV(direction(a, d), FACES_3D[b].n)).toBe(true);
  });

  it('les six normales sont distinctes et opposées deux à deux', () => {
    const n = Object.values(FACES_3D).map((f) => f.n);
    expect(new Set(n.map((v) => v.join())).size).toBe(6);
    for (const v of n) expect(n.some((w) => egalV(w, neg(v)))).toBe(true);
  });
});

describe('modèle de cube', () => {
  it('un cube a 6 symboles distincts et 24 vues distinctes', () => {
    const rng = creerPrng(1);
    for (let k = 0; k < 300; k++) {
      const { faces } = creerCube(rng);
      expect(new Set(faces.map((f) => f.sym)).size).toBe(6);
      expect(toutesLesVues(faces).size).toBe(24);
    }
  });

  it('le miroir d’un cube n’est jamais l’un de ses 24 retournements', () => {
    const rng = creerPrng(2);
    for (let k = 0; k < 500; k++) {
      const { faces } = creerCube(rng);
      const vraies = toutesLesVues(faces);
      for (const R of ROTATIONS) expect(vraies.has(cleVue(vue(faces, R, true)))).toBe(false);
    }
  });

  it('la vue sans rotation correspond au patron plié (dessus, avant, droite)', () => {
    const rng = creerPrng(3);
    for (let k = 0; k < 200; k++) {
      const { faces, patron } = creerCube(rng);
      const v = vue(faces, ROTATIONS[0]);
      const dans = (nom: keyof PatronCube) => patron[nom];
      // Symboles identiques et orientation conservée sur les trois faces visibles.
      expect(v[0]).toEqual({ sym: dans('dessus').sym, k: dans('dessus').k, mir: false });
      expect(v[1]).toEqual({ sym: dans('avant').sym, k: dans('avant').k, mir: false });
      expect(v[2]).toEqual({ sym: dans('droite').sym, k: dans('droite').k, mir: false });
    }
  });
});

describe('générateur de cubes retournés', () => {
  it.each(DIFFS.flatMap((d) => FORMES.map((f) => [d, f] as const)))(
    '1 bon + 4 faux, aucun faux ne correspond à une des 24 orientations (difficulté %i, forme %s)',
    (d, forme) => {
      const config = { ...EPREUVES.spatial, parametres: { ...EPREUVES.spatial.parametres, variantes: forme } };
      const refs = generateurSpatial.construireRefs({ graineBase: 5, nb: 800, difficulte: d, config });
      for (const ref of refs) {
        const item = generateurSpatial.generer(ref);
        expect(item.stimulus.type).toBe('cube');
        if (item.stimulus.type !== 'cube') continue;
        const { propositions } = item.stimulus;
        expect(propositions).toHaveLength(5);
        expect(new Set(propositions.map(cleVue)).size).toBe(5);

        // Recalcul indépendant : on reconstruit le même cube (même graine) et on teste les 24 orientations.
        const rng = creerPrng(ref.seed);
        const { faces } = creerCube(rng);
        const possibles = toutesLesVues(faces);
        const dedans = propositions.map((p) => possibles.has(cleVue(p)));
        expect(dedans.filter(Boolean)).toHaveLength(1);
        expect(dedans[item.bonneReponse]).toBe(true);
      }
    },
  );

  it('en forme « vues », la bonne réponse n’est jamais l’une des deux vues du modèle', () => {
    const config = { ...EPREUVES.spatial, parametres: { ...EPREUVES.spatial.parametres, variantes: 'vues' } };
    const refs = generateurSpatial.construireRefs({ graineBase: 6, nb: 500, difficulte: 2, config });
    for (const ref of refs) {
      const item = generateurSpatial.generer(ref);
      if (item.stimulus.type !== 'cube' || item.stimulus.modele.forme !== 'vues') throw new Error('forme inattendue');
      const montrees = item.stimulus.modele.vues.map(cleVue);
      expect(montrees).not.toContain(cleVue(item.stimulus.propositions[item.bonneReponse]));
    }
  });

  it('est déterministe', () => {
    const [ref] = generateurSpatial.construireRefs({ graineBase: 9, nb: 1, difficulte: 3, config: EPREUVES.spatial });
    expect(generateurSpatial.generer(ref)).toEqual(generateurSpatial.generer(ref));
  });
});
