import type { Difficulte, EpreuveId, ItemRef, Mode, NiveauId, ThemePref } from './types';

/**
 * Stockage local (localStorage). Tout est protégé par try/catch : le stockage peut
 * être absent, plein ou bloqué (navigation privée, réglages du navigateur).
 * Rien ne quitte jamais l'appareil.
 */
export interface StorageLike {
  getItem(cle: string): string | null;
  setItem(cle: string, valeur: string): void;
}

export const CLE_STOCKAGE = 'psycho:v1';
export const MAX_HISTORIQUE = 500;

export interface Prefs {
  niveau: NiveauId;
  mode: Mode;
  difficulte: Difficulte;
  theme: ThemePref;
}

export interface ResultatSeance {
  id: string;
  date: string;
  epreuve: EpreuveId;
  mode: Mode;
  niveau: NiveauId;
  difficulte: Difficulte;
  nbItems: number;
  nbRepondues: number;
  nbCorrectes: number;
  precision: number;
  vitesse: number;
  vitesseCorrectes: number;
  score: number;
  dureeMs: number;
  precisionDebut: number | null;
  precisionFin: number | null;
  erreurs: ItemRef[];
}

export interface Donnees {
  version: 1;
  prefs: Prefs;
  historique: ResultatSeance[];
}

export function donneesParDefaut(): Donnees {
  return {
    version: 1,
    prefs: { niveau: 'militaire-du-rang', mode: 'entrainement', difficulte: 2, theme: 'auto' },
    historique: [],
  };
}

export function stockageNavigateur(): StorageLike | null {
  try {
    const st = window.localStorage;
    st.getItem(CLE_STOCKAGE);
    return st;
  } catch {
    return null;
  }
}

const NIVEAUX_VALIDES = ['militaire-du-rang', 'sous-officier', 'officier'];
const MODES_VALIDES = ['entrainement', 'examen'];
const THEMES_VALIDES = ['auto', 'clair', 'sombre'];
const EPREUVES_VALIDES = [
  'logique',
  'spatial',
  'verbal',
  'numerique',
  'codage',
  'attention',
  'anglais',
  'personnalite',
];

const estNombre = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const estNombreOuNull = (x: unknown): x is number | null => x === null || estNombre(x);

function estRef(x: unknown): x is ItemRef {
  if (typeof x !== 'object' || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.epreuve === 'string' &&
    EPREUVES_VALIDES.includes(r.epreuve) &&
    estNombre(r.version) &&
    estNombre(r.seed) &&
    (r.difficulte === 1 || r.difficulte === 2 || r.difficulte === 3)
  );
}

function estResultat(x: unknown): x is ResultatSeance {
  if (typeof x !== 'object' || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.date === 'string' &&
    typeof r.epreuve === 'string' &&
    EPREUVES_VALIDES.includes(r.epreuve) &&
    typeof r.mode === 'string' &&
    MODES_VALIDES.includes(r.mode) &&
    typeof r.niveau === 'string' &&
    NIVEAUX_VALIDES.includes(r.niveau) &&
    (r.difficulte === 1 || r.difficulte === 2 || r.difficulte === 3) &&
    estNombre(r.nbItems) &&
    estNombre(r.nbRepondues) &&
    estNombre(r.nbCorrectes) &&
    estNombre(r.precision) &&
    estNombre(r.vitesse) &&
    estNombre(r.vitesseCorrectes) &&
    estNombre(r.score) &&
    estNombre(r.dureeMs) &&
    estNombreOuNull(r.precisionDebut) &&
    estNombreOuNull(r.precisionFin) &&
    Array.isArray(r.erreurs) &&
    r.erreurs.every(estRef)
  );
}

/** Reconstruit des données valides à partir d'un JSON quelconque (les entrées invalides sont ignorées). */
export function normaliser(brut: unknown): Donnees | null {
  if (typeof brut !== 'object' || brut === null) return null;
  const b = brut as Record<string, unknown>;
  if (b.version !== 1) return null;
  const defaut = donneesParDefaut();
  const p = (typeof b.prefs === 'object' && b.prefs !== null ? b.prefs : {}) as Record<string, unknown>;
  const prefs: Prefs = {
    niveau: NIVEAUX_VALIDES.includes(p.niveau as string) ? (p.niveau as NiveauId) : defaut.prefs.niveau,
    mode: MODES_VALIDES.includes(p.mode as string) ? (p.mode as Mode) : defaut.prefs.mode,
    difficulte:
      p.difficulte === 1 || p.difficulte === 2 || p.difficulte === 3
        ? p.difficulte
        : defaut.prefs.difficulte,
    theme: THEMES_VALIDES.includes(p.theme as string) ? (p.theme as ThemePref) : defaut.prefs.theme,
  };
  const historique = Array.isArray(b.historique) ? b.historique.filter(estResultat) : [];
  return { version: 1, prefs, historique: historique.slice(-MAX_HISTORIQUE) };
}

export function charger(st: StorageLike | null): Donnees {
  if (!st) return donneesParDefaut();
  try {
    const texte = st.getItem(CLE_STOCKAGE);
    if (!texte) return donneesParDefaut();
    return normaliser(JSON.parse(texte)) ?? donneesParDefaut();
  } catch {
    return donneesParDefaut();
  }
}

export function sauver(st: StorageLike | null, donnees: Donnees): boolean {
  if (!st) return false;
  try {
    st.setItem(CLE_STOCKAGE, JSON.stringify(donnees));
    return true;
  } catch {
    return false;
  }
}

export function exporter(donnees: Donnees): string {
  return JSON.stringify(donnees, null, 2);
}

/** Lit un fichier d'export. Retourne null si le contenu n'est pas un export valide. */
export function analyserImport(texte: string): Donnees | null {
  try {
    return normaliser(JSON.parse(texte));
  } catch {
    return null;
  }
}

/** Fusionne un import dans les données actuelles (sans doublon d'identifiant, trié par date). */
export function fusionner(actuelles: Donnees, importees: Donnees): Donnees {
  const parId = new Map<string, ResultatSeance>();
  for (const r of [...actuelles.historique, ...importees.historique]) parId.set(r.id, r);
  const historique = [...parId.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_HISTORIQUE);
  return { ...actuelles, historique };
}
