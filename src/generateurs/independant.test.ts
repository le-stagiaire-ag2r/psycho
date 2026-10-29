import { describe, expect, it } from 'vitest';
import { EPREUVES } from '../config/epreuves';
import { ROTATIONS, ROT_AXE_DE_VUE, REPERES, projeter, type M3, type V3 } from '../lib/geometrie3d';
import { creerPrng } from '../lib/prng';
import type { Difficulte, Grille } from '../lib/types';
import { generateurAttention } from './attention';
import { generateurCodage } from './codage';
import { cleVue, creerCube, vue } from './cube';
import { generateurSpatial } from './spatial';
import { cleV, reglesElementaires } from './suiteCubes';

const DIFFS: Difficulte[] = [1, 2, 3];

/** Vérifications indépendantes : on ne se fie qu'à ce qui est affiché, ou à un second chemin de calcul. */

describe('attention : réponse recalculée depuis les séries affichées', () => {
  it.each(DIFFS)('l’intrus désigné est bien la seule série différente (difficulté %i)', (d) => {
    const refs = generateurAttention.construireRefs({ graineBase: 5150 + d, nb: 3000, difficulte: d, config: EPREUVES.attention });
    for (const ref of refs) {
      const it = generateurAttention.generer(ref);
      if (it.stimulus.type !== 'attention-series') throw new Error('stimulus inattendu');
      const { series } = it.stimulus;
      // Second chemin de calcul : on compte combien de fois chaque série apparaît.
      const comptes = new Map<string, number>();
      for (const s of series) comptes.set(s, (comptes.get(s) ?? 0) + 1);
      const solitaires = series.map((s, i) => (comptes.get(s) === 1 ? i : -1)).filter((i) => i >= 0);
      if (comptes.size === 1) {
        expect(it.options[it.bonneReponse]).toBe('Pas d’intrus');
      } else {
        expect(solitaires).toHaveLength(1);
        expect(it.options[it.bonneReponse]).toBe(`Série ${solitaires[0] + 1}`);
      }
    }
  });
});

describe('codage : réponse relue dans le tableau affiché', () => {
  it.each(DIFFS)('on retrouve le bon code à partir du mot demandé et du tableau (difficulté %i)', (d) => {
    const refs = generateurCodage.construireRefs({ graineBase: 4242 + d, nb: 600, difficulte: d, config: EPREUVES.codage });
    for (const ref of refs) {
      const it = generateurCodage.generer(ref);
      if (it.stimulus.type !== 'codage') throw new Error('stimulus inattendu');
      const { tableau } = it.stimulus;
      const mMot = /mot « (.+) » \?/.exec(it.consigne);
      expect(mMot, it.consigne).not.toBeNull();
      const attendu = String(tableau.find((e) => e.mot === mMot![1])?.numero);
      expect(it.options.filter((o) => o === attendu)).toHaveLength(1);
      expect(it.options[it.bonneReponse]).toBe(attendu);
      expect(new Set(tableau.map((e) => e.mot)).size).toBe(tableau.length);
      expect(new Set(tableau.map((e) => e.numero)).size).toBe(tableau.length);
    }
  });
});

// ---------- Grilles ----------
/** Rotation horaire d'un quart de tour, écrite en coordonnées : la case (r, c) va en (c, N−1−r). */
function quartHoraire(g: Grille): Grille {
  const N = g.length;
  const res: Grille = Array.from({ length: N }, () => Array<boolean>(N).fill(false));
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) res[c][N - 1 - r] = g[r][c];
  return res;
}
const cle = (g: Grille) => g.map((l) => l.map((x) => (x ? 1 : 0)).join('')).join('/');

describe('grilles : rotation recalculée en coordonnées, depuis la consigne affichée', () => {
  it.each(DIFFS)('la bonne grille est la seule égale à la rotation demandée (difficulté %i)', (d) => {
    const config = { ...EPREUVES.spatial, parametres: { ...EPREUVES.spatial.parametres, variantes: 'grille' } };
    const refs = generateurSpatial.construireRefs({ graineBase: 1789 + d, nb: 1000, difficulte: d, config });
    for (const ref of refs) {
      const it = generateurSpatial.generer(ref);
      if (it.stimulus.type !== 'grille') throw new Error('stimulus inattendu');
      const m = /de (\d+)° dans le sens (horaire|anti-horaire)/.exec(it.consigne)!;
      const angle = Number(m[1]);
      const quarts = m[2] === 'horaire' ? angle / 90 : (4 - angle / 90) % 4;
      let attendue = it.stimulus.modele;
      for (let k = 0; k < quarts; k++) attendue = quartHoraire(attendue);
      const egales = it.stimulus.propositions.map((p, i) => (cle(p) === cle(attendue) ? i : -1)).filter((i) => i >= 0);
      expect(egales, it.consigne).toEqual([it.bonneReponse]);
    }
  });
  it('un quart de tour horaire envoie le coin haut-gauche en haut-droite, et la première ligne dans la dernière colonne', () => {
    const g: Grille = [
      [true, false, false],
      [false, false, false],
      [false, false, false],
    ];
    expect(quartHoraire(g)[0][2]).toBe(true);
    const h: Grille = [
      [true, true, false],
      [false, false, false],
      [false, false, false],
    ];
    // première ligne (haut → bas dans la dernière colonne)
    const r = quartHoraire(h);
    expect([r[0][2], r[1][2], r[2][2]]).toEqual([true, true, false]);
  });
});

