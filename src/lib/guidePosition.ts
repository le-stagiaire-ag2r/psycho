/**
 * Placement de la bulle du guide par rapport à l'élément mis en avant.
 * Fonction pure (testée sur de nombreux écrans) : la bulle reste toujours entièrement dans l'écran
 * et ne recouvre pas l'élément quand c'est possible ; sinon elle passe en « feuille » collée en bas.
 */
export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type CoteFleche = 'haut' | 'bas' | 'gauche' | 'droite';

export interface Placement {
  mode: 'centre' | 'bulle' | 'feuille';
  carte: { top: number; left: number; width: number; hauteur: number };
  /** Flèche de la bulle vers l'élément (position le long du bord, en px depuis le coin haut-gauche de la carte) */
  fleche: { cote: CoteFleche; pos: number } | null;
}

export const MARGE = 12;
const ECART = 16;
const LARGEUR_MAX = 380;
const BORD_FLECHE = 24;
const HAUTEUR_FEUILLE_MIN = 170;

function borner(x: number, min: number, max: number): number {
  return Math.min(Math.max(x, min), Math.max(min, max));
}

function chevauche(a: Rect, b: Rect): boolean {
  return a.left < b.left + b.width && a.left + a.width > b.left && a.top < b.top + b.height && a.top + a.height > b.top;
}

/**
 * @param cible zone à mettre en avant (déjà élargie d'une petite marge), ou null pour une bulle centrée
 * @param ecran dimensions visibles de l'écran
 * @param hauteurContenu hauteur naturelle de la carte (contenu complet)
 */
export function calculerPlacement(
  cible: Rect | null,
  ecran: { largeur: number; hauteur: number },
  hauteurContenu: number,
): Placement {
  const { largeur: vw, hauteur: vh } = ecran;
  const largeur = Math.min(LARGEUR_MAX, vw - 2 * MARGE);
  const hMax = vh - 2 * MARGE;
  const h = Math.min(hauteurContenu, hMax);

  if (!cible) {
    return {
      mode: 'centre',
      carte: { top: Math.max(MARGE, (vh - h) / 2), left: Math.max(MARGE, (vw - largeur) / 2), width: largeur, hauteur: h },
      fleche: null,
    };
  }

  const centreX = cible.left + cible.width / 2;
  const centreY = cible.top + cible.height / 2;
  const candidats: Placement[] = [];

  // Sous l'élément
  {
    const left = borner(centreX - largeur / 2, MARGE, vw - largeur - MARGE);
    candidats.push({
      mode: 'bulle',
      carte: { top: cible.top + cible.height + ECART, left, width: largeur, hauteur: h },
      fleche: { cote: 'haut', pos: borner(centreX - left, BORD_FLECHE, largeur - BORD_FLECHE) },
    });
  }
  // Au-dessus
  {
    const left = borner(centreX - largeur / 2, MARGE, vw - largeur - MARGE);
    candidats.push({
      mode: 'bulle',
      carte: { top: cible.top - ECART - h, left, width: largeur, hauteur: h },
      fleche: { cote: 'bas', pos: borner(centreX - left, BORD_FLECHE, largeur - BORD_FLECHE) },
    });
  }
  // À droite
  {
    const top = borner(centreY - h / 2, MARGE, vh - h - MARGE);
    candidats.push({
      mode: 'bulle',
      carte: { top, left: cible.left + cible.width + ECART, width: largeur, hauteur: h },
      fleche: { cote: 'gauche', pos: borner(centreY - top, BORD_FLECHE, h - BORD_FLECHE) },
    });
  }
  // À gauche
  {
    const top = borner(centreY - h / 2, MARGE, vh - h - MARGE);
    candidats.push({
      mode: 'bulle',
      carte: { top, left: cible.left - ECART - largeur, width: largeur, hauteur: h },
      fleche: { cote: 'droite', pos: borner(centreY - top, BORD_FLECHE, h - BORD_FLECHE) },
    });
  }

  for (const c of candidats) {
    const { top, left, width, hauteur } = c.carte;
    const dedans = top >= MARGE && left >= MARGE && top + hauteur <= vh - MARGE && left + width <= vw - MARGE;
    if (dedans && !chevauche({ top, left, width, height: hauteur }, cible)) return c;
  }

  // Aucun emplacement libre : feuille collée en bas, sur toute la largeur utile.
  const lf = Math.min(vw - 2 * MARGE, 560);
  // La feuille laisse de la place à l'élément (qui sera amené en haut de l'écran) ; son contenu défile si besoin.
  const placeRestante = vh - cible.height - 3 * MARGE;
  const hf = Math.min(h, placeRestante >= HAUTEUR_FEUILLE_MIN ? placeRestante : Math.floor(vh * 0.55));
  return {
    mode: 'feuille',
    carte: { top: vh - hf - MARGE, left: (vw - lf) / 2, width: lf, hauteur: hf },
    fleche: null,
  };
}

/** Zone de l'écran restée libre au-dessus d'une feuille (là où faire défiler l'élément mis en avant). */
export function zoneLibreAuDessus(p: Placement): { haut: number; bas: number } {
  return { haut: MARGE, bas: p.carte.top - MARGE };
}
