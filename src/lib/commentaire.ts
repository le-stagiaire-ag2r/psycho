/**
 * Commentaire : le message est construit localement, puis copié par le candidat pour le coller sur le forum.
 * Rien n'est envoyé par l'appli (pas de serveur).
 */
export type TypeCommentaire = 'bug' | 'question' | 'idee' | 'autre';

export const TYPES_COMMENTAIRE: { id: TypeCommentaire; libelle: string; consigne: string }[] = [
  {
    id: 'bug',
    libelle: 'Un problème (bug, affichage, chrono…)',
    consigne: 'Que s’est-il passé, et qu’attendais-tu ?',
  },
  {
    id: 'question',
    libelle: 'Une erreur dans une question ou sa correction',
    consigne: 'Qu’est-ce qui est faux, ambigu ou mal expliqué ? Quelle réponse te paraît correcte ?',
  },
  {
    id: 'idee',
    libelle: 'Une idée d’amélioration',
    consigne: 'Qu’est-ce qui manque ou pourrait être mieux, et pourquoi ?',
  },
  { id: 'autre', libelle: 'Autre', consigne: 'Dis-nous tout.' },
];

export interface EntreeCommentaire {
  type: TypeCommentaire;
  description: string;
  /** Étapes pour reproduire (problèmes seulement) */
  etapes: string;
  /** Référence d'une question (ex. « codage-v2-d2-s48213 »), vide si aucune */
  ref: string;
  /** Contexte technique facultatif, déjà mis en forme (navigateur, taille d'écran) */
  contexte: string;
}

/** Limite de taille : un commentaire reste lisible sur un forum. */
export const LONGUEUR_MAX = 2000;

const ENTETES: Record<TypeCommentaire, string> = {
  bug: '[Problème]',
  question: '[Erreur dans une question]',
  idee: '[Idée d’amélioration]',
  autre: '[Commentaire]',
};

/** Nettoie les références passées dans l'adresse : seulement lettres, chiffres, tirets. */
export function refValide(brut: string | null): string {
  return brut && /^[a-z0-9-]{3,80}$/i.test(brut) ? brut : '';
}

export function construireMessage(e: EntreeCommentaire): string {
  const lignes = [`${ENTETES[e.type]} Psycho (bêta)`, ''];
  if (e.ref) lignes.push(`Référence de la question : ${e.ref}`);
  lignes.push(e.description.trim().slice(0, LONGUEUR_MAX));
  if (e.type === 'bug' && e.etapes.trim()) {
    lignes.push('', 'Pour reproduire :', e.etapes.trim().slice(0, LONGUEUR_MAX));
  }
  if (e.contexte.trim()) lignes.push('', `Contexte : ${e.contexte.trim()}`);
  return lignes.join('\n');
}
