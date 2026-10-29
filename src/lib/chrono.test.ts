import { describe, expect, it } from 'vitest';
import { dureeEffectiveSecondes } from './chrono';
import { normaliser, donneesParDefaut } from './storage';

describe('chrono réglable', () => {
  it('indicatif garde la durée, souple ajoute 50 %, libre supprime la limite', () => {
    expect(dureeEffectiveSecondes(840, 'indicatif')).toBe(840);
    expect(dureeEffectiveSecondes(840, 'souple')).toBe(1260);
    expect(dureeEffectiveSecondes(840, 'libre')).toBe(Infinity);
  });

  it('une sauvegarde ancienne sans réglage de chrono reçoit la valeur par défaut', () => {
    const ancien = { version: 1, prefs: { niveau: 'officier', mode: 'examen', difficulte: 3, theme: 'sombre' }, historique: [], erreursResolues: [] };
    expect(normaliser(ancien)?.prefs.chrono).toBe('indicatif');
    expect(normaliser({ ...ancien, prefs: { ...ancien.prefs, chrono: 'libre' } })?.prefs.chrono).toBe('libre');
    expect(normaliser({ ...ancien, prefs: { ...ancien.prefs, chrono: 'nimporte' } })?.prefs.chrono).toBe(donneesParDefaut().prefs.chrono);
  });
});
