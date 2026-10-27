import { MOTS } from '../data/mots';
import { creerPrng, melangerGraines, type Prng } from '../lib/prng';
import type { Difficulte, EntreeCodage, Generateur, Item, ItemRef } from '../lib/types';

export const VERSION_CODAGE = 1;

type Sens = 'numero-vers-mot' | 'mot-vers-numero';

/** Initiale sans accent ('é' → 'e'), pour comparer les mots. */
export function initiale(mot: string): string {
  return mot.normalize('NFD').replace(/[̀-ͯ]/g, '')[0];
}

function lettresTriees(mot: string): string {
  return [...mot].sort().join('');
}

export function sontAnagrammes(a: string, b: string): boolean {
  return a !== b && lettresTriees(a) === lettresTriees(b);
}

/** Score de ressemblance entre deux mots : plus il est haut, plus on risque de les confondre. */
export function similarite(a: string, b: string): number {
  let s = 0;
  if (initiale(a) === initiale(b)) s += 2;
  if (a.length === b.length) s += 1;
  if (a.slice(0, 2) === b.slice(0, 2)) s += 1;
  if (sontAnagrammes(a, b)) s += 3;
  return s;
}

/**
 * Choisit les mots du tableau.
 * - facile : ni initiale commune, ni anagramme ;
 * - moyen : tirage libre (sans anagramme) ;
 * - difficile : on recherche les mots qui se ressemblent (initiale, longueur, début identique).
 */
export function choisirMots(rng: Prng, n: number, diff: Difficulte): string[] {
  const pool = rng.melanger(MOTS);
  const choisis: string[] = [pool[0]];
  const restants = pool.slice(1);
  const nbCibles = diff === 3 ? Math.ceil((2 * n) / 3) : 0;

  while (choisis.length < n && restants.length > 0) {
    let idx = -1;
    if (diff === 3 && choisis.length < nbCibles) {
      // On prend le mot (parmi un échantillon) qui ressemble le plus aux déjà choisis.
      let meilleur = -1;
      const limite = Math.min(restants.length, 40);
      for (let k = 0; k < limite; k++) {
        const score = Math.max(...choisis.map((c) => similarite(restants[k], c)));
        if (score > meilleur) {
          meilleur = score;
          idx = k;
        }
      }
    } else {
      idx = restants.findIndex((m) =>
        choisis.every((c) =>
          diff === 1 ? initiale(m) !== initiale(c) && !sontAnagrammes(m, c) : !sontAnagrammes(m, c),
        ),
      );
    }
    if (idx < 0) break;
    choisis.push(restants[idx]);
    restants.splice(idx, 1);
  }
  if (choisis.length < n) throw new Error(`Impossible de choisir ${n} mots (diff ${diff})`);
  return choisis;
}

function inverserChiffres(x: number): number {
  return Number(String(x).split('').reverse().join(''));
}

/** Numéros uniques : 2 chiffres en facile/moyen, 3 chiffres (avec paires aux chiffres inversés) en difficile. */
export function genererNumeros(rng: Prng, n: number, diff: Difficulte): number[] {
  const [min, max] = diff === 3 ? [100, 999] : [10, 99];
  const pris = new Set<number>();
  const res: number[] = [];
  const ajouter = (x: number): boolean => {
    if (x < min || x > max || pris.has(x)) return false;
    pris.add(x);
    res.push(x);
    return true;
  };
  while (res.length < n) {
    const x = rng.entier(min, max);
    if (!ajouter(x)) continue;
    // Piège : un numéro dont les chiffres sont inversés, présent aussi dans le tableau.
    if (diff === 3 && res.length < n && rng.chance(0.3)) {
      const inv = inverserChiffres(x);
      if (inv !== x) ajouter(inv);
    }
  }
  return res;
}

export function genererTableau(tableSeed: number, taille: number, diff: Difficulte): EntreeCodage[] {
  const rng = creerPrng(tableSeed);
  const mots = choisirMots(rng, taille, diff);
  const numeros = genererNumeros(rng, taille, diff);
  return mots.map((mot, i) => ({ mot, numero: numeros[i] }));
}

/** Indices des couples les plus "tentants" autour de la cible : voisins d'affichage puis numéros proches. */
function ordreDistracteurs(tableau: EntreeCodage[], cible: number): number[] {
  const ordre: number[] = [];
  const ajouter = (i: number) => {
    if (i >= 0 && i < tableau.length && i !== cible && !ordre.includes(i)) ordre.push(i);
  };
  for (const d of [1, 2]) {
    ajouter(cible - d);
    ajouter(cible + d);
  }
  [...tableau.keys()]
    .sort(
      (a, b) =>
        Math.abs(tableau[a].numero - tableau[cible].numero) -
        Math.abs(tableau[b].numero - tableau[cible].numero),
    )
    .forEach(ajouter);
  return ordre;
}

function genererCodage(ref: ItemRef): Item {
  if (ref.version !== VERSION_CODAGE) {
    throw new Error(`Version de générateur non supportée : codage v${ref.version}`);
  }
  const params = ref.params ?? {};
  const sens = (params.sens as Sens | undefined) ?? 'numero-vers-mot';
  const taille = Number(params.taille ?? 12);
  const nbChoix = Number(params.nbChoix ?? 5);
  const tableSeed = Number(params.tableSeed ?? ref.seed);

  const tableau = genererTableau(tableSeed, taille, ref.difficulte);
  const rng = creerPrng(ref.seed);
  const iCible = rng.entier(0, tableau.length - 1);
  const cible = tableau[iCible];

  const idxDistracteurs = ordreDistracteurs(tableau, iCible).slice(0, nbChoix - 1);
  const idxOptions = rng.melanger([iCible, ...idxDistracteurs]);
  const texte = (e: EntreeCodage) => (sens === 'numero-vers-mot' ? e.mot : String(e.numero));
  const options = idxOptions.map((i) => texte(tableau[i]));
  const bonneReponse = idxOptions.indexOf(iCible);

  const consigne =
    sens === 'numero-vers-mot'
      ? `Quel mot correspond au numéro ${cible.numero} ?`
      : `Quel numéro correspond au mot « ${cible.mot} » ?`;

  const pieges = idxDistracteurs
    .map((i) => `${tableau[i].mot} (n° ${tableau[i].numero})`)
    .join(', ');
  const explication = `Dans le tableau, « ${cible.mot} » est associé au n° ${cible.numero}. Les autres propositions sont des couples voisins du tableau, faciles à confondre : ${pieges}.`;

  const suffixe = params.tableSeed !== undefined ? `-t${tableSeed}` : '';
  return {
    id: `codage-v${ref.version}-d${ref.difficulte}-s${ref.seed}${suffixe}`,
    ref,
    consigne,
    stimulus: { type: 'codage', tableau, sens, cible },
    options,
    bonneReponse,
    explication,
  };
}

export const generateurCodage: Generateur = {
  version: VERSION_CODAGE,
  generer: genererCodage,
  construireRefs({ graineBase, nb, difficulte, config }) {
    const groupe = Number(config.parametres.questionsParTableau ?? 15);
    const taille = Number(config.parametres.tailleTableau ?? 12);
    const sens = String(config.parametres.sens ?? 'numero-vers-mot');
    return Array.from({ length: nb }, (_, i) => ({
      epreuve: 'codage' as const,
      version: VERSION_CODAGE,
      seed: melangerGraines(graineBase, i),
      difficulte,
      params: {
        tableSeed: melangerGraines(graineBase, 7919, Math.floor(i / groupe)),
        sens,
        taille,
        nbChoix: config.nbChoix,
      },
    }));
  },
};
