import { describe, expect, it } from 'vitest';
import { EPREUVES } from '../config/epreuves';
import { generateurAttention } from '../generateurs/attention';
import { calculerBilan, comparerObjectif } from './scoring';
import { avancer, demarrer, enregistrerReponse, indexCourant, passer, terminer } from './session';

function creerItems(nb: number) {
  return generateurAttention
    .construireRefs({ graineBase: 1, nb, difficulte: 2, config: EPREUVES.attention })
    .map((r) => generateurAttention.generer(r));
}

describe('moteur de séance', () => {
  it('déroule une séance complète', () => {
    const items = creerItems(3);
    let s = demarrer(items, 0);
    let t = 0;
    for (let k = 0; k < 3; k++) {
      expect(indexCourant(s)).toBe(k);
      t += 1000;
      s = enregistrerReponse(s, items[k].bonneReponse, t);
      s = avancer(s, t);
    }
    expect(s.fini).toBe(true);
    expect(s.temps).toEqual([1000, 1000, 1000]);
    expect(s.ordre).toEqual([0, 1, 2]);
  });

  it('ne change pas de question tant qu’on n’a pas répondu', () => {
    const s = demarrer(creerItems(2), 0);
    expect(avancer(s, 10)).toBe(s);
  });

  it('ignore une seconde réponse à la même question', () => {
    const items = creerItems(2);
    const s1 = enregistrerReponse(demarrer(items, 0), 0, 100);
    expect(enregistrerReponse(s1, 1, 200)).toBe(s1);
  });

  it('passer renvoie la question en fin de file et elle revient', () => {
    const items = creerItems(3);
    let s = demarrer(items, 0);
    s = passer(s, 500);
    expect(s.file).toEqual([1, 2, 0]);
    expect(s.passes).toBe(1);
    expect(s.temps[0]).toBe(500);
    for (let k = 0; k < 3; k++) {
      s = enregistrerReponse(s, 0, 1000 + k);
      s = avancer(s, 1000 + k);
    }
    expect(s.fini).toBe(true);
    expect(s.ordre).toEqual([1, 2, 0]);
  });

  it('on ne peut pas passer la dernière question restante', () => {
    let s = demarrer(creerItems(1), 0);
    s = passer(s, 10);
    expect(s.file).toEqual([0]);
  });

  it('terminer fige la séance et compte le temps de la question en cours', () => {
    const s = terminer(demarrer(creerItems(5), 0), 4000);
    expect(s.fini).toBe(true);
    expect(s.finMs).toBe(4000);
    expect(s.temps[0]).toBe(4000);
    expect(indexCourant(s)).toBeNull();
  });
});

describe('bilan', () => {
  it('calcule précision, vitesse et score', () => {
    const items = creerItems(10);
    let s = demarrer(items, 0);
    // 8 réponses : 6 justes, 2 fausses
    for (let k = 0; k < 8; k++) {
      const juste = k < 6;
      const choix = juste ? items[k].bonneReponse : 1 - items[k].bonneReponse;
      s = enregistrerReponse(s, choix, (k + 1) * 7500);
      s = avancer(s, (k + 1) * 7500);
    }
    s = terminer(s, 60000);
    const b = calculerBilan(items, s.reponses, s.ordre, 60000, 0.5);
    expect(b.nbRepondues).toBe(8);
    expect(b.nbCorrectes).toBe(6);
    expect(b.nbErreurs).toBe(2);
    expect(b.nbNonRepondues).toBe(2);
    expect(b.precision).toBeCloseTo(0.75);
    expect(b.vitesse).toBeCloseTo(8);
    expect(b.vitesseCorrectes).toBeCloseTo(6);
    expect(b.score).toBeCloseTo(5);
    expect(b.erreurs).toHaveLength(2);
    // Début : 4 réponses toutes justes ; fin : 2 justes sur 4.
    expect(b.precisionDebut).toBe(1);
    expect(b.precisionFin).toBe(0.5);
  });

  it('gère une séance sans réponse', () => {
    const items = creerItems(4);
    const b = calculerBilan(items, items.map(() => null), [], 0);
    expect(b.precision).toBe(0);
    expect(b.vitesse).toBe(0);
    expect(b.precisionDebut).toBeNull();
  });

  it('compare à l’objectif', () => {
    const r = comparerObjectif(
      { precision: 0.9, vitesseCorrectes: 5 },
      { precisionMin: 0.85, correctesParMinute: 7 },
    );
    expect(r).toEqual({ precisionOk: true, vitesseOk: false });
  });
});
