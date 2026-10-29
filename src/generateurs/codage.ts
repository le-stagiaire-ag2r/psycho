import { MOTS } from '../data/mots';
import { creerPrng, melangerGraines, type Prng } from '../lib/prng';
import type { Difficulte, EntreeCodage, Generateur, Item, ItemRef } from '../lib/types';

/** Version 1 : numéros à 2 ou 3 chiffres, propositions tirées du tableau. Conservée pour rejouer l'historique. */
export const VERSION_CODAGE_V1 = 1;
/** Version 2 : codes à 4 chiffres, tableau de 12 mots visible en permanence, 4 codes très proches (format décrit par les candidats). */
export const VERSION_CODAGE = 2;

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

function genererCodageV1(ref: ItemRef): Item {
  if (ref.version !== VERSION_CODAGE_V1) {
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

  const explication = `Repère la ligne du tableau qui contient la donnée demandée, puis lis l'autre ligne dans la même colonne. Les propositions fausses sont des couples voisins du tableau : vérifie toujours la colonne, pas seulement la proximité.`;
  const pourquoi = idxOptions.map((i) => {
    const e = tableau[i];
    if (i === iCible) {
      return `Dans le tableau, « ${cible.mot} » est associé au n° ${cible.numero} : c'est la bonne colonne.`;
    }
    return sens === 'numero-vers-mot'
      ? `« ${e.mot} » est associé au n° ${e.numero}, pas au n° ${cible.numero}. C'est le mot d'une autre colonne.`
      : `Le n° ${e.numero} est celui de « ${e.mot} », pas de « ${cible.mot} » (n° ${cible.numero}).`;
  });

  const suffixe = params.tableSeed !== undefined ? `-t${tableSeed}` : '';
  return {
    id: `codage-v${ref.version}-d${ref.difficulte}-s${ref.seed}${suffixe}`,
    ref,
    consigne,
    stimulus: { type: 'codage', tableau, sens, cible },
    options,
    bonneReponse,
    explication,
    pourquoi,
  };
}

// ---------------------------------------------------------------------------
// Version 2 : mot affiché, code à 4 chiffres à retrouver parmi 4 codes très proches
// ---------------------------------------------------------------------------

/** Tableau de la version 2 : mots choisis comme avant, codes à 4 chiffres tous différents. */
export function genererTableauV2(tableSeed: number, taille: number, diff: Difficulte): EntreeCodage[] {
  const rng = creerPrng(tableSeed);
  const mots = choisirMots(rng, taille, diff);
  const pris = new Set<number>();
  const codes: number[] = [];
  while (codes.length < taille) {
    const x = rng.entier(1000, 9999);
    if (pris.has(x)) continue;
    pris.add(x);
    codes.push(x);
  }
  return mots.map((mot, i) => ({ mot, numero: codes[i] }));
}

/** Positions (1 à 4) où deux codes diffèrent. */
export function positionsDifferentes(a: string, b: string): number[] {
  return [...a].map((c, i) => (c !== b[i] ? i + 1 : 0)).filter((i) => i > 0);
}

/**
 * Code voisin d'un code : `n` chiffres modifiés (jamais le premier à zéro), ou deux chiffres voisins échangés.
 * Le résultat est toujours différent de la base.
 */
export function codeVoisin(base: string, rng: Prng, n: 1 | 2 | 3, transposition = false): string {
  const c = [...base];
  if (transposition) {
    const choix: number[] = [];
    for (let i = 0; i < 3; i++) if (c[i] !== c[i + 1] && !(i === 0 && c[1] === '0')) choix.push(i);
    if (choix.length > 0) {
      const i = rng.choisir(choix);
      [c[i], c[i + 1]] = [c[i + 1], c[i]];
      return c.join('');
    }
  }
  const positions = rng.melanger([0, 1, 2, 3]).slice(0, n);
  for (const i of positions) {
    const possibles = [...'0123456789'].filter((d) => d !== base[i] && !(i === 0 && d === '0'));
    c[i] = rng.choisir(possibles);
  }
  return c.join('');
}

function genererCodageV2(ref: ItemRef): Item {
  const params = ref.params ?? {};
  const taille = Number(params.taille ?? 12);
  const nbChoix = Number(params.nbChoix ?? 4);
  const tableSeed = Number(params.tableSeed ?? ref.seed);
  const tableau = genererTableauV2(tableSeed, taille, ref.difficulte);
  const rng = creerPrng(ref.seed);
  const cible = tableau[rng.entier(0, tableau.length - 1)];
  const code = String(cible.numero);
  const dejaPris = new Set(tableau.map((e) => String(e.numero)));

  // Difficulté : de plus en plus de codes qui ne diffèrent que par un seul chiffre ou deux chiffres échangés.
  const distracteurs: string[] = [];
  let essais = 0;
  while (distracteurs.length < nbChoix - 1 && essais < 500) {
    essais++;
    const k = distracteurs.length;
    let candidat: string;
    if (ref.difficulte === 1) candidat = codeVoisin(code, rng, rng.chance(0.5) ? 2 : 3);
    else if (ref.difficulte === 2) candidat = k === 0 ? codeVoisin(code, rng, 1) : codeVoisin(code, rng, rng.chance(0.5) ? 1 : 2);
    else candidat = k === 1 ? codeVoisin(code, rng, 1, true) : codeVoisin(code, rng, 1);
    if (candidat === code || dejaPris.has(candidat) || distracteurs.includes(candidat)) continue;
    distracteurs.push(candidat);
  }
  if (distracteurs.length < nbChoix - 1) throw new Error('Impossible de fabriquer assez de codes voisins');

  const options = rng.melanger([code, ...distracteurs]);
  const bonneReponse = options.indexOf(code);
  const explication =
    'Retrouve le mot dans le tableau, lis son code en entier, puis cherche exactement ce code : les mauvaises propositions ne diffèrent que d’un ou deux chiffres.';
  const pourquoi = options.map((o) => {
    if (o === code) return `Juste : dans le tableau, « ${cible.mot} » est associé au code ${code}.`;
    const diff = positionsDifferentes(code, o);
    const detail = diff
      .map((i) => `le chiffre ${i} vaut ${o[i - 1]} au lieu de ${code[i - 1]}`)
      .join(', ');
    return `Faux : ${o} ressemble à ${code}, mais ${detail}. Ce n'est pas le code de « ${cible.mot} ».`;
  });

  const suffixe = params.tableSeed !== undefined ? `-t${tableSeed}` : '';
  return {
    id: `codage-v${ref.version}-d${ref.difficulte}-s${ref.seed}${suffixe}`,
    ref,
    consigne: `Quel est le code du mot « ${cible.mot} » ?`,
    stimulus: { type: 'codage', tableau, sens: 'mot-vers-numero', cible },
    options,
    bonneReponse,
    explication,
    pourquoi,
  };
}

function genererCodage(ref: ItemRef): Item {
  if (ref.version === VERSION_CODAGE_V1) return genererCodageV1(ref);
  if (ref.version === VERSION_CODAGE) return genererCodageV2(ref);
  throw new Error(`Version de générateur non supportée : codage v${ref.version}`);
}

export const generateurCodage: Generateur = {
  version: VERSION_CODAGE,
  generer: genererCodage,
  construireRefs({ graineBase, nb, difficulte, config }) {
    // Comme au vrai test, le tableau reste le même pendant toute la séance (par défaut).
    const groupe = Number(config.parametres.questionsParTableau ?? 1000);
    const taille = Number(config.parametres.tailleTableau ?? 12);
    return Array.from({ length: nb }, (_, i) => ({
      epreuve: 'codage' as const,
      version: VERSION_CODAGE,
      seed: melangerGraines(graineBase, i),
      difficulte,
      params: {
        tableSeed: melangerGraines(graineBase, 7919, Math.floor(i / groupe)),
        taille,
        nbChoix: config.nbChoix,
      },
    }));
  },
};
