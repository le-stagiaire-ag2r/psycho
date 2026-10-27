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

/**
 * Objectifs indicatifs par épreuve et par niveau visé.
 * Valeurs de départ choisies arbitrairement (voir TODO-FORMATS.md) ; seule exception : l'anglais,
 * où un témoignage évoque ~50 bonnes réponses pour valider et ~100 conseillées aux officiers.
 */
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
  logique: {
    'militaire-du-rang': { precisionMin: 0.65, correctesParMinute: 1.0 },
    'sous-officier': { precisionMin: 0.75, correctesParMinute: 1.2 },
    officier: { precisionMin: 0.85, correctesParMinute: 1.5 },
  },
  spatial: {
    'militaire-du-rang': { precisionMin: 0.65, correctesParMinute: 1.5 },
    'sous-officier': { precisionMin: 0.75, correctesParMinute: 2.0 },
    officier: { precisionMin: 0.85, correctesParMinute: 2.5 },
  },
  verbal: {
    'militaire-du-rang': { precisionMin: 0.65, correctesParMinute: 2.0 },
    'sous-officier': { precisionMin: 0.75, correctesParMinute: 2.5 },
    officier: { precisionMin: 0.85, correctesParMinute: 3.0 },
  },
  numerique: {
    'militaire-du-rang': { precisionMin: 0.6, correctesParMinute: 0.6 },
    'sous-officier': { precisionMin: 0.7, correctesParMinute: 0.8 },
    officier: { precisionMin: 0.8, correctesParMinute: 1.0 },
  },
  anglais: {
    'militaire-du-rang': { precisionMin: 0.55, correctesParMinute: 0.9 },
    'sous-officier': { precisionMin: 0.65, correctesParMinute: 1.3 },
    officier: { precisionMin: 0.75, correctesParMinute: 1.8 },
  },
};

export function libelleNiveau(id: NiveauId): string {
  return NIVEAUX.find((n) => n.id === id)?.libelle ?? id;
}
