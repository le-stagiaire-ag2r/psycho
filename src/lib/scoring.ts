import type { Objectif } from '../config/niveaux';
import type { Item, ItemRef } from './types';

export interface Bilan {
  nbItems: number;
  nbRepondues: number;
  nbCorrectes: number;
  nbErreurs: number;
  nbNonRepondues: number;
  /** Bonnes réponses / réponses données (0 à 1) */
  precision: number;
  /** Réponses données par minute */
  vitesse: number;
  /** Bonnes réponses par minute */
  vitesseCorrectes: number;
  /** Bonnes réponses moins la pénalité éventuelle (jamais négatif) */
  score: number;
  /** Précision sur la première moitié des réponses (null si trop peu de réponses) */
  precisionDebut: number | null;
  /** Précision sur la seconde moitié des réponses */
  precisionFin: number | null;
  /** Références des questions ratées, pour les refaire via leur graine */
  erreurs: ItemRef[];
}

const MIN_REPONSES_TENDANCE = 6;

function taux(ok: boolean[]): number {
  return ok.length === 0 ? 0 : ok.filter(Boolean).length / ok.length;
}

export function calculerBilan(
  items: Item[],
  reponses: (number | null)[],
  ordre: number[],
  dureeMs: number,
  penaliteErreur = 0,
): Bilan {
  const nbRepondues = ordre.length;
  const justesParOrdre = ordre.map((i) => reponses[i] === items[i].bonneReponse);
  const nbCorrectes = justesParOrdre.filter(Boolean).length;
  const nbErreurs = nbRepondues - nbCorrectes;
  const minutes = dureeMs / 60000;

  let precisionDebut: number | null = null;
  let precisionFin: number | null = null;
  if (nbRepondues >= MIN_REPONSES_TENDANCE) {
    const milieu = Math.floor(nbRepondues / 2);
    precisionDebut = taux(justesParOrdre.slice(0, milieu));
    precisionFin = taux(justesParOrdre.slice(milieu));
  }

  return {
    nbItems: items.length,
    nbRepondues,
    nbCorrectes,
    nbErreurs,
    nbNonRepondues: items.length - nbRepondues,
    precision: nbRepondues === 0 ? 0 : nbCorrectes / nbRepondues,
    vitesse: minutes > 0 ? nbRepondues / minutes : 0,
    vitesseCorrectes: minutes > 0 ? nbCorrectes / minutes : 0,
    score: Math.max(0, nbCorrectes - penaliteErreur * nbErreurs),
    precisionDebut,
    precisionFin,
    erreurs: ordre.filter((i) => reponses[i] !== items[i].bonneReponse).map((i) => items[i].ref),
  };
}

export interface ComparaisonObjectif {
  precisionOk: boolean;
  vitesseOk: boolean;
}

export function comparerObjectif(
  b: Pick<Bilan, 'precision' | 'vitesseCorrectes'>,
  objectif: Objectif,
): ComparaisonObjectif {
  return {
    precisionOk: b.precision >= objectif.precisionMin,
    vitesseOk: b.vitesseCorrectes >= objectif.correctesParMinute,
  };
}
