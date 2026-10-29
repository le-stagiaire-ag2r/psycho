import { describe, expect, it } from 'vitest';
import { repereGlobal, repereIndicatif } from './scoring';

const objectif = { precisionMin: 0.8, correctesParMinute: 10 };

describe('repère indicatif E1 / E2 / E3', () => {
  it('E1 si précision et vitesse atteignent l’objectif', () => {
    expect(repereIndicatif({ precision: 0.8, vitesseCorrectes: 10 }, objectif)).toBe('E1');
    expect(repereIndicatif({ precision: 0.95, vitesseCorrectes: 14 }, objectif)).toBe('E1');
  });
  it('E2 si l’on est proche de l’objectif', () => {
    expect(repereIndicatif({ precision: 0.7, vitesseCorrectes: 10 }, objectif)).toBe('E2');
    expect(repereIndicatif({ precision: 0.9, vitesseCorrectes: 6 }, objectif)).toBe('E2');
  });
  it('E3 si l’on est très loin de l’objectif', () => {
    expect(repereIndicatif({ precision: 0.5, vitesseCorrectes: 10 }, objectif)).toBe('E3');
    expect(repereIndicatif({ precision: 0.9, vitesseCorrectes: 4 }, objectif)).toBe('E3');
  });
  it('repère global', () => {
    expect(repereGlobal([])).toBeNull();
    expect(repereGlobal(['E1', 'E1', 'E1', 'E2'])).toBe('E1');
    expect(repereGlobal(['E1', 'E2', 'E2', 'E2'])).toBe('E2');
    expect(repereGlobal(['E1', 'E1', 'E1', 'E3'])).toBe('E2');
    expect(repereGlobal(['E1', 'E1', 'E3'])).toBe('E3');
    expect(repereGlobal(['E3', 'E3', 'E2', 'E1', 'E1', 'E1'])).toBe('E3');
  });
});
