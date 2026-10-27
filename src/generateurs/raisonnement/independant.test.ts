import { describe, expect, it } from 'vitest';
import { EPREUVES } from '../../config/epreuves';
import type { Difficulte } from '../../lib/types';
import { generateurRaisonnement } from '../raisonnement';

/**
 * Vérification INDÉPENDANTE du raisonnement général : on lit l'énoncé affiché, on énumère « en avant »
 * un grand nombre de règles plausibles (au lieu d'inférer comme le fait le générateur), et on exige
 * que toutes les règles compatibles avec ce qui est affiché prédisent exactement la réponse attendue.
 */
const DIFFS: Difficulte[] = [1, 2, 3];
const NB = 250;

function items(famille: string, d: Difficulte) {
  const config = { ...EPREUVES.raisonnement, parametres: { familles: famille } };
  return generateurRaisonnement
    .construireRefs({ graineBase: 90210 + d, nb: NB, difficulte: d, config })
    .map((ref) => generateurRaisonnement.generer(ref));
}
const enonceDe = (i: { stimulus: { type: string } }) => (i.stimulus as unknown as { enonce: string }).enonce;

// ---------- Suites de nombres ----------
function reglesNombres(longueur: number): number[][] {
  const res: number[][] = [];
  const ligne = (f: (i: number) => number) => Array.from({ length: longueur }, (_, i) => f(i));
  for (let a = 0; a <= 80; a++) for (let d = -15; d <= 15; d++) res.push(ligne((i) => a + i * d));
  for (let a = 1; a <= 12; a++) for (const r of [2, 3, 4, 5]) res.push(ligne((i) => a * r ** i));
  for (let k = 0; k <= 20; k++) res.push(ligne((i) => (k + i) ** 2));
  for (let k = 0; k <= 8; k++) res.push(ligne((i) => (k + i) ** 3));
  for (let k = 0; k <= 15; k++) res.push(ligne((i) => ((k + i) * (k + i + 1)) / 2));
  for (let a = 0; a <= 80; a++)
    for (let d0 = 0; d0 <= 15; d0++)
      for (let e = -4; e <= 4; e++) {
        const t = [a];
        for (let k = 0; k < longueur - 1; k++) t.push(t[k] + d0 + k * e);
        res.push(t);
      }
  for (let a = 0; a <= 12; a++)
    for (let m = 2; m <= 4; m++)
      for (let c = -3; c <= 3; c++) {
        const t = [a];
        for (let k = 0; k < longueur - 1; k++) t.push(m * t[k] + c);
        res.push(t);
      }
  for (let a = 0; a <= 15; a++)
    for (let b = 0; b <= 15; b++) {
      const t = [a, b];
      for (let k = 2; k < longueur; k++) t.push(t[k - 1] + t[k - 2]);
      res.push(t);
    }
  // Deux suites entrelacées : une règle à 4 paramètres, « confirmée » seulement si les rangs pairs
  // ont au moins 3 termes (sinon elle ajuste n'importe quelle suite de 4 termes) → au moins 6 termes
  // au total en comptant la réponse, soit 5 termes affichés.
  if (longueur >= 6)
    for (let a = 0; a <= 20; a++)
      for (let d = -6; d <= 6; d++)
        for (let b = 0; b <= 50; b++)
          for (let e = -15; e <= 15; e++)
            res.push(ligne((i) => (i % 2 === 0 ? a + (i / 2) * d : b + ((i - 1) / 2) * e)));
  return res;
}
const CACHE_REGLES = new Map<number, number[][]>();

describe('raisonnement : suites de nombres (énumération indépendante)', () => {
  it.each(DIFFS)('toutes les règles compatibles prédisent la réponse affichée (difficulté %i)', (d) => {
    for (const it of items('suite-nombres', d)) {
      const termes = enonceDe(it)
        .replace(/ – \?$/, '')
        .split(' – ')
        .map(Number);
      const n = termes.length;
      if (!CACHE_REGLES.has(n)) CACHE_REGLES.set(n, reglesNombres(n + 1));
      const prochains = new Set<number>();
      for (const r of CACHE_REGLES.get(n)!) if (termes.every((x, i) => x === r[i])) prochains.add(r[n]);
      const cle = Number(it.options[it.bonneReponse]);
      expect([...prochains], `suite ${termes.join(',')} → clé ${cle}`).toEqual([cle]);
      // Aucune autre proposition n'est prédite par une règle compatible.
      for (const [i, o] of it.options.entries()) if (i !== it.bonneReponse) expect(prochains.has(Number(o))).toBe(false);
    }
  });
});

// ---------- Suites de lettres ----------
const idx = (c: string) => c.charCodeAt(0) - 65;
const lettre = (i: number) => String.fromCharCode(65 + (((i % 26) + 26) % 26));

