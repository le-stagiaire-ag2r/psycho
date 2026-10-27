import { creerPrng, melangerGraines, type Prng } from '../lib/prng';
import { add, egal, formatable, formater, grouperMilliers, q, type Format, type Q } from '../lib/rationnel';
import type { Difficulte, Generateur, Item, ItemRef } from '../lib/types';
import { GABARITS, gabaritParId, type Gabarit, type Piege } from './numerique/gabarits';

export const VERSION_NUMERIQUE = 1;

/** Gabarits disponibles pour une difficulté donnée. */
export function gabaritsPour(diff: Difficulte): Gabarit[] {
  return GABARITS.filter((g) => g.niveau <= diff);
}

/**
 * Complète la liste des distracteurs jusqu'à `nb` valeurs toutes distinctes de la solution
 * et entre elles (après mise en forme), en restant représentables dans le format.
 */
export function completerDistracteurs(
  solution: Q,
  pieges: Piege[],
  format: Format,
  nb: number,
  rng: Prng,
): Piege[] {
  const vus = new Set<string>([formater(solution, format)]);
  const res: Piege[] = [];
  // Une fraction « de quelque chose » reste comprise entre 0 et 1 si la bonne réponse l'est
  // (une probabilité de 3 ou de 7/4 serait absurde et trop facile à éliminer).
  const bornee = format.type === 'fraction' && solution.n > 0 && solution.n <= solution.d;
  const essayer = (pg: Piege): boolean => {
    if (!formatable(pg.valeur, format)) return false;
    // Une réponse négative n'a pas de sens si la bonne réponse ne l'est pas.
    if (pg.valeur.n < 0 && solution.n >= 0) return false;
    if (bornee && (pg.valeur.n <= 0 || pg.valeur.n > pg.valeur.d)) return false;
    const txt = formater(pg.valeur, format);
    if (vus.has(txt)) return false;
    vus.add(txt);
    res.push(pg);
    return true;
  };
  for (const pg of pieges) {
    if (res.length >= nb) break;
    essayer(pg);
  }
  // Compléments « proches de la bonne réponse » si certains pièges ne sont pas utilisables.
  const un: Q = format.type === 'fraction' ? q(1, solution.d * 2) : q(1);
  const dixieme = q(1, 10);
  const candidats: Piege[] = [];
  for (const k of [1, -1, 2, -2, 3, -3, 5, -5, 10, -10]) {
    candidats.push({ valeur: add(solution, mulPetit(un, k)), piege: '' });
    // Les pas d'un dixième n'ont de sens que si la bonne réponse a elle-même une décimale.
    if (format.type === 'decimal' && solution.d !== 1) candidats.push({ valeur: add(solution, mulPetit(dixieme, k)), piege: '' });
  }
  for (const pg of rng.melanger(candidats)) {
    if (res.length >= nb) break;
    essayer(pg);
  }
  return res;
}

function mulPetit(a: Q, k: number): Q {
  return q(a.n * k, a.d);
}

function genererNumerique(ref: ItemRef): Item {
  if (ref.version !== VERSION_NUMERIQUE) {
    throw new Error(`Version de générateur non supportée : numérique v${ref.version}`);
  }
  const params = ref.params ?? {};
  const nbChoix = Number(params.nbChoix ?? 5);
  const rng = creerPrng(ref.seed);

  const gabarit = params.gabarit
    ? gabaritParId(String(params.gabarit))
    : rng.choisir(gabaritsPour(ref.difficulte));
  const t = gabarit.tirer(rng);

  const distracteurs = completerDistracteurs(t.solution, t.pieges, t.format, nbChoix - 1, rng);
  if (distracteurs.length < nbChoix - 1) {
    throw new Error(`Gabarit ${gabarit.id} : pas assez de distracteurs valides`);
  }
  if (!t.verifier()) throw new Error(`Gabarit ${gabarit.id} : vérification indépendante échouée`);

  const toutes = rng.melanger([{ valeur: t.solution, piege: '' }, ...distracteurs]);
  const options = toutes.map((o) => formater(o.valeur, t.format));
  const bonneReponse = toutes.findIndex((o) => egal(o.valeur, t.solution));

  const bonne = formater(t.solution, t.format);
  const pourquoi = toutes.map((o, i) => {
    if (i === bonneReponse) return `Le calcul détaillé aboutit à ${bonne} : c'est la seule proposition qui vérifie l'énoncé.`;
    const opt = options[i];
    return o.piege
      ? `${opt} vient d'une erreur classique : ${o.piege}. Le bon calcul donne ${bonne}.`
      : `${opt} ne correspond à aucun calcul correct de l'énoncé : c'est une valeur proche de la bonne réponse, qui sert à brouiller. Le bon calcul donne ${bonne}.`;
  });

  return {
    id: `numerique-v${ref.version}-d${ref.difficulte}-s${ref.seed}`,
    ref,
    consigne: 'Choisis la bonne réponse.',
    stimulus: { type: 'texte', enonce: virguleFr(t.enonce) },
    options,
    bonneReponse,
    explication: virguleFr(t.explication),
    pourquoi: pourquoi.map(virguleFr),
  };
}

/** Écrit les nombres à la française : décimales avec virgule (1.25 → 1,25) et milliers séparés (22400 → 22 400). */
export function virguleFr(texte: string): string {
  return texte
    .replace(/(\d)\.(\d)/g, '$1,$2')
    .replace(/(?<![\d,.])(\d{4,})(?!\d)/g, (_, n: string) => grouperMilliers(n));
}

export const generateurNumerique: Generateur = {
  version: VERSION_NUMERIQUE,
  generer: genererNumerique,
  construireRefs({ graineBase, nb, difficulte, config }) {
    return Array.from({ length: nb }, (_, i) => ({
      epreuve: 'numerique' as const,
      version: VERSION_NUMERIQUE,
      seed: melangerGraines(graineBase, i),
      difficulte,
      params: { nbChoix: config.nbChoix },
    }));
  },
};
