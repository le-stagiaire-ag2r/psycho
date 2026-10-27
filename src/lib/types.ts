/** Types partagés. Un item = un générateur + une graine + une difficulté, sérialisable en JSON. */

export type EpreuveId =
  | 'logique'
  | 'spatial'
  | 'verbal'
  | 'numerique'
  | 'codage'
  | 'attention'
  | 'anglais'
  | 'personnalite';

export type Mode = 'entrainement' | 'examen';
export type NiveauId = 'militaire-du-rang' | 'sous-officier' | 'officier';
export type Difficulte = 1 | 2 | 3;
export type ThemePref = 'auto' | 'clair' | 'sombre';

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

export type Stimulus = StimulusAttention | StimulusCodage | StimulusGrille | StimulusTexte;

/** Question prête à afficher (QCM : une seule bonne réponse). */
export interface Item {
  id: string;
  ref: ItemRef;
  consigne: string;
  stimulus: Stimulus;
  options: string[];
  bonneReponse: number;
  explication: string;
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
