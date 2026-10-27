import type { Grille } from '../lib/types';

interface Props {
  grille: Grille;
  /** Taille d'une case en pixels SVG */
  cellule?: number;
  libelle: string;
}

/** Quadrillage noir/blanc en SVG (identique sur tous les écrans). */
export default function GrilleSvg({ grille, cellule = 28, libelle }: Props) {
  const n = grille.length;
  const taille = n * cellule;
  return (
    <svg
      className="grille-svg"
      viewBox={`-1 -1 ${taille + 2} ${taille + 2}`}
      role="img"
      aria-label={`${libelle} : ${grille.map((l) => l.map((c) => (c ? 'noir' : 'blanc')).join(' ')).join(' / ')}`}
    >
      {grille.map((ligne, r) =>
        ligne.map((noire, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * cellule}
            y={r * cellule}
            width={cellule}
            height={cellule}
            fill={noire ? 'var(--grille-noir)' : 'var(--grille-blanc)'}
            stroke="var(--grille-trait)"
            strokeWidth="1"
          />
        )),
      )}
    </svg>
  );
}
