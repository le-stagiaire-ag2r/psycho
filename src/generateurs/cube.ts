import { cleImage } from '../data/symboles';
import { SYMBOLES } from '../data/symboles';
import {
  EMPLACEMENTS,
  REFLEXION_X,
  ROTATIONS,
  cross,
  emplacementDe,
  mulMV,
  quartsDepuis,
  type M3,
  type V3,
} from '../lib/geometrie3d';
import { creerPrng, type Prng } from '../lib/prng';
import type { Difficulte, FaceCube, Item, ItemRef, PatronCube, StimulusCube, Vue3 } from '../lib/types';

export const VERSION_CUBE = 1;

// ---------- Modèle 3D d'un cube à 6 symboles distincts ----------

type NomFace = keyof PatronCube;

/** Normale et « haut » de chaque face dans le patron (haut = haut de la feuille de papier). */
export const FACES_3D: Record<NomFace, { n: V3; haut: V3 }> = {
  avant: { n: [0, -1, 0], haut: [0, 0, 1] },
  dessus: { n: [0, 0, 1], haut: [0, 1, 0] },
  droite: { n: [1, 0, 0], haut: [0, 0, 1] },
  gauche: { n: [-1, 0, 0], haut: [0, 0, 1] },
  dessous: { n: [0, 0, -1], haut: [0, -1, 0] },
  arriere: { n: [0, 1, 0], haut: [0, 0, 1] },
};
export const NOMS: NomFace[] = ['dessus', 'gauche', 'avant', 'droite', 'arriere', 'dessous'];

export interface Face3D {
  nom: NomFace;
  sym: number;
  n: V3;
  /** Direction du haut du symbole dans l'espace */
  u: V3;
  /** +1 normal, −1 en miroir */
  c: 1 | -1;
}

export function creerCube(rng: Prng): { faces: Face3D[]; patron: PatronCube } {
  const symboles = rng.melanger([...SYMBOLES.keys()]).slice(0, 6);
  const patron = {} as PatronCube;
  const faces: Face3D[] = NOMS.map((nom, i) => {
    const { n, haut } = FACES_3D[nom];
    const k = rng.entier(0, 3);
    let u = haut;
    for (let j = 0; j < k; j++) u = cross(u, n); // un quart de tour horaire : le haut passe à droite
    patron[nom] = { sym: symboles[i], k, mir: false };
    return { nom, sym: symboles[i], n, u, c: 1 };
  });
  return { faces, patron };
}

/** Ce qu'on voit des trois faces visibles après avoir tourné (et éventuellement réfléchi) le cube. */
export function vue(faces: readonly Face3D[], R: M3, miroir = false): Vue3 {
  const res: Partial<Record<number, FaceCube>> = {};
  for (const f of faces) {
    const base = miroir ? { n: mulMV(REFLEXION_X, f.n), u: mulMV(REFLEXION_X, f.u), c: -f.c } : { n: f.n, u: f.u, c: f.c };
    const n = mulMV(R, base.n);
    const e = emplacementDe(n);
    if (e === null) continue;
    res[EMPLACEMENTS.indexOf(e)] = {
      sym: f.sym,
      k: quartsDepuis(e, mulMV(R, base.u)),
      mir: base.c < 0,
    };
  }
  return [res[0]!, res[1]!, res[2]!];
}

export const cleVue = (v: Vue3): string => v.map((f) => `${f.sym}:${cleImage(f.sym, f.k, f.mir)}`).join('|');

/** Toutes les vues possibles du cube (une par rotation propre). */
export function toutesLesVues(faces: readonly Face3D[]): Set<string> {
  return new Set(ROTATIONS.map((R) => cleVue(vue(faces, R))));
}

// ---------- Faux cubes ----------

type Defaut = 'miroirCube' | 'echange' | 'rotation90' | 'rotation180' | 'miroirSymbole' | 'symboleCache';

const DEFAUTS: Record<Difficulte, Defaut[]> = {
  1: ['rotation180', 'symboleCache', 'echange'],
  2: ['echange', 'rotation90', 'miroirSymbole', 'symboleCache'],
  3: ['miroirCube', 'miroirSymbole', 'rotation90', 'echange'],
};

const NATURE: Record<Defaut, string> = {
  miroirCube: 'le cube miroir (tous les symboles sont inversés gauche-droite)',
  echange: 'deux faces dont les symboles ont été échangés',
  rotation90: 'un symbole pivoté d’un quart de tour',
  rotation180: 'un symbole retourné à l’envers (demi-tour)',
  miroirSymbole: 'un symbole en miroir',
  symboleCache: 'un symbole qui appartient à une face cachée',
};

function copier(v: Vue3): Vue3 {
  return v.map((f) => ({ ...f })) as Vue3;
}

