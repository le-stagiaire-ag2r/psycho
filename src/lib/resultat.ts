import type { Bilan } from './scoring';
import type { ResultatSeance } from './storage';
import type { Difficulte, EpreuveId, Mode, NiveauId } from './types';

interface Meta {
  epreuve: EpreuveId;
  mode: Mode;
  niveau: NiveauId;
  difficulte: Difficulte;
  dureeMs: number;
  /** Identifiant commun aux épreuves d'un même examen blanc enchaîné */
  examenId?: string;
}

/** Transforme un bilan en entrée d'historique (sérialisable, stockée localement). */
export function creerResultat(bilan: Bilan, meta: Meta): ResultatSeance {
  const date = new Date().toISOString();
  return {
    id: `${date}-${Math.random().toString(36).slice(2, 8)}`,
    date,
    epreuve: meta.epreuve,
    mode: meta.mode,
    niveau: meta.niveau,
    difficulte: meta.difficulte,
    nbItems: bilan.nbItems,
    nbRepondues: bilan.nbRepondues,
    nbCorrectes: bilan.nbCorrectes,
    precision: bilan.precision,
    vitesse: bilan.vitesse,
    vitesseCorrectes: bilan.vitesseCorrectes,
    score: bilan.score,
    dureeMs: meta.dureeMs,
    precisionDebut: bilan.precisionDebut,
    precisionFin: bilan.precisionFin,
    erreurs: bilan.erreurs,
    ...(meta.examenId ? { examenId: meta.examenId } : {}),
  };
}
