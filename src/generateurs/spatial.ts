import { melangerGraines } from '../lib/prng';
import type { Generateur, Item, ItemRef } from '../lib/types';
import { VERSION_GRILLE, genererGrille } from './grille';

/**
 * Raisonnement spatial : deux variantes (quadrillages tournés, cubes retournés).
 * `params.variante` choisit le sous-générateur ; la répartition est configurable
 * (`parametres.variantes` dans la config de l'épreuve, ex. « grille,cube »).
 */
export const VERSION_SPATIAL = 1;

type Variante = 'grille';

function genererSpatial(ref: ItemRef): Item {
  if (ref.version !== VERSION_SPATIAL) {
    throw new Error(`Version de générateur non supportée : spatial v${ref.version}`);
  }
  const variante = String(ref.params?.variante ?? 'grille') as Variante;
  if (variante === 'grille') return genererGrille({ ...ref, version: VERSION_GRILLE });
  throw new Error(`Variante spatiale inconnue : ${variante}`);
}

export const generateurSpatial: Generateur = {
  version: VERSION_SPATIAL,
  generer: genererSpatial,
  construireRefs({ graineBase, nb, difficulte, config }) {
    const variantes = String(config.parametres.variantes ?? 'grille').split(',');
    return Array.from({ length: nb }, (_, i) => ({
      epreuve: 'spatial' as const,
      version: VERSION_SPATIAL,
      seed: melangerGraines(graineBase, i),
      difficulte,
      params: {
        variante: variantes[i % variantes.length],
        nbChoix: config.nbChoix,
        sensRotation: String(config.parametres.sensRotation ?? 'mixte'),
      },
    }));
  },
};
