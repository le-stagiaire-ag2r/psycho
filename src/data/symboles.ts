import type { Grille } from '../lib/types';

/**
 * Symboles des faces de cubes : motifs 3×3 sans AUCUNE symétrie.
 *
 * Un symbole sans symétrie a 8 images distinctes (4 rotations × miroir ou non),
 * donc une rotation ne peut jamais être confondue avec un miroir, ni avec un autre
 * symbole : « ce qu'on voit à l'écran » identifie sans ambiguïté (symbole, orientation, chiralité).
 *
 * Ils sont calculés de façon déterministe au chargement (aucun contenu externe),
 * en choisissant d'abord les motifs connexes de 5 cases puis, pour compléter, les plus simples
 * des autres.
 */
const N = 3;

const rot = (g: Grille): Grille => g[0].map((_, c) => g.map((_, r) => g[g.length - 1 - r][c]));
const miroir = (g: Grille): Grille => g.map((l) => [...l].reverse());
const cle = (g: Grille): string => g.map((l) => l.map((x) => (x ? 1 : 0)).join('')).join('/');

function huitImages(g: Grille): Grille[] {
  const res: Grille[] = [];
  let r = g;
  for (let i = 0; i < 4; i++) {
    res.push(r, miroir(r));
    r = rot(r);
  }
  return res;
}

function estConnexe(g: Grille): boolean {
  const cases: [number, number][] = [];
  g.forEach((l, r) => l.forEach((x, c) => x && cases.push([r, c])));
  if (cases.length === 0) return false;
  const vus = new Set<string>([cases[0].join()]);
  const pile = [cases[0]];
  while (pile.length) {
    const [r, c] = pile.pop()!;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = `${r + dr},${c + dc}`;
      if (!vus.has(k) && cases.some(([a, b]) => a === r + dr && b === c + dc)) {
        vus.add(k);
        pile.push([r + dr, c + dc]);
      }
    }
  }
  return vus.size === cases.length;
}

function calculerSymboles(): Grille[] {
  const classes = new Map<string, { grille: Grille; connexe: boolean; nb: number }>();
  for (let masque = 0; masque < 1 << (N * N); masque++) {
    const g: Grille = Array.from({ length: N }, (_, r) =>
      Array.from({ length: N }, (_, c) => ((masque >> (r * N + c)) & 1) === 1),
    );
    const nb = g.flat().filter(Boolean).length;
    if (nb < 5 || nb > 6) continue;
    // Le motif doit toucher les quatre bords de la grille 3×3 : le placement est alors sans ambiguïté.
    const touche = g[0].some(Boolean) && g[N - 1].some(Boolean) && g.some((l) => l[0]) && g.some((l) => l[N - 1]);
    if (!touche) continue;
    const images = huitImages(g).map(cle);
    if (new Set(images).size !== 8) continue;
    const canon = [...images].sort()[0];
    if (!classes.has(canon)) classes.set(canon, { grille: g, connexe: estConnexe(g), nb });
  }
  return [...classes.entries()]
    .sort(([ka, a], [kb, b]) => Number(b.connexe) - Number(a.connexe) || a.nb - b.nb || ka.localeCompare(kb))
    .slice(0, 8)
    .map(([, v]) => v.grille);
}

export const SYMBOLES: readonly Grille[] = calculerSymboles();

/** Image d'un symbole une fois mis dans une orientation : miroir éventuel, puis k quarts de tour horaires. */
export function imageSymbole(indice: number, k: number, mir: boolean): Grille {
  let g = mir ? miroir(SYMBOLES[indice]) : SYMBOLES[indice];
  for (let i = 0; i < ((k % 4) + 4) % 4; i++) g = rot(g);
  return g;
}

export const cleImage = (indice: number, k: number, mir: boolean): string => cle(imageSymbole(indice, k, mir));
