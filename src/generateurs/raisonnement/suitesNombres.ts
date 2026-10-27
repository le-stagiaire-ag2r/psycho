import type { Prng } from '../../lib/prng';
import { add, egal, mul, q, sub, div, type Q } from '../../lib/rationnel';
import type { Difficulte } from '../../lib/types';

/**
 * Suites de nombres : « 2 - 4 - 8 - 16 - ? ».
 *
 * Solveur d'unicité : on ne sait pas lister « toutes les suites possibles », mais on sait
 * INFÉRER, à partir des termes affichés, toutes les règles d'une grammaire connue qui les
 * expliquent (différences finies d'ordre 1 à 3, relation affine u(n+1) = m·u(n) + c,
 * type Fibonacci, deux suites entrelacées). Si ces règles ne prédisent pas toutes le même terme
 * suivant, la suite est ambiguë et l'item est rejeté.
 */
export interface Prediction {
  regle: string;
  prochain: Q;
}

const zero = q(0);

/** Toutes les règles de la grammaire compatibles avec les termes donnés, et ce qu'elles prédisent. */
export function predictionsSuiteNombres(termes: readonly number[]): Prediction[] {
  const T = termes.map((x) => q(x));
  const n = T.length;
  const res: Prediction[] = [];

  // Différences finies d'ordre k (1 = arithmétique, 2 = écarts qui évoluent régulièrement, 3 = cubes).
  const niveaux: Q[][] = [T];
  for (let k = 1; k <= 3; k++) {
    const prec = niveaux[k - 1];
    if (prec.length < 2) break;
    niveaux.push(prec.slice(1).map((x, i) => sub(x, prec[i])));
  }
  for (let k = 1; k < niveaux.length; k++) {
    const niv = niveaux[k];
    // Il faut au moins 2 valeurs égales pour que la régularité soit « confirmée ».
    if (niv.length >= 2 && niv.every((v) => egal(v, niv[0]))) {
      let suivant = niv[0];
      for (let j = k - 1; j >= 0; j--) suivant = add(niveaux[j][niveaux[j].length - 1], suivant);
      res.push({ regle: `ecarts-ordre-${k}`, prochain: suivant });
    }
  }

  // Relation affine u(n+1) = m·u(n) + c (contient les suites géométriques quand c = 0).
  if (n >= 3 && !egal(sub(T[1], T[0]), zero)) {
    const m = div(sub(T[2], T[1]), sub(T[1], T[0]));
    const c = sub(T[1], mul(m, T[0]));
    let ok = true;
    for (let k = 0; k + 1 < n; k++) if (!egal(T[k + 1], add(mul(m, T[k]), c))) ok = false;
    if (ok) res.push({ regle: 'affine', prochain: add(mul(m, T[n - 1]), c) });
  }

  // Type Fibonacci : chaque terme est la somme des deux précédents.
  if (n >= 4) {
    let ok = true;
    for (let k = 0; k + 2 < n; k++) if (!egal(T[k + 2], add(T[k], T[k + 1]))) ok = false;
    if (ok) res.push({ regle: 'fibonacci', prochain: add(T[n - 2], T[n - 1]) });
  }

  // Deux suites arithmétiques entrelacées (rangs pairs et impairs).
  if (n >= 5) {
    const pairs = T.filter((_, i) => i % 2 === 0);
    const impairs = T.filter((_, i) => i % 2 === 1);
    const raison = (s: Q[]) => sub(s[1], s[0]);
    const arith = (s: Q[]) => s.every((v, i) => i === 0 || egal(sub(v, s[i - 1]), raison(s)));
    if (pairs.length >= 3 && impairs.length >= 2 && arith(pairs) && arith(impairs)) {
      const prochain =
        n % 2 === 0 ? add(pairs[pairs.length - 1], raison(pairs)) : add(impairs[impairs.length - 1], raison(impairs));
      res.push({ regle: 'entrelacees', prochain });
    }
  }
  return res;
}

// ---------- Génération ----------

export type FamilleNombres =
  | 'arithmetique'
  | 'geometrique'
  | 'carres'
  | 'triangulaires'
  | 'ecarts'
  | 'affine'
  | 'fibonacci'
  | 'entrelacees'
  | 'cubes';

export interface SuiteNombres {
  famille: FamilleNombres;
  /** Termes affichés */
  termes: number[];
  /** Terme à trouver */
  suivant: number;
  explication: string;
}

const NB_AFFICHES: Record<FamilleNombres, number> = {
  arithmetique: 4,
  geometrique: 4,
  carres: 4,
  triangulaires: 5,
  ecarts: 5,
  affine: 5,
  fibonacci: 6,
  entrelacees: 6,
  cubes: 4,
};

const FAMILLES: Record<Difficulte, FamilleNombres[]> = {
  1: ['arithmetique', 'geometrique', 'carres', 'ecarts'],
  2: ['arithmetique', 'geometrique', 'carres', 'ecarts', 'triangulaires', 'affine', 'fibonacci'],
  3: ['ecarts', 'triangulaires', 'affine', 'fibonacci', 'entrelacees', 'cubes', 'carres'],
};