function reglesLettres(longueur: number): number[][] {
  const res: number[][] = [];
  for (let a = 0; a < 26; a++) {
    for (let s = -8; s <= 8; s++) res.push(Array.from({ length: longueur }, (_, i) => a + i * s));
    for (let d0 = -5; d0 <= 8; d0++)
      for (let e = -3; e <= 3; e++) {
        const t = [a];
        for (let k = 0; k < longueur - 1; k++) t.push(t[k] + d0 + k * e);
        res.push(t);
      }
    for (let x = -6; x <= 6; x++)
      for (let y = -6; y <= 6; y++) {
        const t = [a];
        for (let k = 0; k < longueur - 1; k++) t.push(t[k] + (k % 2 === 0 ? x : y));
        res.push(t);
      }
  }
  return res;
}

describe('raisonnement : suites de lettres (énumération indépendante)', () => {
  it.each(DIFFS)('toutes les règles compatibles prédisent la lettre affichée (difficulté %i)', (d) => {
    const cache = new Map<number, number[][]>();
    for (const it of items('suite-lettres', d)) {
      const lettres = enonceDe(it).replace(/ – \?$/, '').split(' – ');
      const n = lettres.length;
      if (!cache.has(n)) cache.set(n, reglesLettres(n + 1));
      const prochains = new Set<string>();
      for (const r of cache.get(n)!) if (lettres.every((c, i) => lettre(r[i]) === c)) prochains.add(lettre(r[n]));
      const cle = it.options[it.bonneReponse];
      expect([...prochains], `suite ${lettres.join(',')} → clé ${cle}`).toEqual([cle]);
      expect(it.options.map((o) => o.length)).toEqual(it.options.map(() => 1));
      void idx;
    }
  });
});

// ---------- Suites de mots ----------
const LISTES: string[][] = [
  ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
  ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  ['Printemps', 'Été', 'Automne', 'Hiver'],
];

describe('raisonnement : suites de mots (énumération indépendante)', () => {
  it.each(DIFFS)('un seul mot suivant possible, quels que soient le pas et le sens (difficulté %i)', (d) => {
    for (const it of items('suite-mots', d)) {
      const mots = enonceDe(it).replace(/ – \?$/, '').split(' – ');
      const prochains = new Set<string>();
      for (const liste of LISTES) {
        if (!mots.every((m) => liste.includes(m))) continue;
        const n = liste.length;
        for (let s = -(n - 1); s <= n - 1; s++) {
          const debut = liste.indexOf(mots[0]);
          const seq = mots.map((_, i) => liste[(((debut + i * s) % n) + n) % n]);
          if (seq.every((m, i) => m === mots[i])) prochains.add(liste[(((debut + mots.length * s) % n) + n) % n]);
        }
      }
      expect([...prochains], `suite ${mots.join(',')}`).toEqual([it.options[it.bonneReponse]]);
    }
  });
});

// ---------- Logique de comparaison ----------
const HAUT = ['grand', 'âgé', 'lourd', 'rapide', 'fort'];
const BAS = ['petit', 'jeune', 'léger', 'lent', 'faible'];

function permutations<T>(l: T[]): T[][] {
  if (l.length <= 1) return [l];
  return l.flatMap((x, i) => permutations([...l.slice(0, i), ...l.slice(i + 1)]).map((p) => [x, ...p]));
}

describe('raisonnement : logique de comparaison (force brute indépendante)', () => {
  it.each(DIFFS)('un seul classement possible et réponse conforme (difficulté %i)', (d) => {
    for (const it of items('transitive', d)) {
      const t = enonceDe(it);
      const phrases = [...t.matchAll(/([A-ZÉ][a-zéèëï]+) est plus ([a-zâéè]+) qu(?:e |')([A-ZÉ][a-zéèëï]+)\./g)];
      expect(phrases.length, t).toBeGreaterThanOrEqual(2);
      // plus[i] est classé AU-DESSUS de moins[i] (ex. « plus grand »).
      const rel: [string, string][] = phrases.map(([, a, adj, b]) => (HAUT.includes(adj) ? [a, b] : [b, a]));
      const noms = [...new Set(rel.flat())];
      const ok = permutations(noms).filter((p) => rel.every(([hi, lo]) => p.indexOf(hi) < p.indexOf(lo)));
      expect(ok.length, t).toBe(1);
      const q = /Qui est (le plus|le deuxième plus) ([a-zâéè]+) \?$/.exec(t)!;
      const adj = q[2];
      const classement = HAUT.includes(adj) ? ok[0] : [...ok[0]].reverse();
      const attendu = q[1] === 'le plus' ? classement[0] : classement[1];
      expect(it.options[it.bonneReponse], t).toBe(attendu);
      expect(it.options[it.bonneReponse]).not.toBe('On ne peut pas savoir');
      expect(BAS.includes(adj) || HAUT.includes(adj)).toBe(true);
    }
  });
});
