import { imageSymbole } from '../data/symboles';
import { projeter, type V3 } from '../lib/geometrie3d';
import type { PatronCube, Vue3 } from '../lib/types';

const S = 40; // échelle de projection (arête du cube = 2 unités)

interface RepereDessin {
  o: V3; // coin du symbole en bas à gauche
  e1: V3; // vers la droite du symbole
  e2: V3; // vers le haut du symbole
  classe: string;
}

// Les trois faces visibles (dessus, avant, droite), dans l'ordre de Vue3.
const FACES: RepereDessin[] = [
  { o: [-1, -1, 1], e1: [2, 0, 0], e2: [0, 2, 0], classe: 'cube-dessus' },
  { o: [-1, -1, -1], e1: [2, 0, 0], e2: [0, 0, 2], classe: 'cube-avant' },
  { o: [1, -1, -1], e1: [0, 2, 0], e2: [0, 0, 2], classe: 'cube-droite' },
];

const point = (r: RepereDessin, s: number, t: number): [number, number] =>
  projeter([r.o[0] + s * r.e1[0] + t * r.e2[0], r.o[1] + s * r.e1[1] + t * r.e2[1], r.o[2] + s * r.e1[2] + t * r.e2[2]], S);

const chemin = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';

/** Cube en projection isométrique avec trois faces visibles et leurs symboles. */
export default function CubeSvg({ vue, libelle }: { vue: Vue3; libelle: string }) {
  return (
    <svg className="cube-svg" viewBox={`${-1.5 * S} ${-1.75 * S} ${3 * S} ${3.5 * S}`} role="img" aria-label={libelle}>
      {FACES.map((repere, i) => {
        const f = vue[i];
        const image = imageSymbole(f.sym, f.k, f.mir);
        const marge = 0.14;
        const cases: string[] = [];
        image.forEach((ligne, r) =>
          ligne.forEach((noire, c) => {
            if (!noire) return;
            const s0 = marge + ((1 - 2 * marge) * c) / 3;
            const s1 = marge + ((1 - 2 * marge) * (c + 1)) / 3;
            const t0 = 1 - marge - ((1 - 2 * marge) * (r + 1)) / 3;
            const t1 = 1 - marge - ((1 - 2 * marge) * r) / 3;
            cases.push(chemin([point(repere, s0, t0), point(repere, s1, t0), point(repere, s1, t1), point(repere, s0, t1)]));
          }),
        );
        return (
          <g key={repere.classe}>
            <path className={repere.classe} d={chemin([point(repere, 0, 0), point(repere, 1, 0), point(repere, 1, 1), point(repere, 0, 1)])} />
            <path className="cube-symbole" d={cases.join(' ')} />
          </g>
        );
      })}
    </svg>
  );
}

const POSITIONS_PATRON: Record<keyof PatronCube, [number, number]> = {
  dessus: [1, 0],
  gauche: [0, 1],
  avant: [1, 1],
  droite: [2, 1],
  arriere: [3, 1],
  dessous: [1, 2],
};

/** Patron en croix d'un cube : à plier pour former le cube (symboles vers l'extérieur). */
export function PatronSvg({ patron }: { patron: PatronCube }) {
  const T = 54;
  return (
    <svg className="patron-svg" viewBox={`-2 -2 ${4 * T + 4} ${3 * T + 4}`} role="img" aria-label="Patron du cube à plier">
      {(Object.keys(POSITIONS_PATRON) as (keyof PatronCube)[]).map((nom) => {
        const [col, lig] = POSITIONS_PATRON[nom];
        const f = patron[nom];
        const image = imageSymbole(f.sym, f.k, false);
        const c = T / 3.6;
        const decal = (T - 3 * c) / 2;
        return (
          <g key={nom} transform={`translate(${col * T} ${lig * T})`}>
            <rect width={T} height={T} className="patron-face" />
            {image.map((ligne, r) =>
              ligne.map((noire, cc) =>
                noire ? <rect key={`${r}-${cc}`} x={decal + cc * c} y={decal + r * c} width={c} height={c} className="cube-symbole" /> : null,
              ),
            )}
          </g>
        );
      })}
    </svg>
  );
}
