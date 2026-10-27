import type { Difficulte, EpreuveId } from '../lib/types';

/**
 * Configuration des épreuves.
 *
 * ⚠️ Les formats (nombre de questions, durée, nombre de choix…) sont INDICATIFS :
 * ils viennent de témoignages de candidats, pas d'une source officielle.
 * Ils sont volontairement paramétrables ici, jamais figés dans le code.
 * Voir TODO-FORMATS.md pour la liste de ce qui reste à valider.
 */
export interface ConfigEpreuve {
  id: EpreuveId;
  titre: string;
  description: string;
  /** false = épreuve annoncée mais pas encore implémentée */
  disponible: boolean;
  /** Nombre de questions en examen blanc */
  nbQuestions: number;
  /** Durée stricte de l'examen blanc, en secondes */
  dureeSecondes: number;
  /** Nombre de propositions par question */
  nbChoix: number;
  /** Nombre de questions en mode entraînement */
  nbQuestionsEntrainement: number;
  passerAutorise: boolean;
  /** Points retirés par mauvaise réponse dans le score (0 = aucune pénalité) */
  penaliteErreur: number;
  difficulteExamen: Difficulte;
  /** Paramètres propres à l'épreuve (voir chaque générateur) */
  parametres: Record<string, string | number>;
  /** Conseils courts affichés avant de commencer */
  conseils: string[];
}

const CONSEIL_VITESSE =
  "Il est souvent impossible de tout finir : mieux vaut moins de questions mais justes que tout bâcler. Si tu bloques, passe.";

export const EPREUVES: Record<EpreuveId, ConfigEpreuve> = {
  attention: {
    id: 'attention',
    titre: 'Attention / concentration',
    description: 'Deux suites de lettres : sont-elles identiques ?',
    disponible: true,
    nbQuestions: 45,
    dureeSecondes: 210,
    nbChoix: 2,
    nbQuestionsEntrainement: 20,
    passerAutorise: false,
    penaliteErreur: 0,
    difficulteExamen: 2,
    parametres: {},
    conseils: [
      'Compare lettre par lettre, de gauche à droite, sans te fier à l’allure générale.',
      'Les pièges classiques : deux lettres inversées, une lettre proche (O/Q, E/F, M/N, P/R, I/L), une lettre doublée ou oubliée.',
      CONSEIL_VITESSE,
    ],
  },
  codage: {
    id: 'codage',
    titre: 'Codage',
    description: 'Un tableau de mots et de numéros : retrouve la bonne association.',
    disponible: true,
    nbQuestions: 45,
    dureeSecondes: 150,
    nbChoix: 5,
    nbQuestionsEntrainement: 15,
    passerAutorise: false,
    penaliteErreur: 0,
    difficulteExamen: 2,
    parametres: {
      // 'numero-vers-mot' : on donne le numéro, il faut trouver le mot ; 'mot-vers-numero' : l'inverse.
      sens: 'numero-vers-mot',
      tailleTableau: 12,
      // Nombre de questions qui partagent le même tableau avant d'en changer.
      questionsParTableau: 15,
    },
    conseils: [
      'Le tableau reste affiché : repère les mots par leur initiale, ne relis pas tout à chaque fois.',
      'Les mauvaises propositions sont des couples voisins du tableau : vérifie le numéro, pas seulement le mot.',
      CONSEIL_VITESSE,
    ],
  },
  logique: {
    id: 'logique',
    titre: 'Raisonnement logique',
    description: 'Suites de cubes à symboles : quel cube suit la même logique ?',
    disponible: false,
    nbQuestions: 20,
    dureeSecondes: 600,
    nbChoix: 5,
    nbQuestionsEntrainement: 10,
    passerAutorise: true,
    penaliteErreur: 0,
    difficulteExamen: 2,
    parametres: {},
    conseils: [],
  },
  spatial: {
    id: 'spatial',
    titre: 'Raisonnement spatial',
    description: 'Quadrillages tournés et cubes retournés.',
    disponible: false,
    nbQuestions: 25,
    dureeSecondes: 420,
    nbChoix: 5,
    nbQuestionsEntrainement: 10,
    passerAutorise: true,
    penaliteErreur: 0,
    difficulteExamen: 2,
    parametres: {},
    conseils: [],
  },
  verbal: {
    id: 'verbal',
    titre: 'Aptitude verbale',
    description: 'Synonymes, intrus, vocabulaire, proverbes, orthographe.',
    disponible: false,
    nbQuestions: 31,
    dureeSecondes: 480,
    nbChoix: 4,
    nbQuestionsEntrainement: 15,
    passerAutorise: true,
    penaliteErreur: 0,
    difficulteExamen: 2,
    parametres: {},
    conseils: [],
  },
  numerique: {
    id: 'numerique',
    titre: 'Aptitude numérique',
    description: 'Calcul niveau 3e : pourcentages, fractions, vitesse, poules et lapins.',
    disponible: false,
    nbQuestions: 25,
    dureeSecondes: 1080,
    nbChoix: 5,
    nbQuestionsEntrainement: 10,
    passerAutorise: true,
    penaliteErreur: 0,
    difficulteExamen: 2,
    parametres: {},
    conseils: [],
  },
  anglais: {
    id: 'anglais',
    titre: 'Anglais',
    description: 'QCM de grammaire et de vocabulaire, niveau collège-lycée.',
    disponible: false,
    nbQuestions: 100,
    dureeSecondes: 3300,
    nbChoix: 4,
    nbQuestionsEntrainement: 20,
    passerAutorise: true,
    penaliteErreur: 0,
    difficulteExamen: 2,
    parametres: {},
    conseils: [],
  },
  personnalite: {
    id: 'personnalite',
    titre: 'Personnalité (mode découverte)',
    description: 'Questionnaire de type Big Five, sans score ni bonne réponse.',
    disponible: false,
    nbQuestions: 100,
    dureeSecondes: 0,
    nbChoix: 5,
    nbQuestionsEntrainement: 50,
    passerAutorise: true,
    penaliteErreur: 0,
    difficulteExamen: 1,
    parametres: {},
    conseils: [],
  },
};

export const ORDRE_EPREUVES: EpreuveId[] = [
  'logique',
  'spatial',
  'verbal',
  'numerique',
  'codage',
  'attention',
  'anglais',
  'personnalite',
];
