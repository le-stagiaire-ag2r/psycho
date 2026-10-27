import { describe, expect, it } from 'vitest';
import { SYMBOLES, cleImage, imageSymbole } from '../data/symboles';
import {
  EMPLACEMENTS,
  REPERES,
  ROTATIONS,
  ROT_AXE_DE_VUE,
  cross,
  egalV,
  emplacementDe,
  hautApres,
  mulMV,
  quartsDepuis,
  type V3,
} from './geometrie3d';

const det = (m: readonly (readonly number[])[]) =>
  m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
  m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
  m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

describe('rotations du cube', () => {
  it('il y en a exactement 24, toutes propres (déterminant +1)', () => {
    expect(ROTATIONS).toHaveLength(24);
    for (const R of ROTATIONS) expect(det(R)).toBe(1);
  });

  it('chacune envoie les axes sur des axes (entiers)', () => {
    for (const R of ROTATIONS) {
      for (const v of [[1, 0, 0], [0, 1, 0], [0, 0, 1]] as V3[]) {
        const w = mulMV(R, v);
        expect(Math.abs(w[0]) + Math.abs(w[1]) + Math.abs(w[2])).toBe(1);
      }
    }
  });

  it('la rotation autour de l’axe de vue permute circulairement les trois faces visibles', () => {
    const images = EMPLACEMENTS.map((e) => emplacementDe(mulMV(ROT_AXE_DE_VUE, REPERES[e].n)));
    expect(new Set(images).size).toBe(3);
    expect(images.every((e) => e !== null)).toBe(true);
    expect(det(ROT_AXE_DE_VUE)).toBe(1);
  });
});

describe('repères des faces visibles', () => {
  it('droite = haut × normale est bien orientée (dessus : x, avant : x, droite : y)', () => {
    expect(cross(REPERES.dessus.haut, REPERES.dessus.n)).toEqual([1, 0, 0]);
    expect(cross(REPERES.avant.haut, REPERES.avant.n)).toEqual([1, 0, 0]);
    expect(cross(REPERES.droite.haut, REPERES.droite.n)).toEqual([0, 1, 0]);
  });

  it('hautApres et quartsDepuis sont inverses', () => {
    for (const e of EMPLACEMENTS) {
      for (let k = 0; k < 4; k++) expect(quartsDepuis(e, hautApres(e, k))).toBe(k);
      expect(egalV(hautApres(e, 4), hautApres(e, 0))).toBe(true);
    }
  });
});

describe('symboles de faces', () => {
  it('on dispose d’au moins 8 symboles', () => {
    expect(SYMBOLES.length).toBe(8);
  });

  it('chaque symbole a 8 images distinctes (aucune symétrie)', () => {
    for (let s = 0; s < SYMBOLES.length; s++) {
      const images = new Set<string>();
      for (let k = 0; k < 4; k++) for (const m of [false, true]) images.add(cleImage(s, k, m));
      expect(images.size).toBe(8);
    }
  });

  it('deux symboles différents n’ont jamais la même image, quelles que soient rotation et miroir', () => {
    const vu = new Map<string, number>();
    for (let s = 0; s < SYMBOLES.length; s++) {
      for (let k = 0; k < 4; k++) {
        for (const m of [false, true]) {
          const c = cleImage(s, k, m);
          expect(vu.has(c) && vu.get(c) !== s).toBe(false);
          vu.set(c, s);
        }
      }
    }
  });

  it('imageSymbole conserve le nombre de cases noires', () => {
    for (let s = 0; s < SYMBOLES.length; s++) {
      const n = SYMBOLES[s].flat().filter(Boolean).length;
      expect(imageSymbole(s, 3, true).flat().filter(Boolean).length).toBe(n);
    }
  });
});
