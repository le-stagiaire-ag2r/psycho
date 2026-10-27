import { describe, expect, it } from 'vitest';
import { EPREUVES, ORDRE_EPREUVES } from '../config/epreuves';
import { EPREUVES_EXAMEN } from '../config/examen';
import { FICHES, FICHES_PAR_ID } from '../data/methodes';
import { GENERATEURS, genererItem } from '../generateurs';
import { erreursARevoir, grouperParEpreuve } from './revision';
import type { ResultatSeance } from './storage';
import type { ItemRef } from './types';

function refAttention(seed: number): ItemRef {
  return { epreuve: 'attention', version: 1, seed, difficulte: 2 };
}

function seance(id: string, erreurs: ItemRef[]): ResultatSeance {
  return {
    id,
    date: `2026-01-0${id}`,
    epreuve: 'attention',
    mode: 'entrainement',
    niveau: 'officier',
    difficulte: 2,
    nbItems: 10,
    nbRepondues: 10,
    nbCorrectes: 10 - erreurs.length,
    precision: 0.8,
    vitesse: 5,
    vitesseCorrectes: 4,
    score: 8,
    dureeMs: 60000,
    precisionDebut: null,
    precisionFin: null,
    erreurs,
  };
}

describe('révision des erreurs', () => {
  it('liste les erreurs récentes d’abord, sans doublon', () => {
    const h = [seance('1', [refAttention(1), refAttention(2)]), seance('2', [refAttention(2), refAttention(3)])];
    const res = erreursARevoir(h, new Set());
    expect(res.map((e) => e.ref.seed)).toEqual([2, 3, 1]);
  });

  it('exclut les erreurs déjà résolues', () => {
    const h = [seance('1', [refAttention(1), refAttention(2)])];
    const idResolue = genererItem(refAttention(1)).id;
    expect(erreursARevoir(h, new Set([idResolue])).map((e) => e.ref.seed)).toEqual([2]);
  });

  it('ignore une référence dont la version de générateur n’existe plus', () => {
    const h = [seance('1', [{ ...refAttention(1), version: 999 }, refAttention(2)])];
    expect(erreursARevoir(h, new Set()).map((e) => e.ref.seed)).toEqual([2]);
  });

  it('régénère exactement la même question à partir de la référence stockée', () => {
    const ref = refAttention(4242);
    const copie = JSON.parse(JSON.stringify(ref)) as ItemRef;
    expect(genererItem(copie)).toEqual(genererItem(ref));
  });

  it('regroupe par épreuve', () => {
    const e = erreursARevoir([seance('1', [refAttention(1), refAttention(2)])], new Set());
    expect(grouperParEpreuve(e).get('attention')).toHaveLength(2);
    expect(grouperParEpreuve(e).has('codage')).toBe(false);
  });
});

describe('configuration cohérente', () => {
  it('chaque épreuve disponible (hors personnalité) a un générateur', () => {
    for (const id of ORDRE_EPREUVES) {
      const c = EPREUVES[id];
      if (c.disponible && id !== 'personnalite') expect(GENERATEURS[id]).toBeDefined();
      if (GENERATEURS[id]) expect(c.disponible).toBe(true);
    }
  });

  it('l’examen blanc ne contient que des épreuves jouables, avec un chrono', () => {
    for (const id of EPREUVES_EXAMEN) {
      expect(EPREUVES[id].disponible).toBe(true);
      expect(GENERATEURS[id]).toBeDefined();
      expect(EPREUVES[id].dureeSecondes).toBeGreaterThan(0);
    }
  });

  it('chaque épreuve disponible a au moins 3 conseils et une fiche méthode', () => {
    for (const id of ORDRE_EPREUVES) {
      if (!EPREUVES[id].disponible) continue;
      if (id !== 'personnalite') expect(EPREUVES[id].conseils.length).toBeGreaterThanOrEqual(3);
      expect(FICHES_PAR_ID.has(id)).toBe(true);
    }
    expect(FICHES_PAR_ID.has('general')).toBe(true);
  });

  it('les fiches méthode sont non vides et sans doublon de contenu', () => {
    for (const f of FICHES) {
      expect(f.sections.length).toBeGreaterThan(0);
      const points = f.sections.flatMap((s) => s.points);
      expect(new Set(points).size).toBe(points.length);
      for (const p of points) expect(p.length).toBeGreaterThan(15);
    }
  });
});
