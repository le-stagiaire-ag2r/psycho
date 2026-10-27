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
