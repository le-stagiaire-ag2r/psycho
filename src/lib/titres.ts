import { NOM_APP } from '../config/app';
import { EPREUVES } from '../config/epreuves';
import { FICHES_PAR_ID } from '../data/methodes';
import type { EpreuveId } from './types';

const FIXES: Record<string, string> = {
  '/': 'Épreuves',
  '/examen': 'Examen blanc',
  '/revision': 'Révision des erreurs',
  '/methode': 'Fiches méthode',
  '/personnalite': 'Personnalité (mode découverte)',
  '/progression': 'Progression',
  '/a-propos': 'À propos (site en bêta)',
  '/commentaire': 'Envoyer un commentaire',
  '/confidentialite': 'Confidentialité',
};

/** Titre de l'onglet pour une route donnée. */
export function titreDePage(chemin: string): string {
  const p = chemin.length > 1 ? chemin.replace(/\/+$/, '') : chemin;
  let titre = FIXES[p];
  if (!titre) {
    const methode = /^\/methode\/([^/]+)$/.exec(p);
    const seance = /^\/epreuve\/([^/]+)\/([^/]+)$/.exec(p);
    if (methode) {
      const f = FICHES_PAR_ID.get(methode[1] as EpreuveId | 'general');
      titre = f ? `Fiche méthode : ${f.titre}` : 'Fiche introuvable';
    } else if (seance) {
      const c = EPREUVES[seance[1] as EpreuveId];
      titre = c ? `${c.titre} : ${seance[2] === 'examen' ? 'examen' : 'entraînement'}` : 'Page introuvable';
    } else {
      titre = 'Page introuvable';
    }
  }
  return `${titre} · ${NOM_APP}`;
}
