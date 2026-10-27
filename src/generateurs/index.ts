import type { EpreuveId, Generateur, Item, ItemRef } from '../lib/types';
import { generateurAttention } from './attention';
import { generateurCodage } from './codage';
import { generateurNumerique } from './numerique';
import { generateurSpatial } from './spatial';

/** Registre des générateurs disponibles. Une nouvelle épreuve s'ajoute ici. */
export const GENERATEURS: Partial<Record<EpreuveId, Generateur>> = {
  attention: generateurAttention,
  codage: generateurCodage,
  numerique: generateurNumerique,
  spatial: generateurSpatial,
};

export function genererItem(ref: ItemRef): Item {
  const gen = GENERATEURS[ref.epreuve];
  if (!gen) throw new Error(`Aucun générateur pour l'épreuve « ${ref.epreuve} »`);
  return gen.generer(ref);
}
