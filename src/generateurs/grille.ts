import { creerPrng, type Prng } from '../lib/prng';
import type { Difficulte, Grille, Item, ItemRef } from '../lib/types';

export const VERSION_GRILLE = 1;

// ---------- Transformations (groupe diédral des 8 isométries du carré) ----------

/** Rotation de 90° dans le sens horaire. */
export const rot90 = (g: Grille): Grille => g[0].map((_, c) => g.map((_, r) => g[g.length - 1 - r][c]));
export const miroirH = (g: Grille): Grille => g.map((l) => [...l].reverse());
export const miroirV = (g: Grille): Grille => [...g].reverse().map((l) => [...l]);
export const transposee = (g: Grille): Grille => g[0].map((_, c) => g.map((l) => l[c]));
export const antiTransposee = (g: Grille): Grille => g.map((_, i) => g.map((_, j) => g[g.length - 1 - j][g.length - 1 - i]));

export function rotation(g: Grille, quartsDeTour: number): Grille {
  let r = g;
  for (let k = 0; k < ((quartsDeTour % 4) + 4) % 4; k++) r = rot90(r);
  return r;
}

export const cle = (g: Grille): string => g.map((l) => l.map((x) => (x ? '1' : '0')).join('')).join('/');
export const egales = (a: Grille, b: Grille): boolean => cle(a) === cle(b);

export interface Transformee {
  nom: string;
  grille: Grille;
  type: 'identite' | 'rotation' | 'miroir';
}

/** Les 8 transformations du groupe diédral appliquées à la grille. */
export function groupeDiedral(g: Grille): Transformee[] {
  return [
    { nom: 'la grille de départ, non tournée', grille: g, type: 'identite' },
    { nom: 'une rotation de 90° dans le sens horaire', grille: rotation(g, 1), type: 'rotation' },
    { nom: 'une rotation de 180°', grille: rotation(g, 2), type: 'rotation' },
    { nom: 'une rotation de 90° dans le sens anti-horaire', grille: rotation(g, 3), type: 'rotation' },
    { nom: 'un miroir gauche-droite', grille: miroirH(g), type: 'miroir' },
    { nom: 'un miroir haut-bas', grille: miroirV(g), type: 'miroir' },
    { nom: 'un miroir selon la diagonale', grille: transposee(g), type: 'miroir' },
    { nom: 'un miroir selon l’autre diagonale', grille: antiTransposee(g), type: 'miroir' },
  ];
}

/**
 * Une grille est "utilisable" si ses 8 transformations sont toutes différentes :
 * sinon deux propositions pourraient être identiques (grille symétrique) et la
 * bonne réponse ne serait pas unique.
 */
export function aHuitTransformationsDistinctes(g: Grille): boolean {
  return new Set(groupeDiedral(g).map((t) => cle(t.grille))).size === 8;
}

// ---------- Génération ----------

const TAILLE: Record<Difficulte, number> = { 1: 4, 2: 5, 3: 6 };
const LETTRES = ['A', 'B', 'C', 'D', 'E', 'F'];

function grilleAleatoire(rng: Prng, n: number): Grille {
  const densite = 0.4 + rng.suivant() * 0.15;
  return Array.from({ length: n }, () => Array.from({ length: n }, () => rng.chance(densite)));
}

/** Tire une grille sans symétrie (contrôle d'unicité obligatoire). */
export function grilleSansSymetrie(rng: Prng, n: number): Grille {
  for (let essai = 0; essai < 1000; essai++) {
    const g = grilleAleatoire(rng, n);
    if (aHuitTransformationsDistinctes(g)) return g;
  }
  throw new Error(`Aucune grille ${n}×${n} sans symétrie trouvée`);
}

interface Proposition {
  grille: Grille;
  /** Description du piège, pour la correction */
  nature: string;
}

function genererGrille(ref: ItemRef): Item {
  if (ref.version !== VERSION_GRILLE) {
    throw new Error(`Version de générateur non supportée : grille v${ref.version}`);
  }
  const params = ref.params ?? {};
  const n = Number(params.taille ?? TAILLE[ref.difficulte]);
  const nbChoix = Number(params.nbChoix ?? 5);
  const sensParam = String(params.sensRotation ?? 'horaire');
  const rng = creerPrng(ref.seed);

  const modele = grilleSansSymetrie(rng, n);
  const angle = rng.choisir([90, 180, 270] as const);
  const antiHoraire = sensParam === 'antihoraire' || (sensParam === 'mixte' && rng.chance(0.5));
  // Équivalent horaire de la rotation demandée.
  const quarts = (antiHoraire ? 4 - angle / 90 : angle / 90) % 4;
  const bonne = rotation(modele, quarts);

  // Distracteurs : les 7 autres éléments du groupe diédral (tous distincts, vérifié ci-dessus)…
  const groupe = groupeDiedral(modele);
  const autres: Proposition[] = groupe
    .filter((t) => !egales(t.grille, bonne))
    .map((t) => ({ grille: t.grille, nature: t.nom }));
  // … plus des quasi-réponses : la bonne rotation avec une seule case inversée.
  const clesGroupe = new Set(groupe.map((t) => cle(t.grille)));
  const presque: Proposition[] = [];
  const cellules = rng.melanger(Array.from({ length: n * n }, (_, i) => i));
  for (const i of cellules) {
    const r = Math.floor(i / n);
    const c = i % n;
    const g = bonne.map((l) => [...l]);
    g[r][c] = !g[r][c];
    if (!clesGroupe.has(cle(g))) presque.push({ grille: g, nature: 'la bonne rotation, avec une case inversée' });
    if (presque.length >= 3) break;
  }

  const miroirs = rng.melanger(autres.filter((a) => a.nature.includes('miroir')));
  const reste = rng.melanger(autres.filter((a) => !a.nature.includes('miroir')));
  let choisis: Proposition[];
  const besoin = nbChoix - 1;
  if (ref.difficulte === 1) choisis = rng.melanger(autres).slice(0, besoin);
  else if (ref.difficulte === 2) choisis = [...miroirs.slice(0, 2), ...rng.melanger([...miroirs.slice(2), ...reste])].slice(0, besoin);
  else choisis = [...presque.slice(0, 2), ...miroirs.slice(0, 2), ...rng.melanger([...presque.slice(2), ...miroirs.slice(2), ...reste])].slice(0, besoin);

  const props: Proposition[] = rng.melanger([{ grille: bonne, nature: 'la bonne réponse' }, ...choisis]);
  const idxBonne = props.findIndex((p) => egales(p.grille, bonne));
  const lettres = LETTRES.slice(0, props.length);

  const sens = antiHoraire ? 'anti-horaire' : 'horaire';
  const detail = props
    .map((p, i) => (i === idxBonne ? null : `${lettres[i]} : ${p.nature}`))
    .filter(Boolean)
    .join(' ; ');
  const explication =
    `Rotation de ${angle}° dans le sens ${sens}. Repère une case caractéristique (un coin, une case isolée) et suis-la : ` +
    `à chaque quart de tour horaire, la première ligne devient la dernière colonne. ` +
    `Les autres propositions : ${detail}.`;

  return {
    id: `spatial-grille-v${ref.version}-d${ref.difficulte}-s${ref.seed}`,
    ref,
    consigne: `Cette grille pivote de ${angle}° dans le sens ${sens}. Quelle grille obtient-on ?`,
    stimulus: { type: 'grille', modele, propositions: props.map((p) => p.grille) },
    options: lettres,
    bonneReponse: idxBonne,
    explication,
  };
}

export { genererGrille };
