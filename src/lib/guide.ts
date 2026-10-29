/** Mémorise (dans le navigateur uniquement) si le guide de départ a déjà été vu. */
const CLE_GUIDE = 'psycho:guide-vu';

export function guideDejaVu(): boolean {
  try {
    return window.localStorage.getItem(CLE_GUIDE) === '1';
  } catch {
    // Stockage bloqué : on considère le guide vu pour ne pas le rouvrir à chaque page.
    return true;
  }
}

export function marquerGuideVu(): void {
  try {
    window.localStorage.setItem(CLE_GUIDE, '1');
  } catch {
    // rien à faire : le guide sera simplement reproposé à la prochaine visite
  }
}
