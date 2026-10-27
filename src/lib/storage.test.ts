import { describe, expect, it } from 'vitest';
import {
  CLE_STOCKAGE,
  analyserImport,
  charger,
  donneesParDefaut,
  exporter,
  fusionner,
  sauver,
  type ResultatSeance,
  type StorageLike,
} from './storage';

function fauxStockage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
}

function resultat(id: string, date: string): ResultatSeance {
  return {
    id,
    date,
    epreuve: 'attention',
    mode: 'examen',
    niveau: 'officier',
    difficulte: 2,
    nbItems: 45,
    nbRepondues: 30,
    nbCorrectes: 27,
    precision: 0.9,
    vitesse: 8.5,
    vitesseCorrectes: 7.7,
    score: 27,
    dureeMs: 210000,
    precisionDebut: 0.93,
    precisionFin: 0.87,
    erreurs: [{ epreuve: 'attention', version: 1, seed: 5, difficulte: 2 }],
  };
}

describe('stockage local', () => {
  it('fonctionne sans stockage (null) sans planter', () => {
    expect(charger(null)).toEqual(donneesParDefaut());
    expect(sauver(null, donneesParDefaut())).toBe(false);
  });

  it('ne plante pas si le stockage lève des exceptions', () => {
    const casse: StorageLike = {
      getItem: () => {
        throw new Error('bloqué');
      },
      setItem: () => {
        throw new Error('plein');
      },
    };
    expect(charger(casse)).toEqual(donneesParDefaut());
    expect(sauver(casse, donneesParDefaut())).toBe(false);
  });

  it('sauvegarde puis recharge', () => {
    const st = fauxStockage();
    const d = { ...donneesParDefaut(), historique: [resultat('a', '2026-01-01')] };
    expect(sauver(st, d)).toBe(true);
    expect(charger(st)).toEqual(d);
  });

  it('retombe sur les valeurs par défaut si le contenu est corrompu', () => {
    const st = fauxStockage();
    st.data.set(CLE_STOCKAGE, '{pas du json');
    expect(charger(st)).toEqual(donneesParDefaut());
  });

  it('export puis import redonne les mêmes données', () => {
    const d = { ...donneesParDefaut(), historique: [resultat('a', '2026-01-01')] };
    expect(analyserImport(exporter(d))).toEqual(d);
  });

  it('refuse un import invalide et ignore les entrées mal formées', () => {
    expect(analyserImport('n’importe quoi')).toBeNull();
    expect(analyserImport('{"version":2}')).toBeNull();
    const mixte = JSON.stringify({
      version: 1,
      prefs: { niveau: 'inconnu' },
      historique: [resultat('ok', '2026-01-01'), { id: 'cassé' }],
    });
    const d = analyserImport(mixte);
    expect(d?.historique).toHaveLength(1);
    expect(d?.prefs.niveau).toBe('militaire-du-rang');
  });

  it('fusionne sans doublon et trie par date', () => {
    const a = { ...donneesParDefaut(), historique: [resultat('2', '2026-02-01'), resultat('1', '2026-01-01')] };
    const b = { ...donneesParDefaut(), historique: [resultat('2', '2026-02-01'), resultat('3', '2026-03-01')] };
    expect(fusionner(a, b).historique.map((r) => r.id)).toEqual(['1', '2', '3']);
  });
});
