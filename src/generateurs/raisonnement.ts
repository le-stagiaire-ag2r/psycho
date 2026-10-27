import { creerPrng, melangerGraines, type Prng } from '../lib/prng';
import { egal } from '../lib/rationnel';
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

interface Fausse {
  texte: string;
  /** Pourquoi cette proposition est fausse */
  raison: string;
}

interface Brut {
  enonce: string;
  consigne: string;
  bonne: string;
  /** Pourquoi la bonne réponse est juste */
  pourquoiBonne: string;
  /** Distracteurs candidats, du plus au moins tentant (on en garde nbChoix − 1) */
  fausses: Fausse[];
  explication: string;
}

const signe = (d: number) => (d >= 0 ? `+${d}` : `−${-d}`);

function distracteursNombres(suite: { termes: number[]; suivant: number }): Fausse[] {
  const { termes, suivant } = suite;
  const n = termes.length;
  const dernier = termes[n - 1];
  const ecartFin = dernier - termes[n - 2];
  const ecartDebut = termes[1] - termes[0];
  const proche = (v: number): string => {
    const d = v - suivant;
    return `${v} est tout proche de la bonne réponse : il vient d'une petite erreur de calcul (${Math.abs(d)} de ${d > 0 ? 'trop' : 'moins'}). La règle de la suite donne exactement ${suivant}.`;
  };
  const candidats: { valeur: number; raison: string }[] = [
    {
      valeur: dernier + ecartFin,
      raison: `${dernier + ecartFin} s'obtient en répétant le dernier écart (${signe(ecartFin)}), comme si la suite avançait toujours du même pas. Ici la règle est différente et donne ${suivant}.`,
    },
    {
      valeur: dernier + ecartDebut,
      raison: `${dernier + ecartDebut} s'obtient en gardant l'écart du début (${signe(ecartDebut)}), alors que la règle change en cours de route. La règle donne ${suivant}.`,
    },
  ];
  if (termes[0] !== 0 && (termes[1] / termes[0]) % 1 === 0) {
    const r = termes[1] / termes[0];
    candidats.push({
      valeur: dernier * r,
      raison: `${dernier * r} s'obtient en multipliant le dernier terme par ${r}, comme entre les deux premiers termes. Ce n'est pas la règle de toute la suite, qui donne ${suivant}.`,
    });
  }
  for (const d of [1, -1, 2, -2]) candidats.push({ valeur: suivant + d, raison: proche(suivant + d) });
  candidats.push({ valeur: suivant * 2, raison: `${suivant * 2} est le double de la bonne réponse : il vient d'un facteur 2 de trop. La règle donne ${suivant}.` });
  candidats.push({ valeur: suivant + 10, raison: proche(suivant + 10) });
  const vus = new Set<number>();
  const res: Fausse[] = [];
  for (const c of candidats) {
    if (c.valeur < 0 || c.valeur === suivant || vus.has(c.valeur)) continue;
    vus.add(c.valeur);
    res.push({ texte: String(c.valeur), raison: c.raison });
  }
  return res;
}

function brutSuiteNombres(rng: Prng, diff: Difficulte): Brut {
  const s = genererSuiteNombres(rng, diff);
  return {
    enonce: `${s.termes.join(' – ')} – ?`,
    consigne: 'Quel est le terme suivant de la suite ?',
    bonne: String(s.suivant),
    pourquoiBonne: `${s.suivant} est le terme qui prolonge la règle, vérifiée sur tous les termes affichés.`,
    fausses: distracteursNombres(s),
    explication: s.explication,
  };
}

function brutSuiteLettres(rng: Prng, diff: Difficulte): Brut {
  const s = genererSuiteLettres(rng, diff);
  const ecarts = [1, -1, 2, -2, 3, -3];
  const fausses = lettresVoisines(s.suivante).map((l, i) => {
    const d = ecarts[i];
    const k = Math.abs(d);
    if (l === s.lettres[s.lettres.length - 1]) {
      return { texte: l, raison: `${l} est la dernière lettre affichée : la règle n'a pas été appliquée une fois de plus, alors que la suite avance à chaque étape.` };
    }
    return {
      texte: l,
      raison: `${l} se trouve ${k} rang${k > 1 ? 's' : ''} ${d > 0 ? 'après' : 'avant'} la bonne réponse (${s.suivante}) dans l'alphabet : c'est une erreur de comptage de ${k} rang${k > 1 ? 's' : ''}.`,
    };
  });
  return {
    enonce: `${s.lettres.join(' – ')} – ?`,
    consigne: 'Quelle est la lettre suivante ?',
    bonne: s.suivante,
    pourquoiBonne: `${s.suivante} est la lettre obtenue en appliquant la règle une fois de plus à la dernière lettre.`,
    fausses,
    explication: s.explication,
  };
}

