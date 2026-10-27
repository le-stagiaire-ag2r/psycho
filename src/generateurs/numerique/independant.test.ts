import { describe, expect, it } from 'vitest';
import { EPREUVES } from '../../config/epreuves';
import { generateurNumerique } from '../numerique';
import { GABARITS } from './gabarits';

/**
 * Vérification INDÉPENDANTE du numérique.
 *
 * Pour chaque gabarit on ne regarde que ce que le candidat voit : l'énoncé affiché et les
 * propositions affichées. On en extrait les nombres, on recalcule la réponse avec un solveur écrit
 * séparément du générateur (parfois par force brute), puis on vérifie que :
 *   1. la proposition marquée « bonne » est égale à notre résultat ;
 *   2. AUCUNE autre proposition n'est égale à notre résultat.
 * Si le générateur avait une erreur de logique, ce test la verrait.
 */

/** Nombres d'un texte français (« 6,5 », « 22 400 », « 3 h 45 min » → 3, 45). */
function nombres(t: string): number[] {
  const propre = t.replace(/ /g, '').replace(/ /g, ' ');
  return (propre.match(/\d+(?: \d{3})*(?:,\d+)?/g) ?? []).map((x) => Number(x.replace(/ /g, '').replace(',', '.')));
}

/** Valeur d'une proposition affichée (« 27,5 € », « 3/5 », « 22 400 cm² »). */
function valeur(o: string): number {
  const propre = o.replace(/ /g, '').replace(/ /g, ' ').trim();
  const frac = /^(\d+)\/(\d+)/.exec(propre);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const m = /^-?\d+(?: \d{3})*(?:,\d+)?/.exec(propre);
  if (!m) throw new Error(`Proposition illisible : ${o}`);
  return Number(m[0].replace(/ /g, '').replace(',', '.'));
}

