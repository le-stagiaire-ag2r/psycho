import { creerPrng, melangerGraines, type Prng } from '../lib/prng';
import { egal, formater, q, type Q } from '../lib/rationnel';
import type { Difficulte, Generateur, Item, ItemRef } from '../lib/types';
import { genererSuiteLettres, lettresVoisines } from './raisonnement/suitesLettres';
import { genererSuiteMots } from './raisonnement/suitesMots';
import { genererSuiteNombres } from './raisonnement/suitesNombres';
import { autresNoms, genererTransitive } from './raisonnement/transitive';

export const VERSION_RAISONNEMENT = 1;

/**
 * Raisonnement général (épreuve complémentaire) : suites de nombres, de lettres, de mots
 * et logique de comparaison. Chaque famille a son solveur d'unicité (voir `raisonnement/`).
 */
export type FamilleRaisonnement = 'suite-nombres' | 'suite-lettres' | 'suite-mots' | 'transitive';
export const FAMILLES_RAISONNEMENT: FamilleRaisonnement[] = ['suite-nombres', 'suite-lettres', 'suite-mots', 'transitive'];

interface Brut {
  enonce: string;
  consigne: string;
  bonne: string;
  /** Distracteurs candidats, du plus au moins tentant (on en garde nbChoix − 1) */
  fausses: string[];
  explication: string;
}

function distracteursNombres(suite: { termes: number[]; suivant: number }): string[] {
  const { termes, suivant } = suite;
  const n = termes.length;
  const dernier = termes[n - 1];
  const candidats: Q[] = [
    q(dernier + (dernier - termes[n - 2])), // on continue avec le dernier écart
    q(dernier + (termes[1] - termes[0])), // on garde le premier écart
    termes[0] !== 0 && (termes[1] / termes[0]) % 1 === 0 ? q(dernier * (termes[1] / termes[0])) : q(suivant + 1),
    q(suivant + 1),
    q(suivant - 1),
    q(suivant + 2),
    q(suivant - 2),
    q(suivant * 2),
    q(suivant + 10),
  ];
  return [...new Set(candidats.filter((c) => c.n >= 0 && c.n !== suivant).map((c) => formater(c, { type: 'entier' })))];
}

function brutSuiteNombres(rng: Prng, diff: Difficulte): Brut {
  const s = genererSuiteNombres(rng, diff);
  return {
    enonce: `${s.termes.join(' – ')} – ?`,
    consigne: 'Quel est le terme suivant de la suite ?',
    bonne: String(s.suivant),
    fausses: distracteursNombres(s),
    explication: s.explication,
  };
}

function brutSuiteLettres(rng: Prng, diff: Difficulte): Brut {
  const s = genererSuiteLettres(rng, diff);
  return {
    enonce: `${s.lettres.join(' – ')} – ?`,
    consigne: 'Quelle est la lettre suivante ?',
    bonne: s.suivante,
    fausses: lettresVoisines(s.suivante),
    explication: s.explication,
  };
}

function brutSuiteMots(rng: Prng, diff: Difficulte): Brut {
  const s = genererSuiteMots(rng, diff);
  return {
    enonce: `${s.mots.join(' – ')} – ?`,
    consigne: 'Quel est le mot suivant ?',
    bonne: s.suivant,
    fausses: s.voisins,
    explication: s.explication,
  };
}

function brutTransitive(rng: Prng, diff: Difficulte, nbChoix: number): Brut {
  const t = genererTransitive(rng, diff);
  const noms = t.personnes.filter((n) => n !== t.reponse);
  const fausses = [...noms];
  if (fausses.length < nbChoix - 1) fausses.push('On ne peut pas savoir');
  while (fausses.length < nbChoix - 1) fausses.push(...autresNoms([...t.personnes, ...fausses], rng, 1));
  return { enonce: t.enonce, consigne: 'Choisis la bonne réponse.', bonne: t.reponse, fausses, explication: t.explication };
}

function genererRaisonnement(ref: ItemRef): Item {
  if (ref.version !== VERSION_RAISONNEMENT) {
    throw new Error(`Version de générateur non supportée : raisonnement v${ref.version}`);
  }
  const params = ref.params ?? {};
  const nbChoix = Number(params.nbChoix ?? 4);
  const famille = String(params.famille ?? 'suite-nombres') as FamilleRaisonnement;
  const rng = creerPrng(ref.seed);

  const brut =
    famille === 'suite-nombres'
      ? brutSuiteNombres(rng, ref.difficulte)
      : famille === 'suite-lettres'
        ? brutSuiteLettres(rng, ref.difficulte)
        : famille === 'suite-mots'
          ? brutSuiteMots(rng, ref.difficulte)
          : brutTransitive(rng, ref.difficulte, nbChoix);

  // Distracteurs : uniques, différents de la bonne réponse.
  const vus = new Set([brut.bonne]);
  const fausses: string[] = [];
  for (const f of brut.fausses) {
    if (!vus.has(f)) {
      vus.add(f);
      fausses.push(f);
    }
    if (fausses.length === nbChoix - 1) break;
  }
  if (fausses.length < nbChoix - 1) throw new Error(`Famille ${famille} : pas assez de distracteurs`);

  const options = rng.melanger([brut.bonne, ...fausses]);
  return {
    id: `raisonnement-v${ref.version}-d${ref.difficulte}-s${ref.seed}-${famille}`,
    ref,
    consigne: brut.consigne,
    stimulus: { type: 'texte', enonce: brut.enonce },
    options,
    bonneReponse: options.indexOf(brut.bonne),
    explication: `${brut.explication} (Autres propositions : ${fausses.join(', ')}.)`,
  };
}

export const generateurRaisonnement: Generateur = {
  version: VERSION_RAISONNEMENT,
  generer: genererRaisonnement,
  construireRefs({ graineBase, nb, difficulte, config }) {
    const familles = String(config.parametres.familles ?? FAMILLES_RAISONNEMENT.join(',')).split(',') as FamilleRaisonnement[];
    const rng = creerPrng(graineBase);
    // Familles en alternance, dans un ordre mélangé, pour varier les types de questions.
    const ordre = rng.melanger(Array.from({ length: nb }, (_, i) => familles[i % familles.length]));
    return ordre.map((famille, i) => ({
      epreuve: 'raisonnement' as const,
      version: VERSION_RAISONNEMENT,
      seed: melangerGraines(graineBase, i),
      difficulte,
      params: { famille, nbChoix: config.nbChoix },
    }));
  },
};

// Réexport utile aux tests.
export { egal };
