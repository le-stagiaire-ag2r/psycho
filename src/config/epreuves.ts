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
  /** Mise en garde affichée avant de commencer (statut de la banque, limites…) */
  avertissement?: string;
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
    nbChoix: 4,
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
  raisonnement: {
    id: 'raisonnement',
    titre: 'Raisonnement général (complémentaire)',
    description: 'Suites de nombres, de lettres et de mots, logique de comparaison.',
    disponible: true,
    nbQuestions: 20,
    dureeSecondes: 480,
    nbChoix: 4,
    nbQuestionsEntrainement: 15,
    passerAutorise: true,
    penaliteErreur: 0,
    difficulteExamen: 2,
    // Familles tirées en alternance : suite-nombres, suite-lettres, suite-mots, transitive
    parametres: { familles: 'suite-nombres,suite-lettres,suite-mots,transitive' },
    conseils: [
      'Suites de nombres : calcule les écarts entre termes ; si les écarts changent, regarde les écarts des écarts ; pense aussi aux carrés, aux produits et aux sommes des deux termes précédents.',
      'Suites de lettres : convertis les lettres en rangs (A = 1, B = 2…) et traite-les comme des nombres ; après Z, on revient à A.',
      'Logique de comparaison : écris les relations sous forme de chaîne (Pierre > Paul > Jean) en remettant toutes les phrases dans le même sens.',
      'Si tu bloques plus de quelques secondes, passe (touche P) et reviens-y.',
    ],
    avertissement:
      'Épreuve complémentaire : ces types de questions sont inspirés d’exemples trouvés en ligne et de témoignages, mais leur présence exacte dans le test réel n’est pas confirmée. Elle est proposée en option dans l’examen blanc.',
  },
  logique: {
    id: 'logique',
    titre: 'Raisonnement logique',
    description: 'Suites de cubes à symboles : quel cube suit la même logique ?',
    disponible: true,
    nbQuestions: 25,
    dureeSecondes: 840,
    nbChoix: 4,
    nbQuestionsEntrainement: 10,
    passerAutorise: true,
    penaliteErreur: 0,
    difficulteExamen: 2,
    parametres: {},
    conseils: [
      'Compare deux cubes consécutifs face par face (dessus, devant, droite) : qu’est-ce qui change exactement ?',
      'Une règle peut combiner deux changements (un symbole qui pivote ET deux symboles qui s’échangent) : vérifie chacun séparément.',
      'Vérifie ta règle sur toute la suite avant de choisir : elle doit expliquer chaque passage, pas seulement le premier.',
    ],
  },
  spatial: {
    id: 'spatial',
    titre: 'Raisonnement spatial',
    description: 'Quadrillages tournés, cubes à plier et cubes retournés.',
    disponible: true,
    nbQuestions: 25,
    dureeSecondes: 420,
    nbChoix: 4,
    nbQuestionsEntrainement: 10,
    passerAutorise: true,
    penaliteErreur: 0,
    difficulteExamen: 2,
    parametres: {
      // Variantes tirées en alternance (séparées par des virgules) : 'grille', 'patron', 'vues'.
      // Ordre et répartition à valider auprès de candidats (voir TODO-FORMATS.md).
      variantes: 'grille,vues,grille,patron',
      // 'horaire', 'antihoraire' ou 'mixte' (le sens est alors précisé dans chaque consigne)
      sensRotation: 'mixte',
    },
    conseils: [
      'Choisis une case repère (un coin, une case noire isolée) et suis-la pendant la rotation.',
      'Un quart de tour horaire : la première ligne devient la dernière colonne. Un demi-tour : tout est lu à l’envers.',
      'Méfie-toi des miroirs : ils ressemblent à une rotation mais inversent la gauche et la droite.',
    ],
  },
  verbal: {
    id: 'verbal',
    titre: 'Aptitude verbale',
    description: 'Synonymes, contraires, intrus, vocabulaire, proverbes, orthographe, analogies.',
    disponible: true,
    nbQuestions: 31,
    dureeSecondes: 480,
    nbChoix: 4,
    nbQuestionsEntrainement: 15,
    passerAutorise: true,
    penaliteErreur: 0,
    difficulteExamen: 2,
    // seulementRelus: 1 = ne proposer que les items relus par un humain (champ « relecture » du JSON)
    parametres: { seulementRelus: 0 },
    conseils: [
      'Écarte d’abord les propositions que tu sais fausses : la bonne réponse apparaît souvent par élimination.',
      'Pour un intrus, cherche la catégorie commune aux autres mots avant de regarder le mot isolé.',
      'Si deux réponses te semblent possibles, choisis celle dont le sens est le plus courant, puis passe à la suite.',
    ],
    avertissement:
      'Banque de questions rédigées pour ce projet, pas encore relues par un humain : si une question te paraît ambiguë ou fausse, signale-la sur le forum en citant sa référence (affichée sous la question).',
  },
  numerique: {
    id: 'numerique',
    titre: 'Aptitude numérique',
    description: 'Calcul niveau 3e : pourcentages, fractions, vitesse, poules et lapins.',
    disponible: true,
    nbQuestions: 25,
    dureeSecondes: 1080,
    nbChoix: 4,
    nbQuestionsEntrainement: 10,
    passerAutorise: true,
    penaliteErreur: 0,
    difficulteExamen: 2,
    parametres: {},
    conseils: [
      'Estime d’abord l’ordre de grandeur : cela élimine souvent deux ou trois propositions.',
      'Les mauvaises réponses sont des erreurs classiques (base 100 au lieu de 60, pourcentages qui « s’annulent »…) : relis l’énoncé.',
      'Il est quasiment impossible de tout finir : passe les problèmes longs et reviens-y à la fin (touche P).',
    ],
  },
  anglais: {
    id: 'anglais',
    titre: 'Anglais',
    description: 'QCM de grammaire et de vocabulaire, niveau collège-lycée.',
    disponible: true,
    nbQuestions: 100,
    dureeSecondes: 3300,
    nbChoix: 4,
    nbQuestionsEntrainement: 20,
    passerAutorise: true,
    penaliteErreur: 0,
    difficulteExamen: 2,
    parametres: { seulementRelus: 0 },
    conseils: [
      'Cherche le marqueur de temps (yesterday, since, already, every day…) : il impose presque toujours la bonne forme.',
      'Lis la phrase entière avant de choisir : la fin de la phrase donne souvent la structure attendue.',
      'La banque actuelle compte environ 160 questions : au-delà, certaines reviennent.',
    ],
    avertissement:
      'Banque de questions rédigées pour ce projet, pas encore relues par un humain : si une question te paraît ambiguë ou fausse, signale-la sur le forum en citant sa référence (affichée sous la question).',
  },
  personnalite: {
    id: 'personnalite',
    titre: 'Personnalité (mode découverte)',
    description: 'Questionnaire de type Big Five, sans score ni bonne réponse.',
    disponible: true,
    nbQuestions: 250,
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
  'raisonnement',
  'anglais',
  'personnalite',
];