function appliquerDefaut(rng: Prng, faces: readonly Face3D[], depart: Vue3, R: M3, defaut: Defaut): Vue3 | null {
  if (defaut === 'miroirCube') return vue(faces, R, true);
  const v = copier(depart);
  const i = rng.entier(0, 2);
  switch (defaut) {
    case 'echange': {
      const j = (i + rng.entier(1, 2)) % 3;
      [v[i], v[j]] = [v[j], v[i]];
      return v;
    }
    case 'rotation90':
      v[i].k = (v[i].k + (rng.chance(0.5) ? 1 : 3)) % 4;
      return v;
    case 'rotation180':
      v[i].k = (v[i].k + 2) % 4;
      return v;
    case 'miroirSymbole':
      v[i].mir = !v[i].mir;
      return v;
    case 'symboleCache': {
      const visibles = new Set(v.map((f) => f.sym));
      const caches = faces.map((f) => f.sym).filter((s) => !visibles.has(s));
      if (caches.length === 0) return null;
      v[i].sym = rng.choisir(caches);
      return v;
    }
  }
}

// ---------- Génération de l'item ----------

function genererCube(ref: ItemRef): Item {
  if (ref.version !== VERSION_CUBE) {
    throw new Error(`Version de générateur non supportée : cube v${ref.version}`);
  }
  const params = ref.params ?? {};
  const nbChoix = Number(params.nbChoix ?? 5);
  const forme = String(params.forme ?? 'patron') as 'patron' | 'vues';
  const rng = creerPrng(ref.seed);

  const { faces, patron } = creerCube(rng);
  const possibles = toutesLesVues(faces);

  // Vue correcte : une rotation qui ne reproduit pas les vues déjà montrées dans le modèle.
  const rotFlip = ROTATIONS.find((R) => mulMV(R, [0, 0, -1]).join() === '0,0,1' && mulMV(R, [0, 1, 0]).join() === '1,0,0')!;
  const interdites = new Set<string>(forme === 'vues' ? [cleVue(vue(faces, ROTATIONS[0])), cleVue(vue(faces, rotFlip))] : []);
  const rotationsPossibles = ROTATIONS.filter((R) => !interdites.has(cleVue(vue(faces, R))));
  const R = rng.choisir(rotationsPossibles);
  const bonne = vue(faces, R);

  const defauts = DEFAUTS[ref.difficulte];
  const faux: { vue: Vue3; defaut: Defaut }[] = [];
  const vues = new Set<string>([cleVue(bonne)]);
  for (let essai = 0; essai < 500 && faux.length < nbChoix - 1; essai++) {
    // On alterne les types de défauts pour varier les pièges.
    const defaut = defauts[(faux.length + (essai > 100 ? essai : 0)) % defauts.length];
    const base = vue(faces, rng.choisir(rotationsPossibles));
    const candidat = appliquerDefaut(rng, faces, base, R, defaut);
    if (!candidat) continue;
    const c = cleVue(candidat);
    // Le faux cube ne doit correspondre à AUCUNE des 24 orientations du vrai cube.
    if (possibles.has(c) || vues.has(c)) continue;
    vues.add(c);
    faux.push({ vue: candidat, defaut });
  }
  if (faux.length < nbChoix - 1) throw new Error('Pas assez de faux cubes valides');

  const props = rng.melanger([{ vue: bonne, defaut: null as Defaut | null }, ...faux]);
  const lettres = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, props.length);
  const idxBonne = props.findIndex((p) => p.defaut === null);
  const detail = props
    .map((p, i) => (p.defaut ? `${lettres[i]} : ${NATURE[p.defaut]}` : null))
    .filter(Boolean)
    .join(' ; ');

  const modele: StimulusCube['modele'] =
    forme === 'patron'
      ? { forme: 'patron', patron }
      : { forme: 'vues', vues: [vue(faces, ROTATIONS[0]), vue(faces, rotFlip)] };

  return {
    id: `spatial-cube-v${ref.version}-d${ref.difficulte}-s${ref.seed}-${forme}`,
    ref,
    consigne:
      forme === 'patron'
        ? 'Ce patron est plié pour former un cube. Quel cube obtient-on ?'
        : 'Voici un même cube vu sous deux angles opposés. Lequel de ces cubes est le même, simplement retourné ?',
    stimulus: { type: 'cube', modele, propositions: props.map((p) => p.vue) },
    options: lettres,
    bonneReponse: idxBonne,
    explication:
      `Choisis deux faces voisines visibles dans la proposition et retrouve leur position relative dans le ${forme === 'patron' ? 'patron' : 'modèle'} : ` +
      `si l'une des deux est à gauche de l'autre dans le cube, elle doit l'être aussi dans la réponse, avec le même sens de rotation du symbole. ` +
      `Les autres propositions montrent : ${detail}.`,
  };
}

export { genererCube };
