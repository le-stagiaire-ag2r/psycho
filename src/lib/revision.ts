import { genererItem } from '../generateurs';
import type { ResultatSeance } from './storage';
import type { EpreuveId, ItemRef } from './types';

export interface ErreurARevoir {
  /** Identifiant stable de la question (épreuve + version + graine…) */
  id: string;
  ref: ItemRef;
}

/**
 * Liste des questions ratées à revoir : les plus récentes d'abord, sans doublon, sans celles déjà
 * résolues. Une référence qui ne peut plus être régénérée (version de générateur obsolète) est ignorée.
 */
export function erreursARevoir(historique: readonly ResultatSeance[], resolues: ReadonlySet<string>): ErreurARevoir[] {
  const vues = new Set<string>();
  const res: ErreurARevoir[] = [];
  for (let i = historique.length - 1; i >= 0; i--) {
    for (const ref of historique[i].erreurs) {
      let id: string;
      try {
        id = genererItem(ref).id;
      } catch {
        continue;
      }
      if (vues.has(id) || resolues.has(id)) continue;
      vues.add(id);
      res.push({ id, ref });
    }
  }
  return res;
}

export function grouperParEpreuve(erreurs: readonly ErreurARevoir[]): Map<EpreuveId, ErreurARevoir[]> {
  const m = new Map<EpreuveId, ErreurARevoir[]>();
  for (const e of erreurs) m.set(e.ref.epreuve, [...(m.get(e.ref.epreuve) ?? []), e]);
  return m;
}
