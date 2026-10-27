import type { Prng } from '../../lib/prng';
import type { Difficulte } from '../../lib/types';

/**
 * Suites de mots sur des listes cycliques : « Lundi - Mardi - Mercredi - ? » → Jeudi.
 * Le pas (±1, ±2, ±3…) se déduit des mots affichés ; la liste est circulaire
 * (après Dimanche, on revient à Lundi).
 */
const LISTES: Record<string, string[]> = {
  jours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
  mois: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  saisons: ['Printemps', 'Été', 'Automne', 'Hiver'],
};

const mod = (x: number, n: number) => ((x % n) + n) % n;

/** Pas compatible avec les mots affichés (indices dans la liste), ou null si aucun ne l'est. */
export function pasCompatible(indices: readonly number[], taille: number): number[] {
  const diffs = indices.slice(1).map((x, i) => mod(x - indices[i], taille));
  return diffs.every((d) => d === diffs[0]) ? [diffs[0]] : [];
}

export interface SuiteMots {
  mots: string[];
  suivant: string;
  /** Mots plausibles mais faux, du plus au moins tentant */
  voisins: string[];
  explication: string;
}

export function genererSuiteMots(rng: Prng, diff: Difficulte): SuiteMots {
  for (let essai = 0; essai < 200; essai++) {
    const nomListe = rng.choisir(diff === 1 ? ['jours', 'mois'] : ['jours', 'mois', 'jours', 'mois', 'saisons']);
    const liste = LISTES[nomListe];
    const n = liste.length;
    const pasMax = nomListe === 'saisons' ? 1 : diff === 1 ? 1 : diff === 2 ? 2 : 4;
    const pas = rng.entier(1, pasMax) * (rng.chance(diff === 1 ? 0.2 : 0.35) ? -1 : 1);
    const nbAffiches = diff === 1 ? 3 : 4;
    const depart = rng.entier(0, n - 1);
    const indices = Array.from({ length: nbAffiches + 1 }, (_, i) => mod(depart + i * pas, n));
    const affiches = indices.slice(0, nbAffiches);
    const suivant = indices[nbAffiches];
    if (new Set(affiches).size < affiches.length) continue;
    const pas0 = pasCompatible(affiches, n);
    if (pas0.length !== 1 || mod(affiches[nbAffiches - 1] + pas0[0], n) !== suivant) continue;

    const voisins = [1, -1, 2, -2, 3]
      .map((d) => mod(suivant + d, n))
      .filter((i) => i !== suivant)
      .map((i) => liste[i]);
    return {
      mots: affiches.map((i) => liste[i]),
      suivant: liste[suivant],
      voisins,
      explication: `On ${pas > 0 ? 'avance' : 'recule'} de ${Math.abs(pas)} ${Math.abs(pas) > 1 ? 'rangs' : 'rang'} dans la liste (${nomListe}) ; la liste est circulaire. Le suivant est ${liste[suivant]}.`,
    };
  }
  throw new Error('Aucune suite de mots valide trouvée');
}
