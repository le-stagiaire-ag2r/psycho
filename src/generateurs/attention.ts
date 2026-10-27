import { creerPrng, melangerGraines, type Prng } from '../lib/prng';
import type { Difficulte, Generateur, Item, ItemRef } from '../lib/types';

export const VERSION_ATTENTION = 1;

/** Lettres que l'œil confond facilement. */
const PAIRES_VISUELLES = ['OQ', 'EF', 'MN', 'PR', 'IL', 'CG', 'UV', 'BR', 'HN'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LETTRES_AMBIGUES = [...new Set(PAIRES_VISUELLES.join(''))];

export function partenairesVisuels(lettre: string): string[] {
  const res: string[] = [];
  for (const p of PAIRES_VISUELLES) {
    if (p.includes(lettre)) res.push(p[0] === lettre ? p[1] : p[0]);
  }
  return res;
}

type TypePerturbation = 'transposition' | 'substitution' | 'doublement' | 'omission';

export interface Perturbation {
  resultat: string;
  type: TypePerturbation;
  description: string;
}

interface Candidat extends Perturbation {
  /** Position la plus à gauche touchée (0-indexé) */
  i: number;
  /** Dernière position touchée */
  j: number;
}

const POIDS: Record<Difficulte, Record<TypePerturbation, number>> = {
  1: { substitution: 3, doublement: 2, omission: 2, transposition: 1 },
  2: { substitution: 2, doublement: 2, omission: 2, transposition: 2 },
  3: { substitution: 3, doublement: 1, omission: 1, transposition: 3 },
};

function longueurChaine(rng: Prng, diff: Difficulte): number {
  if (diff === 1) return rng.entier(5, 6);
  if (diff === 2) return rng.entier(6, 7);
  return rng.entier(7, 8);
}

export function genererChaine(rng: Prng, n: number, diff: Difficulte): string {
  let s = '';
  for (let k = 0; k < n; k++) {
    // Plus c'est difficile, plus on met de lettres facilement confondues.
    const ambigue = diff >= 2 && rng.chance(diff === 3 ? 0.6 : 0.4);
    s += ambigue ? rng.choisir(LETTRES_AMBIGUES) : rng.choisir([...ALPHABET]);
  }
  return s;
}

/** Position "au bord" (facile à repérer) ou "au milieu" (difficile) ? */
function estBord(i: number, j: number, n: number): boolean {
  return i === 0 || j >= n - 1;
}
function estMilieu(i: number, j: number, n: number): boolean {
  const debut = Math.floor(n / 3);
  const fin = Math.ceil((2 * n) / 3) - 1;
  return i >= debut && j <= fin + 1 && !estBord(i, j, n);
}

/**
 * Perturbe une chaîne pour qu'elle soit TOUJOURS différente de l'originale.
 * Les transpositions ne portent que sur deux lettres différentes (échanger deux
 * lettres identiques ne changerait rien).
 */
export function perturber(base: string, rng: Prng, diff: Difficulte): Perturbation {
  const n = base.length;
  const cands: Candidat[] = [];

  for (let i = 0; i < n - 1; i++) {
    if (base[i] === base[i + 1]) continue;
    cands.push({
      type: 'transposition',
      i,
      j: i + 1,
      resultat: base.slice(0, i) + base[i + 1] + base[i] + base.slice(i + 2),
      description: `les lettres ${i + 1} et ${i + 2} sont inversées (${base[i]}${base[i + 1]} au lieu de ${base[i + 1]}${base[i]})`,
    });
  }
  for (let i = 0; i < n; i++) {
    for (const r of partenairesVisuels(base[i])) {
      cands.push({
        type: 'substitution',
        i,
        j: i,
        resultat: base.slice(0, i) + r + base.slice(i + 1),
        description: `la lettre ${i + 1} change : ${base[i]} devient ${r} (lettres visuellement proches)`,
      });
    }
    if (diff <= 2) {
      const autres = [...ALPHABET].filter((l) => l !== base[i]);
      const r = rng.choisir(autres);
      cands.push({
        type: 'substitution',
        i,
        j: i,
        resultat: base.slice(0, i) + r + base.slice(i + 1),
        description: `la lettre ${i + 1} change : ${base[i]} devient ${r}`,
      });
    }
    cands.push({
      type: 'doublement',
      i,
      j: i,
      resultat: base.slice(0, i + 1) + base[i] + base.slice(i + 1),
      description: `la lettre ${i + 1} (${base[i]}) est doublée`,
    });
    cands.push({
      type: 'omission',
      i,
      j: i,
      resultat: base.slice(0, i) + base.slice(i + 1),
      description: `la lettre ${i + 1} (${base[i]}) a disparu`,
    });
  }

  // Préférence de position selon la difficulté (repli : toutes les positions).
  let retenus = cands;
  if (diff === 1) retenus = cands.filter((c) => estBord(c.i, c.j, n));
  else if (diff === 3) retenus = cands.filter((c) => estMilieu(c.i, c.j, n));
  if (retenus.length === 0) retenus = cands;

  // Choix du type pondéré, parmi les types réellement disponibles.
  const types = [...new Set(retenus.map((c) => c.type))];
  const total = types.reduce((s, t) => s + POIDS[diff][t], 0);
  let tirage = rng.suivant() * total;
  let type = types[types.length - 1];
  for (const t of types) {
    tirage -= POIDS[diff][t];
    if (tirage < 0) {
      type = t;
      break;
    }
  }
  const choisi = rng.choisir(retenus.filter((c) => c.type === type));

  if (choisi.resultat === base) throw new Error('perturber() a recréé la chaîne d’origine');
  return { resultat: choisi.resultat, type: choisi.type, description: choisi.description };
}

function genererAttention(ref: ItemRef): Item {
  if (ref.version !== VERSION_ATTENTION) {
    throw new Error(`Version de générateur non supportée : attention v${ref.version}`);
  }
  const rng = creerPrng(ref.seed);
  const base = genererChaine(rng, longueurChaine(rng, ref.difficulte), ref.difficulte);
  const identique = rng.chance(0.5);

  let b = base;
  const explication = `Compare toujours lettre par lettre, de gauche à droite, sans te fier à l'allure générale : l'œil « complète » facilement une suite qui ressemble à l'autre.`;
  let pourquoi = [
    `Juste : les deux suites sont exactement les mêmes (${base}). Lettre par lettre, aucune ne change de place ni de forme.`,
    `Faux : aucune différence n'existe, ${base} se retrouve à l'identique dans la seconde suite. Ne cherche pas un défaut qui n'est pas là.`,
  ];
  if (!identique) {
    const p = perturber(base, rng, ref.difficulte);
    b = p.resultat;
    // Dans l'ordre des options : « Identiques » (fausse), puis « Différentes » (juste).
    pourquoi = [
      `Faux : dans la seconde suite, ${p.description}. (${base} / ${b}) Les suites se ressemblent, mais elles ne sont pas identiques.`,
      `Juste : dans la seconde suite, ${p.description}. (${base} / ${b})`,
    ];
  }

  return {
    id: `attention-v${ref.version}-d${ref.difficulte}-s${ref.seed}`,
    ref,
    consigne: 'Les deux suites de lettres sont-elles identiques ?',
    stimulus: { type: 'attention', a: base, b },
    options: ['Identiques', 'Différentes'],
    bonneReponse: identique ? 0 : 1,
    explication,
    pourquoi,
  };
}

export const generateurAttention: Generateur = {
  version: VERSION_ATTENTION,
  generer: genererAttention,
  construireRefs({ graineBase, nb, difficulte }) {
    return Array.from({ length: nb }, (_, i) => ({
      epreuve: 'attention' as const,
      version: VERSION_ATTENTION,
      seed: melangerGraines(graineBase, i),
      difficulte,
    }));
  },
};
