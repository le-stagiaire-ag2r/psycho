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

/**
 * Repère E1 / E2 / E3 (meilleur → moins bon), INDICATIF et non officiel.
 * La vraie notation n'est pas publiée : l'armée classe les candidats entre eux (E1 = tous les postes
 * ouverts, E3 = beaucoup de portes fermées). Ici : E1 si l'objectif est atteint en précision ET en vitesse,
 * E3 si l'on est très loin de l'objectif (précision sous 80 % de la cible ou vitesse sous la moitié), E2 sinon.
 */
export type RepereE = 'E1' | 'E2' | 'E3';

export function repereIndicatif(b: Pick<Bilan, 'precision' | 'vitesseCorrectes'>, objectif: Objectif): RepereE {
  const p = b.precision / objectif.precisionMin;
  const v = b.vitesseCorrectes / objectif.correctesParMinute;
  if (p >= 1 && v >= 1) return 'E1';
  if (p < 0.8 || v < 0.5) return 'E3';
  return 'E2';
}

/** Repère global : E3 si au moins un tiers des épreuves sont E3, E1 si au moins les deux tiers sont E1 et aucune E3, sinon E2. */
export function repereGlobal(reperes: RepereE[]): RepereE | null {
  if (reperes.length === 0) return null;
  const n = reperes.length;
  const e1 = reperes.filter((r) => r === 'E1').length;
  const e3 = reperes.filter((r) => r === 'E3').length;
  if (e3 * 3 >= n) return 'E3';
  if (e3 === 0 && e1 * 3 >= n * 2) return 'E1';
  return 'E2';
}
