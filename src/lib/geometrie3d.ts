/**
 * Géométrie des cubes en entiers : vecteurs, 24 rotations propres, et les trois
 * faces visibles en projection isométrique (dessus, avant, droite).
 *
 * Repère : x vers la droite, y vers l'arrière (profondeur), z vers le haut.
 * On regarde le cube depuis le coin (+1, −1, +1) : on voit donc le dessus (+z),
 * la face avant (−y) et la face droite (+x).
 */
export type V3 = readonly [number, number, number];
export type M3 = readonly [V3, V3, V3]; // lignes de la matrice

export const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1] || 0,
  a[2] * b[0] - a[0] * b[2] || 0,
  a[0] * b[1] - a[1] * b[0] || 0,
];
export const neg = (a: V3): V3 => [-a[0] || 0, -a[1] || 0, -a[2] || 0];
export const egalV = (a: V3, b: V3): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
export const mulMV = (m: M3, v: V3): V3 => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
];
const mulMM = (a: M3, b: M3): M3 => {
  const col = (j: number): V3 => [b[0][j], b[1][j], b[2][j]];
  const ligne = (i: number): V3 => [0, 1, 2].map((j) => a[i][0] * col(j)[0] + a[i][1] * col(j)[1] + a[i][2] * col(j)[2]) as unknown as V3;
  return [ligne(0), ligne(1), ligne(2)];
};
const cleM = (m: M3): string => m.map((l) => l.join(',')).join(';');

const RX: M3 = [[1, 0, 0], [0, 0, -1], [0, 1, 0]]; // quart de tour autour de x
const RY: M3 = [[0, 0, 1], [0, 1, 0], [-1, 0, 0]]; // quart de tour autour de y
const RZ: M3 = [[0, -1, 0], [1, 0, 0], [0, 0, 1]]; // quart de tour autour de z
const IDENTITE: M3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

/** Les 24 rotations propres du cube (déterminant +1), identité en premier. */
export const ROTATIONS: readonly M3[] = (() => {
  const vues = new Map<string, M3>([[cleM(IDENTITE), IDENTITE]]);
  let frontiere: M3[] = [IDENTITE];
  while (frontiere.length) {
    const suivante: M3[] = [];
    for (const m of frontiere) {
      for (const g of [RX, RY, RZ]) {
        const n = mulMM(g, m);
        if (!vues.has(cleM(n))) {
          vues.set(cleM(n), n);
          suivante.push(n);
        }
      }
    }
    frontiere = suivante;
  }
  return [...vues.values()];
})();

export const REFLEXION_X: M3 = [[-1, 0, 0], [0, 1, 0], [0, 0, 1]];

// ---------- Les trois emplacements visibles ----------

export type Emplacement = 'dessus' | 'avant' | 'droite';
export const EMPLACEMENTS: readonly Emplacement[] = ['dessus', 'avant', 'droite'];

interface RepereFace {
  n: V3; // normale sortante
  haut: V3; // direction du haut d'un symbole "non tourné"
}

/** Repère canonique d'un symbole sur chaque face visible (haut = direction « vers le haut » à l'écran). */
export const REPERES: Record<Emplacement, RepereFace> = {
  dessus: { n: [0, 0, 1], haut: [0, 1, 0] },
  avant: { n: [0, -1, 0], haut: [0, 0, 1] },
  droite: { n: [1, 0, 0], haut: [0, 0, 1] },
};

/** Direction « droite » d'un symbole dont le haut est `haut` sur une face de normale `n`. */
export const droiteDe = (haut: V3, n: V3): V3 => cross(haut, n);

/** Direction du haut d'un symbole tourné de k quarts de tour horaires (vu de l'extérieur). */
export function hautApres(e: Emplacement, k: number): V3 {
  const { n, haut } = REPERES[e];
  let u = haut;
  for (let i = 0; i < ((k % 4) + 4) % 4; i++) u = droiteDe(u, n);
  return u;
}

/** Inverse de hautApres : combien de quarts de tour horaires amènent le haut canonique sur `u` ? */
export function quartsDepuis(e: Emplacement, u: V3): number {
  for (let k = 0; k < 4; k++) if (egalV(hautApres(e, k), u)) return k;
  throw new Error('Direction de symbole incompatible avec la face');
}

export function emplacementDe(n: V3): Emplacement | null {
  for (const e of EMPLACEMENTS) if (egalV(REPERES[e].n, n)) return e;
  return null;
}

// ---------- Projection isométrique ----------

/** Projette un point 3D en coordonnées SVG (y vers le bas), arête du cube = 2 unités. */
export function projeter(p: V3, echelle: number): [number, number] {
  const X = (p[0] + p[1]) / Math.SQRT2;
  const Y = (-p[0] + p[1] + 2 * p[2]) / Math.sqrt(6);
  return [X * echelle, -Y * echelle];
}

/**
 * Rotation de 120° autour de l'axe de vue (+1, −1, +1) : permute circulairement
 * les trois faces visibles sans jamais en cacher une.
 * Envoie x → −y, y → −z, z → x.
 */
export const ROT_AXE_DE_VUE: M3 = [[0, 0, 1], [-1, 0, 0], [0, -1, 0]];
