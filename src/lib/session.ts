import type { Item } from './types';

/**
 * Moteur de passation : fonctions pures (le temps `now` est passé en paramètre),
 * donc faciles à tester. L'interface ne fait qu'afficher cet état.
 *
 * File d'attente : `file[0]` est la question affichée. Une question passée repart
 * en fin de file et revient plus tard.
 */
export interface EtatSeance {
  items: Item[];
  /** Choix de l'utilisateur par item (null = pas encore répondu) */
  reponses: (number | null)[];
  /** Temps cumulé passé sur chaque item, en ms (hors lecture de la correction) */
  temps: number[];
  /** Indices des items dans l'ordre où ils ont été répondus */
  ordre: number[];
  file: number[];
  debutMs: number;
  dernierMs: number;
  finMs: number | null;
  passes: number;
  fini: boolean;
}

export function demarrer(items: Item[], now: number): EtatSeance {
  return {
    items,
    reponses: items.map(() => null),
    temps: items.map(() => 0),
    ordre: [],
    file: items.map((_, i) => i),
    debutMs: now,
    dernierMs: now,
    finMs: null,
    passes: 0,
    fini: items.length === 0,
  };
}

export function indexCourant(s: EtatSeance): number | null {
  return s.fini ? null : (s.file[0] ?? null);
}

function ajouterTemps(s: EtatSeance, i: number, now: number): number[] {
  const temps = [...s.temps];
  temps[i] += Math.max(0, now - s.dernierMs);
  return temps;
}

/** Enregistre la réponse à la question courante (sans changer de question). */
export function enregistrerReponse(s: EtatSeance, choix: number, now: number): EtatSeance {
  const i = indexCourant(s);
  if (i === null || s.reponses[i] !== null) return s;
  const reponses = [...s.reponses];
  reponses[i] = choix;
  return { ...s, reponses, temps: ajouterTemps(s, i, now), ordre: [...s.ordre, i], dernierMs: now };
}

/** Passe à la question suivante ; termine la séance s'il n'en reste plus. */
export function avancer(s: EtatSeance, now: number): EtatSeance {
  const i = indexCourant(s);
  if (i === null) return s;
  if (s.reponses[i] === null) return s;
  const file = s.file.slice(1);
  const fini = file.length === 0;
  return { ...s, file, dernierMs: now, fini, finMs: fini ? now : null };
}

/** Passe la question courante : elle revient en fin de file. Sans effet s'il n'y a qu'une question restante. */
export function passer(s: EtatSeance, now: number): EtatSeance {
  const i = indexCourant(s);
  if (i === null || s.file.length <= 1 || s.reponses[i] !== null) return s;
  return {
    ...s,
    temps: ajouterTemps(s, i, now),
    file: [...s.file.slice(1), i],
    passes: s.passes + 1,
    dernierMs: now,
  };
}

/** Termine la séance (fin du chrono ou abandon). */
export function terminer(s: EtatSeance, now: number): EtatSeance {
  if (s.fini) return s;
  const i = indexCourant(s);
  const temps = i !== null && s.reponses[i] === null ? ajouterTemps(s, i, now) : s.temps;
  return { ...s, temps, fini: true, finMs: now, dernierMs: now };
}
