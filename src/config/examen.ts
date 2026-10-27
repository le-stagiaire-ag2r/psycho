import type { EpreuveId } from '../lib/types';

/**
 * Examen blanc enchaîné : ordre des épreuves psychotechniques, d'après les témoignages
 * (à valider, voir TODO-FORMATS.md). L'anglais est proposé en option : c'est un test distinct.
 */
export const EPREUVES_EXAMEN: EpreuveId[] = ['logique', 'spatial', 'verbal', 'numerique', 'codage', 'attention'];
export const EPREUVES_OPTIONNELLES_EXAMEN: EpreuveId[] = ['anglais'];