/** Termes 0..n (le dernier est la réponse) pour une famille et des paramètres tirés au sort. */
function construire(famille: FamilleNombres, rng: Prng, diff: Difficulte): { termes: number[]; explication: (suivant: number) => string } {
  const total = NB_AFFICHES[famille] + 1;
  const ligne = (f: (i: number) => number) => Array.from({ length: total }, (_, i) => f(i));
  switch (famille) {
    case 'arithmetique': {
      const a = rng.entier(1, 30);
      const d = rng.entier(2, 9) * (rng.chance(0.25) ? -1 : 1);
      const base = d < 0 ? a + 5 * Math.abs(d) : a;
      return { termes: ligne((i) => base + i * d), explication: (s) => `Chaque terme ${d > 0 ? `augmente de ${d}` : `diminue de ${-d}`} : le suivant est ${s}.` };
    }
    case 'geometrique': {
      const a = rng.entier(1, 5);
      const r = rng.choisir([2, 3]);
      return { termes: ligne((i) => a * r ** i), explication: (s) => `Chaque terme est le précédent multiplié par ${r} : le suivant est ${s}.` };
    }
    case 'carres': {
      const k0 = rng.entier(1, diff === 3 ? 9 : 6);
      return { termes: ligne((i) => (k0 + i) ** 2), explication: (s) => `Ce sont des carrés parfaits consécutifs (${k0}², ${k0 + 1}², ${k0 + 2}²…) : le suivant est ${Math.sqrt(s)}² = ${s}.` };
    }
    case 'triangulaires': {
      const k0 = rng.entier(1, 6);
      const t = (k: number) => (k * (k + 1)) / 2;
      return { termes: ligne((i) => t(k0 + i)), explication: (s) => `Les écarts valent ${k0 + 1}, ${k0 + 2}, ${k0 + 3}… (nombres triangulaires) : le suivant est ${s}.` };
    }
    case 'ecarts': {
      const e = diff === 3 ? rng.choisir([1, 2, 3]) : 1;
      const d0 = rng.entier(1, 4);
      const a = rng.entier(1, 12);
      const termes = [a];
      for (let k = 0; k < total - 1; k++) termes.push(termes[k] + d0 + k * e);
      const listeEcarts = termes.slice(1, -1).map((x, i) => x - termes[i]);
      return {
        termes,
        explication: (s) =>
          `Les écarts augmentent de ${e} à chaque fois (+${listeEcarts.join(', +')}…) : le prochain écart est +${s - termes[termes.length - 2]}, donc ${s}.`,
      };
    }
    case 'affine': {
      const m = rng.choisir([2, 3]);
      const c = rng.choisir([1, 2, 3, -1]);
      const a = rng.entier(1, 4);
      const termes = [a];
      for (let k = 0; k < total - 1; k++) termes.push(m * termes[k] + c);
      return {
        termes,
        explication: (s) => `Chaque terme vaut le précédent × ${m} ${c < 0 ? '−' : '+'} ${Math.abs(c)} : le suivant est ${s}.`,
      };
    }
    case 'fibonacci': {
      const a = rng.entier(1, 4);
      const b = rng.entier(1, 5);
      const termes = [a, b];
      for (let k = 2; k < total; k++) termes.push(termes[k - 1] + termes[k - 2]);
      return { termes, explication: (s) => `Chaque terme est la somme des deux précédents : ${termes[termes.length - 3]} + ${termes[termes.length - 2]} = ${s}.` };
    }
    case 'entrelacees': {
      const a = rng.entier(1, 9);
      const d = rng.entier(1, 3);
      const b = rng.entier(10, 30);
      const e = rng.choisir([3, 5, 10]);
      return {
        termes: ligne((i) => (i % 2 === 0 ? a + (i / 2) * d : b + ((i - 1) / 2) * e)),
        explication: (s) => `Deux suites s'entrelacent : les rangs impairs progressent de ${d}, les rangs pairs de ${e}. Le suivant est ${s}.`,
      };
    }
    case 'cubes': {
      const k0 = rng.entier(1, 3);
      return { termes: ligne((i) => (k0 + i) ** 3), explication: (s) => `Ce sont des cubes consécutifs (${k0}³, ${k0 + 1}³…) : le suivant est ${Math.round(Math.cbrt(s))}³ = ${s}.` };
    }
  }
}

/** Tire une suite dont le terme suivant est unique d'après le solveur (null si rien de valable). */
export function genererSuiteNombres(rng: Prng, diff: Difficulte): SuiteNombres {
  for (let essai = 0; essai < 500; essai++) {
    const famille = rng.choisir(FAMILLES[diff]);
    const { termes, explication } = construire(famille, rng, diff);
    if (termes.some((t) => t < 0 || t > 5000)) continue;
    const affiches = termes.slice(0, -1);
    const suivant = termes[termes.length - 1];
    if (new Set(affiches).size < affiches.length - 1) continue; // trop de termes répétés
    const preds = predictionsSuiteNombres(affiches);
    if (preds.length === 0) continue;
    const prochains = new Set(preds.map((p) => `${p.prochain.n}/${p.prochain.d}`));
    if (prochains.size !== 1 || !egal(preds[0].prochain, q(suivant))) continue;
    return { famille, termes: affiches, suivant, explication: explication(suivant) };
  }
  throw new Error('Aucune suite de nombres non ambiguë trouvée');
}