function brutSuiteMots(rng: Prng, diff: Difficulte): Brut {
  const s = genererSuiteMots(rng, diff);
  const fausses = s.voisins.map((mot, i) => {
    const d = s.ecartsVoisins[i];
    const k = Math.abs(d);
    if (mot === s.mots[s.mots.length - 1]) {
      return { texte: mot, raison: `« ${mot} » est le dernier mot affiché : la règle n'a pas été appliquée une fois de plus, alors que la suite avance à chaque étape.` };
    }
    return {
      texte: mot,
      raison: `« ${mot} » se trouve ${k} rang${k > 1 ? 's' : ''} ${d > 0 ? 'après' : 'avant'} le bon mot (« ${s.suivant} ») dans la liste des ${s.nomListe} : c'est une erreur de comptage de ${k} rang${k > 1 ? 's' : ''}.`,
    };
  });
  return {
    enonce: `${s.mots.join(' – ')} – ?`,
    consigne: 'Quel est le mot suivant ?',
    bonne: s.suivant,
    pourquoiBonne: `« ${s.suivant} » est le mot obtenu en appliquant le même saut de rangs au dernier mot.`,
    fausses,
    explication: s.explication,
  };
}

/** « le plus grand », « le deuxième plus grand », « le plus petit »… selon la place dans le classement. */
function place(rang: number, nb: number, rel: { haut: string; bas: string }): string {
  if (rang === 0) return `le plus ${rel.haut}`;
  if (rang === nb - 1) return `le plus ${rel.bas}`;
  if (rang === 1) return `le deuxième plus ${rel.haut}`;
  return `le deuxième plus ${rel.bas}`;
}

function brutTransitive(rng: Prng, diff: Difficulte, nbChoix: number): Brut {
  const t = genererTransitive(rng, diff);
  const nb = t.classement.length;
  const rangBonne = t.classement.indexOf(t.reponse);
  const cible = place(rangBonne, nb, t.relation);
  const noms = t.personnes.filter((n) => n !== t.reponse);
  const fausses: Fausse[] = noms.map((n) => ({
    texte: n,
    raison: `D'après les comparaisons, ${n} est ${place(t.classement.indexOf(n), nb, t.relation)}, donc ce n'est pas lui qui est ${cible}.`,
  }));
  if (fausses.length < nbChoix - 1) {
    fausses.push({
      texte: 'On ne peut pas savoir',
      raison: `Les comparaisons permettent de reconstituer un seul classement complet (${t.classement.join(' > ')}) : on peut donc répondre avec certitude.`,
    });
  }
  while (fausses.length < nbChoix - 1) {
    const [autre] = autresNoms([...t.personnes, ...fausses.map((f) => f.texte)], rng, 1);
    fausses.push({ texte: autre, raison: `${autre} n'apparaît pas dans l'énoncé : on ne sait rien de lui, ce ne peut pas être la réponse.` });
  }
  return {
    enonce: t.enonce,
    consigne: 'Choisis la bonne réponse.',
    bonne: t.reponse,
    pourquoiBonne: `Le classement reconstitué est ${t.classement.join(' > ')} (du plus ${t.relation.haut} au plus ${t.relation.bas}) : ${t.reponse} est ${cible}.`,
    fausses,
    explication: t.explication,
  };
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
  const fausses: Fausse[] = [];
  for (const f of brut.fausses) {
    if (!vus.has(f.texte)) {
      vus.add(f.texte);
      fausses.push(f);
    }
    if (fausses.length === nbChoix - 1) break;
  }
  if (fausses.length < nbChoix - 1) throw new Error(`Famille ${famille} : pas assez de distracteurs`);

  const toutes = rng.melanger([{ texte: brut.bonne, raison: brut.pourquoiBonne }, ...fausses]);
  return {
    id: `raisonnement-v${ref.version}-d${ref.difficulte}-s${ref.seed}-${famille}`,
    ref,
    consigne: brut.consigne,
    stimulus: { type: 'texte', enonce: brut.enonce },
    options: toutes.map((o) => o.texte),
    bonneReponse: toutes.findIndex((o) => o.texte === brut.bonne),
    explication: brut.explication,
    pourquoi: toutes.map((o) => o.raison),
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
