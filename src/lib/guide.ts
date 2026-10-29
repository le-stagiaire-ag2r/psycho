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

/** Mémorise (dans le navigateur uniquement) si la page « À propos » (bêta, limites) a déjà été lue. */
const CLE_APROPOS = 'psycho:apropos-vu';

export function aproposDejaVu(): boolean {
  try {
    return window.localStorage.getItem(CLE_APROPOS) === '1';
  } catch {
    // Stockage bloqué : on ne redirige pas à chaque visite.
    return true;
  }
}

export function marquerAproposVu(): void {
  try {
    window.localStorage.setItem(CLE_APROPOS, '1');
  } catch {
    // rien à faire : la page sera simplement reproposée à la prochaine visite
  }
}
