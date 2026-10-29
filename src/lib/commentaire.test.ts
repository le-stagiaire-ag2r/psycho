import { describe, expect, it } from 'vitest';
import { construireMessage, LONGUEUR_MAX, refValide } from './commentaire';

describe('commentaire', () => {
  it('construit un message lisible avec référence et contexte', () => {
    const m = construireMessage({
      type: 'question',
      description: '  La réponse B est aussi correcte.  ',
      etapes: 'ignoré',
      ref: 'codage-v2-d2-s48213',
      contexte: 'Firefox, 390×844',
    });
    expect(m).toBe(
      '[Erreur dans une question] Psycho (bêta)\n\nRéférence de la question : codage-v2-d2-s48213\nLa réponse B est aussi correcte.\n\nContexte : Firefox, 390×844',
    );
  });

  it('ajoute les étapes seulement pour un problème', () => {
    const base = { description: 'Le chrono ne démarre pas', etapes: '1. Ouvrir\n2. Cliquer', ref: '', contexte: '' };
    expect(construireMessage({ ...base, type: 'bug' })).toContain('Pour reproduire :\n1. Ouvrir');
    expect(construireMessage({ ...base, type: 'idee' })).not.toContain('Pour reproduire');
  });

  it('limite la taille du texte', () => {
    const m = construireMessage({ type: 'autre', description: 'a'.repeat(LONGUEUR_MAX + 500), etapes: '', ref: '', contexte: '' });
    expect(m.length).toBeLessThan(LONGUEUR_MAX + 100);
  });

  it('n’accepte que des références bien formées', () => {
    expect(refValide('attention-v2-d2-s123')).toBe('attention-v2-d2-s123');
    expect(refValide('<script>alert(1)</script>')).toBe('');
    expect(refValide(null)).toBe('');
  });
});
