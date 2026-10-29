import type { ChronoPref } from './types';

/**
 * Les durées par épreuve (config/epreuves.ts) ne sont pas officielles : elles viennent de témoignages
 * de candidats et de sites de préparation. Chacun peut donc les rallonger ou les supprimer.
 */
export const CHRONOS: { id: ChronoPref; libelle: string; facteur: number }[] = [
  { id: 'indicatif', libelle: 'Durées indicatives', facteur: 1 },
  { id: 'souple', libelle: 'Plus souple (+50 %)', facteur: 1.5 },
  { id: 'libre', libelle: 'Sans limite de temps', facteur: Infinity },
];

export const AVERTISSEMENT_DUREES =
  'Les durées ne sont pas officielles : elles viennent de témoignages de candidats et peuvent différer du vrai test.';

/** Durée effective d'une épreuve en secondes (Infinity = sans limite). */
export function dureeEffectiveSecondes(dureeSecondes: number, chrono: ChronoPref): number {
  const facteur = CHRONOS.find((c) => c.id === chrono)?.facteur ?? 1;
  return facteur === Infinity ? Infinity : Math.round(dureeSecondes * facteur);
}
