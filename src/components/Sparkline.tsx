interface Props {
  valeurs: number[];
  /** Valeur plancher / plafond de l'axe (par défaut : min/max des données) */
  min?: number;
  max?: number;
  libelle: string;
}

/** Courbe minimaliste en SVG. */
export default function Sparkline({ valeurs, min, max, libelle }: Props) {
  const w = 220;
  const h = 48;
  if (valeurs.length === 0) return null;
  const lo = min ?? Math.min(...valeurs);
  const hi = max ?? Math.max(...valeurs);
  const ecart = hi - lo || 1;
  const x = (i: number) => (valeurs.length === 1 ? w / 2 : 4 + (i * (w - 8)) / (valeurs.length - 1));
  const y = (v: number) => h - 4 - ((v - lo) / ecart) * (h - 8);
  const points = valeurs.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={libelle}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {valeurs.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="currentColor" />
      ))}
    </svg>
  );
}
