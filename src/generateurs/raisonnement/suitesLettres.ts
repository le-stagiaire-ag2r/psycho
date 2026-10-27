import type { Prng } from '../../lib/prng';
import type { Difficulte } from '../../lib/types';

/**
 * Suites de lettres : « A - C - F - J - O - ? » (écarts +2, +3, +4, +5, donc +6 → U).
 * Même principe que les suites de nombres : le solveur infère les règles compatibles
 * avec les lettres affichées et rejette la suite si elles ne prédisent pas la même lettre.
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const mod = (x: number) => ((x % 26) + 26) % 26;

export interface PredictionLettre {
  regle: string;
  prochain: number;
}

/** Règles compatibles avec la suite (indices 0..25) et lettre qu'elles prédisent. */
export function predictionsSuiteLettres(lettres: readonly number[]): PredictionLettre[] {
  const n = lettres.length;
  const D = lettres.slice(1).map((x, i) => mod(x - lettres[i]));
  const res: PredictionLettre[] = [];
  const dernier = lettres[n - 1];

  // Écart constant.
  if (D.length >= 2 && D.every((d) => d === D[0])) res.push({ regle: 'constant', prochain: mod(dernier + D[0]) });

  // Écarts qui augmentent (ou diminuent) régulièrement : +2, +3, +4…
  if (D.length >= 3) {
    const E = D.slice(1).map((x, i) => mod(x - D[i]));
    if (E.every((e) => e === E[0]) && E[0] !== 0) res.push({ regle: 'croissant', prochain: mod(dernier + D[D.length - 1] + E[0]) });
  }

  // Écarts alternés : +1, +3, +1, +3…
  if (D.length >= 4 && D.every((d, i) => d === D[i % 2])) res.push({ regle: 'alterne', prochain: mod(dernier + D[D.length % 2]) });

  return res;
}

export interface SuiteLettres {
  /** Lettres affichées */
  lettres: string[];
  suivante: string;
  explication: string;
}

type Famille = 'constant' | 'croissant' | 'alterne';
const FAMILLES: Record<Difficulte, Famille[]> = {
  1: ['constant', 'constant', 'croissant'],
  2: ['constant', 'croissant', 'alterne'],
  3: ['croissant', 'alterne'],
};

const nom = (i: number) => ALPHABET[mod(i)];

export function genererSuiteLettres(rng: Prng, diff: Difficulte): SuiteLettres {
  for (let essai = 0; essai < 500; essai++) {
    const famille = rng.choisir(FAMILLES[diff]);
    const depart = rng.entier(0, 25);
    let ecarts: number[];
    let explication: string;
    let nbAffichees = 5;
    if (famille === 'constant') {
      const s = rng.entier(1, 5) * (rng.chance(0.25) ? -1 : 1);
      nbAffichees = diff === 1 ? 4 : 5;
      ecarts = Array.from({ length: nbAffichees }, () => s);
      explication = `Chaque lettre ${s > 0 ? 'avance' : 'recule'} de ${Math.abs(s)} rang${Math.abs(s) > 1 ? 's' : ''} dans l'alphabet.`;
    } else if (famille === 'croissant') {
      const d0 = rng.entier(1, 3);
      ecarts = Array.from({ length: 5 }, (_, i) => d0 + i);
      explication = `Les écarts augmentent de 1 à chaque fois (+${ecarts.slice(0, 4).join(', +')}…).`;
    } else {
      const a = rng.entier(1, 3);
      const b = rng.entier(a + 1, a + 3);
      nbAffichees = 6;
      ecarts = Array.from({ length: 6 }, (_, i) => (i % 2 === 0 ? a : b));
      explication = `Les écarts alternent : +${a}, +${b}, +${a}, +${b}…`;
    }
    // Indices cumulés sans modulo, pour détecter un passage de Z à A.
    const brutes = [depart];
    for (const e of ecarts) brutes.push(brutes[brutes.length - 1] + e);
    const passeParZ = brutes.some((x) => x < 0 || x > 25);
    if (passeParZ && diff < 3) continue;
    const affichees = brutes.slice(0, nbAffichees).map(mod);
    const suivante = mod(brutes[nbAffichees]);
    if (new Set(affichees).size < affichees.length - 1) continue;

    const preds = predictionsSuiteLettres(affichees);
    if (preds.length === 0 || new Set(preds.map((p) => p.prochain)).size !== 1 || preds[0].prochain !== suivante) continue;
    return {
      lettres: affichees.map(nom),
      suivante: nom(suivante),
      explication: `${explication}${passeParZ ? ' Après Z, on revient à A.' : ''} Le suivant est ${nom(suivante)}.`,
    };
  }
  throw new Error('Aucune suite de lettres non ambiguë trouvée');
}

/** Lettres voisines de la bonne réponse, utilisées comme distracteurs. */
export function lettresVoisines(suivante: string): string[] {
  const i = ALPHABET.indexOf(suivante);
  return [1, -1, 2, -2, 3, -3].map((d) => nom(i + d));
}