const somme = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Un solveur par gabarit : reçoit l'énoncé affiché et les propositions, renvoie la réponse attendue. */
const SOLVEURS: Record<string, (t: string, n: number[], options: string[]) => number> = {
  'poules-lapins': (_t, [tetes, pattes]) => {
    for (let l = 0; l <= tetes; l++) if (2 * (tetes - l) + 4 * l === pattes) return l;
    return NaN;
  },
  'velos-tricycles': (_t, [engins, roues]) => {
    for (let tri = 0; tri <= engins; tri++) if (2 * (engins - tri) + 3 * tri === roues) return tri;
    return NaN;
  },
  'pieces-billets': (_t, [n, , , somme_]) => {
    for (let b = 0; b <= n; b++) if (2 * (n - b) + 5 * b === somme_) return b;
    return NaN;
  },
  'pourcentage-de': (_t, [total, pct]) => (total * pct) / 100,
  remise: (_t, [prix, r]) => prix * (1 - r / 100),
  'hausse-baisse': (_t, [prix, r, r2]) => prix * (1 + r / 100) * (1 - r2 / 100),
  'evolution-pct': (_t, [dep, arr]) => ((arr - dep) / dep) * 100,
  'pourcentage-inverse': (_t, [r, apres]) => apres / (1 + r / 100),
  'remises-successives': (_t, [r1, r2]) => 100 - ((100 - r1) * (100 - r2)) / 100,
  'pourcentage-de-pourcentage': (_t, [total, a, b]) => (((total * a) / 100) * b) / 100,
  // Variante HT → TTC : « Un article est vendu X € hors taxes. » ; variante TTC → HT : « … coûte X € toutes taxes comprises ».
  tva: (t, [x]) => (/est vendu/.test(t) ? x * 1.2 : x / 1.2),
  interets: (_t, [c, taux, ans]) => (c * taux * ans) / 100,
  'fraction-de-quantite': (_t, [total, n, d]) => (total * n) / d,
  'fractions-reste': (_t, [a, b, c, d]) => 1 - a / b - c / d,
  'carburant-successif': (_t, [litres, a1, a2, b1, b2]) => litres * (1 - a1 / a2) * (1 - b1 / b2),
  'plus-grande-fraction': (_t, _n, options) => Math.max(...options.map(valeur)),
  'vitesse-temps': (_t, [v, d]) => (d / v) * 60,
  'distance-duree': (_t, [v, h, m]) => v * (h + m / 60),
  'vitesse-moyenne-ar': (_t, [a, b]) => (2 * a * b) / (a + b),
  'conversion-vitesse': (t, [x]) => (/en mètres par seconde/.test(t) ? x / 3.6 : x * 3.6),
  'duree-horaires': (_t, [h1, m1, h2, m2]) => h2 * 60 + m2 - (h1 * 60 + m1),
  'regle-de-trois-inverse': (_t, [o1, j1, o2]) => (o1 * j1) / o2,
  proportionnalite: (_t, [base, g, cible]) => (g * cible) / base,
  'moyenne-manquante': (_t, nb) => {
    const n = nb[nb.length - 1];
    const moy = nb[nb.length - 2];
    const notes = nb.slice(0, n - 1);
    return moy * n - somme(notes);
  },
  'moyenne-ponderee': (_t, nb) => {
    let s = 0;
    let c = 0;
    for (let i = 0; i + 1 < nb.length; i += 2) {
      s += nb[i] * nb[i + 1];
      c += nb[i + 1];
    }
    return s / c;
  },
  ages: (t, [pere, fils]) => {
    const k = /triple/.test(t) ? 3 : 2;
    for (let x = 0; x <= 100; x++) if (pere + x === k * (fils + x)) return x;
    return NaN;
  },
  'nombre-pense': (_t, [a, b, c]) => {
    for (let x = 0; x <= 1000; x++) if (a * x + b === c) return x;
    return NaN;
  },
  partage: (_t, [total, ...parts]) => (total * Math.max(...parts)) / somme(parts),
  'melange-prix': (_t, [a, x, b, y]) => (a * x + b * y) / (a + b),
  rectangle: (_t, [aire, larg]) => 2 * (aire / larg + larg),
  'triangle-aire': (_t, [b, h]) => (b * h) / 2,
  pythagore: (t, [a, b]) => (/hypoténuse de/.test(t) ? Math.sqrt(a * a - b * b) : Math.sqrt(a * a + b * b)),
  'volume-litres': (_t, [a, b, c]) => (a * b * c) / 1000,
  'conversion-surface': (t, [x]) => (/en cm²/.test(t) ? x * 10000 : x * 100),
  echelle: (_t, [, echelle, cm]) => (cm * echelle) / 100000,
  consommation: (_t, [c, , d]) => (c * d) / 100,
  'travail-ensemble': (_t, [a, b]) => {
    // Force brute : première heure h (par pas de 0,5) où la citerne est pleine.
    for (let h = 0.5; h < 200; h += 0.5) if (Math.abs(h / a + h / b - 1) < 1e-9) return h;
    return NaN;
  },
  'suite-numerique': (t, nb) => {
    // Force brute sur une famille de règles ; la réponse doit être unique.
    const prochains = new Set<number>();
    const colle = (f: (i: number) => number) => nb.every((x, i) => f(i) === x);
    for (let a = 0; a <= 60; a++) {
      for (let d = -12; d <= 12; d++) if (colle((i) => a + i * d)) prochains.add(a + nb.length * d);
      for (const r of [2, 3]) if (colle((i) => a * r ** i)) prochains.add(a * r ** nb.length);
    }
    expect(prochains.size, `suite ambiguë : ${t}`).toBe(1);
    return [...prochains][0];
  },
  priorites: (t) => {
    const expr = t.replace('Calculer :', '').replace(/−/g, '-').replace(/×/g, '*').replace(/(\d+)²/g, '($1**2)').replace(/(\d+) \* (\d+)²/, '$1 * $2**2');
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${expr});`)() as number;
  },
  probabilite: (_t, [r, b]) => r / (r + b),
  'unites-temps': (_t, [h, m]) => h * 60 + m,
  'vitesse-calcul': (_t, [d, h]) => d / h,
  'division-boites': (_t, [N, par]) => N / par,
  'proportion-prix': (_t, [a, prixA, b]) => (prixA / a) * b,
  multiples: (_t, [k, debut, fin]) => {
    let c = 0;
    for (let x = debut; x <= fin; x++) if (x % k === 0) c++;
    return c;
  },
};

describe('numérique : vérification indépendante sur le texte affiché', () => {
  it('chaque gabarit a un solveur indépendant', () => {
    for (const g of GABARITS) expect(SOLVEURS[g.id], `solveur manquant pour ${g.id}`).toBeDefined();
    for (const id of Object.keys(SOLVEURS)) expect(GABARITS.some((g) => g.id === id)).toBe(true);
  });

  it.each(GABARITS.map((g) => [g.id] as const))('%s : la bonne réponse affichée est la seule égale au résultat recalculé', (id) => {
    for (let seed = 1; seed <= 400; seed++) {
      const item = generateurNumerique.generer({
        epreuve: 'numerique',
        version: 1,
        seed,
        difficulte: 3,
        params: { gabarit: id, nbChoix: EPREUVES.numerique.nbChoix },
      });
      const texte = item.stimulus.type === 'texte' ? item.stimulus.enonce : '';
      const attendu = SOLVEURS[id](texte, nombres(texte), item.options);
      expect(Number.isFinite(attendu), `${id} : solveur sans résultat pour « ${texte} »`).toBe(true);

      const valeurs = item.options.map(valeur);
      const egaux = valeurs.map((v, i) => (Math.abs(v - attendu) < 1e-6 ? i : -1)).filter((i) => i >= 0);
      expect(egaux, `${id} : « ${texte} » → attendu ${attendu}, propositions ${item.options.join(' | ')}`).toEqual([item.bonneReponse]);
    }
  });
});