// ---------- Cubes ----------
const mulMM = (a: M3, b: M3): M3 => {
  const col = (j: number) => [b[0][j], b[1][j], b[2][j]];
  const ligne = (i: number) => [0, 1, 2].map((j) => a[i][0] * col(j)[0] + a[i][1] * col(j)[1] + a[i][2] * col(j)[2]) as unknown as V3;
  return [ligne(0), ligne(1), ligne(2)];
};
const transposee = (m: M3): M3 => [
  [m[0][0], m[1][0], m[2][0]],
  [m[0][1], m[1][1], m[2][1]],
  [m[0][2], m[1][2], m[2][2]],
];

describe('cubes : projection isométrique', () => {
  const FACES: { nom: string; e1: V3; e2: V3; normale: V3 }[] = [
    { nom: 'dessus', e1: [2, 0, 0], e2: [0, 2, 0], normale: [0, 0, 1] },
    { nom: 'avant', e1: [2, 0, 0], e2: [0, 0, 2], normale: [0, -1, 0] },
    { nom: 'droite', e1: [0, 2, 0], e2: [0, 0, 2], normale: [1, 0, 0] },
  ];
  it('aucune des trois faces n’est dessinée en miroir (droite = haut × normale, vu de l’extérieur)', () => {
    const o = projeter([0, 0, 0], 1);
    for (const f of FACES) {
      const a = projeter(f.e1, 1);
      const b = projeter(f.e2, 1);
      // Coordonnées SVG (y vers le bas) : « droite » puis « haut » non miroir ⇒ produit vectoriel négatif.
      const croix = (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      expect(croix, f.nom).toBeLessThan(0);
    }
  });
  it('les trois faces dessinées sont bien celles tournées vers l’observateur, les trois autres sont cachées', () => {
    const observateur: V3 = [1, -1, 1];
    const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    for (const f of FACES) expect(dot(f.normale, observateur)).toBeGreaterThan(0);
    for (const n of [[0, 0, -1], [0, 1, 0], [-1, 0, 0]] as V3[]) expect(dot(n, observateur)).toBeLessThan(0);
  });
  it('le repère de symbole de chaque face visible est cohérent avec le dessin (droite = haut × normale)', () => {
    for (const f of FACES) {
      const e = f.nom as 'dessus' | 'avant' | 'droite';
      const { n, haut } = REPERES[e];
      const droite = [haut[1] * n[2] - haut[2] * n[1], haut[2] * n[0] - haut[0] * n[2], haut[0] * n[1] - haut[1] * n[0]];
      // Le dessin place le « droite » du symbole le long de e1.
      const e1 = f.e1.map((x) => x / 2);
      expect(droite.map((x) => x || 0)).toEqual(e1.map((x) => x || 0));
    }
  });
});

describe('cubes : deux chemins de calcul indépendants donnent le même résultat', () => {
  it('la règle « tiers de tour du cube » (états visibles) = vraie rotation 3D du cube (6 faces)', () => {
    const rng = creerPrng(2718);
    const regles = reglesElementaires();
    const plus = regles.find((r) => r.id === 'cube-120-1')!;
    const moins = regles.find((r) => r.id === 'cube-120-(-1)'.replace('(-1)', '-1'))!;
    for (let k = 0; k < 400; k++) {
      const { faces } = creerCube(rng);
      for (const R of ROTATIONS) {
        const v = vue(faces, R);
        // Tourner le cube de R puis de M (3D) doit égaler « appliquer la règle à la vue de R ».
        expect(cleV(plus.f(v))).toBe(cleVue(vue(faces, mulMM(ROT_AXE_DE_VUE, R))));
        expect(cleV(moins.f(v))).toBe(cleVue(vue(faces, mulMM(transposee(ROT_AXE_DE_VUE), R))));
      }
    }
  });

  it('le modèle « deux vues » montre les 6 faces, une seule fois chacune (information complète)', () => {
    const config = { ...EPREUVES.spatial, parametres: { ...EPREUVES.spatial.parametres, variantes: 'vues' } };
    const refs = generateurSpatial.construireRefs({ graineBase: 31337, nb: 400, difficulte: 2, config });
    for (const ref of refs) {
      const it = generateurSpatial.generer(ref);
      if (it.stimulus.type !== 'cube' || it.stimulus.modele.forme !== 'vues') throw new Error('forme inattendue');
      const [v1, v2] = it.stimulus.modele.vues;
      const symboles = [...v1, ...v2].map((f) => f.sym);
      expect(new Set(symboles).size).toBe(6);
    }
  });
});
