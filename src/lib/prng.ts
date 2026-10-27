/**
 * Générateur de nombres pseudo-aléatoires à graine (mulberry32).
 * Une même graine donne toujours la même suite : c'est ce qui rend les questions
 * reproductibles, testables et signalables ("épreuve X, graine 48213").
 */
export interface Prng {
  /** Flottant dans [0, 1[ */
  suivant(): number;
  /** Entier dans [min, max] (bornes incluses) */
  entier(min: number, max: number): number;
  choisir<T>(liste: readonly T[]): T;
  /** Nouvelle liste mélangée (Fisher-Yates), l'originale n'est pas modifiée */
  melanger<T>(liste: readonly T[]): T[];
  chance(probabilite: number): boolean;
}

export function creerPrng(graine: number): Prng {
  let etat = graine >>> 0;

  const suivant = (): number => {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const entier = (min: number, max: number): number =>
    min + Math.floor(suivant() * (max - min + 1));

  return {
    suivant,
    entier,
    choisir: (liste) => {
      if (liste.length === 0) throw new Error('choisir() sur une liste vide');
      return liste[entier(0, liste.length - 1)];
    },
    melanger: (liste) => {
      const copie = [...liste];
      for (let i = copie.length - 1; i > 0; i--) {
        const j = entier(0, i);
        [copie[i], copie[j]] = [copie[j], copie[i]];
      }
      return copie;
    },
    chance: (probabilite) => suivant() < probabilite,
  };
}

/** Combine plusieurs entiers en une graine (hash type FNV-1a), pour dériver des sous-graines. */
export function melangerGraines(...valeurs: number[]): number {
  let h = 0x811c9dc5;
  for (const v of valeurs) {
    h ^= v >>> 0;
    h = Math.imul(h, 0x01000193) >>> 0;
    h ^= h >>> 13;
  }
  return h >>> 0;
}

/** Graine aléatoire pour une nouvelle séance (crypto si disponible). */
export function graineAleatoire(): number {
  try {
    const tab = new Uint32Array(1);
    globalThis.crypto.getRandomValues(tab);
    return tab[0];
  } catch {
    return Math.floor(Math.random() * 4294967296) >>> 0;
  }
}
