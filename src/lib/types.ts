/** Types partagés. Un item = un générateur + une graine + une difficulté, sérialisable en JSON. */

export type EpreuveId =
  | 'logique'
  | 'spatial'
  | 'verbal'
  | 'numerique'
  | 'codage'
  | 'attention'
  | 'raisonnement'
  | 'anglais'
  | 'personnalite';

export type Mode = 'entrainement' | 'examen';
export type NiveauId = 'militaire-du-rang' | 'sous-officier' | 'officier';
export type Difficulte = 1 | 2 | 3;
export type ThemePref = 'auto' | 'clair' | 'sombre';
/** Réglage du chrono de l'examen blanc : durées indicatives, rallongées de 50 %, ou sans limite */
export type ChronoPref = 'indicatif' | 'souple' | 'libre';

/** Référence sérialisable d'un item : suffit à le régénérer à l'identique. */
export interface ItemRef {
  epreuve: EpreuveId;
  /** Version du générateur : change si l'algorithme change (les graines ne donnent plus la même question). */
  version: number;
  seed: number;
  difficulte: Difficulte;
  params?: Record<string, number | string>;
}

export interface EntreeCodage {
  mot: string;
  numero: number;
}

export interface StimulusAttention {
  type: 'attention';
  a: string;
  b: string;
}

/** Séries de caractères à comparer : une série intruse, ou aucune (version 2 de l'attention). */
export interface StimulusAttentionSeries {
  type: 'attention-series';
  series: string[];
}

export interface StimulusCodage {
  type: 'codage';
  tableau: EntreeCodage[];
  sens: 'numero-vers-mot' | 'mot-vers-numero';
  cible: EntreeCodage;
}

/** Grille noir/blanc : true = case noire. */
export type Grille = boolean[][];

/** Quadrillage tourné : on retrouve la bonne grille parmi les propositions (affichées A, B, C…). */
export interface StimulusGrille {
  type: 'grille';
  modele: Grille;
  propositions: Grille[];
}

/** Énoncé purement textuel (numérique, verbal, anglais). */
export interface StimulusTexte {
  type: 'texte';
  enonce: string;
}

/**
 * Une face de cube telle qu'on la voit : indice du symbole, nombre de quarts de tour horaires
 * par rapport à sa position canonique, et `mir` si le symbole apparaît en miroir.
 */
export interface FaceCube {
  sym: number;
  k: number;
  mir: boolean;
}

/** Les trois faces visibles d'un cube en projection isométrique : [dessus, avant, droite]. */
export type Vue3 = [FaceCube, FaceCube, FaceCube];

/** Patron en croix d'un cube (symboles tels que dessinés sur le papier, sans miroir). */
export interface PatronCube {
  dessus: FaceCube;
  gauche: FaceCube;
  avant: FaceCube;
  droite: FaceCube;
  arriere: FaceCube;
  dessous: FaceCube;
}

/** Cube retourné : le modèle est un patron (à plier) ou deux vues opposées du même cube. */
export interface StimulusCube {
  type: 'cube';
  modele: { forme: 'patron'; patron: PatronCube } | { forme: 'vues'; vues: [Vue3, Vue3] };
  propositions: Vue3[];
}

/** Suite logique de cubes : on affiche les premiers cubes, puis on cherche le suivant. */
export interface StimulusSuiteCubes {
  type: 'suite-cubes';
  suite: Vue3[];
  propositions: Vue3[];
}

export type Stimulus =
  | StimulusAttention
  | StimulusAttentionSeries
  | StimulusCodage
  | StimulusGrille
  | StimulusTexte
  | StimulusCube
  | StimulusSuiteCubes;

/** Question prête à afficher (QCM : une seule bonne réponse). */
export interface Item {
  id: string;
  ref: ItemRef;
  consigne: string;
  stimulus: Stimulus;
  options: string[];
  bonneReponse: number;
  /** « À retenir » : la règle ou la méthode, en une ou deux phrases. */
  explication: string;
  /**
   * Pourquoi chaque proposition est juste ou fausse, dans le même ordre que `options`.
   * `pourquoi[bonneReponse]` explique pourquoi la bonne réponse est bonne.
   */
  pourquoi: string[];
}

export interface Generateur {
  version: number;
  generer(ref: ItemRef): Item;
  construireRefs(opts: {
    graineBase: number;
    nb: number;
    difficulte: Difficulte;
    config: import('../config/epreuves').ConfigEpreuve;
  }): ItemRef[];
}
