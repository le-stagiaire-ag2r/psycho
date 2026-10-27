import type { EpreuveId } from '../lib/types';

/**
 * Examen blanc enchaîné : ordre des épreuves psychotechniques, d'après les témoignages
 * (à valider, voir TODO-FORMATS.md). L'anglais (test distinct) et le raisonnement général (épreuve complémentaire) sont proposés en option.
 */
export const EPREUVES_EXAMEN: EpreuveId[] = ['logique', 'spatial', 'verbal', 'numerique', 'codage', 'attention'];
export const EPREUVES_OPTIONNELLES_EXAMEN: EpreuveId[] = ['raisonnement', 'anglais'];
