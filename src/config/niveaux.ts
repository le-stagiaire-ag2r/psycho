import type { EpreuveId, NiveauId } from '../lib/types';

export const NIVEAUX: { id: NiveauId; libelle: string }[] = [
  { id: 'militaire-du-rang', libelle: 'Militaire du rang' },
  { id: 'sous-officier', libelle: 'Sous-officier' },
  { id: 'officier', libelle: 'Officier' },
];

export interface Objectif {
  /** Précision minimale visée (0 à 1) sur les questions auxquelles on répond */
  precisionMin: number;
  /** Bonnes réponses par minute visées */
  correctesParMinute: number;
}

export const AVERTISSEMENT_OBJECTIFS =
  "Objectifs indicatifs, NON officiels : ce sont des repères d'entraînement à ajuster avec des retours de candidats, pas des seuils réels.";

/** Objectifs indicatifs par épreuve et par niveau visé (à valider, voir TODO-FORMATS.md). */
export const OBJECTIFS: Partial<Record<EpreuveId, Record<NiveauId, Objectif>>> = {
  attention: {
    'militaire-du-rang': { precisionMin: 0.8, correctesParMinute: 6 },
    'sous-officier': { precisionMin: 0.85, correctesParMinute: 7.5 },
    officier: { precisionMin: 0.9, correctesParMinute: 9 },
  },
  codage: {
    'militaire-du-rang': { precisionMin: 0.8, correctesParMinute: 8 },
    'sous-officier': { precisionMin: 0.85, correctesParMinute: 10 },
    officier: { precisionMin: 0.9, correctesParMinute: 12 },
  },
};

export function libelleNiveau(id: NiveauId): string {
  return NIVEAUX.find((n) => n.id === id)?.libelle ?? id;
}
