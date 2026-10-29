export function formatDuree(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function pourcent(x: number): string {
  return `${Math.round(x * 100)} %`;
}

export function decimal(x: number, chiffres = 1): string {
  return x.toFixed(chiffres).replace('.', ',');
}

/** Durée longue lisible : « 1 h 56 min » (au-delà d'une heure), « 53 min » sinon. */
export function formatDureeLongue(ms: number): string {
  const min = Math.round(Math.max(0, ms) / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')} min`;
}
