import { describe, expect, it } from 'vitest';
import { titreDePage } from './titres';

describe('titreDePage', () => {
  it('donne un titre propre à chaque route', () => {
    expect(titreDePage('/')).toBe('Épreuves · Psycho');
    expect(titreDePage('/examen')).toBe('Examen blanc · Psycho');
    expect(titreDePage('/epreuve/codage/entrainement')).toContain('Codage');
    expect(titreDePage('/methode/attention')).toContain('Fiche méthode');
    expect(titreDePage('/nimporte/quoi')).toBe('Page introuvable · Psycho');
  });
});
