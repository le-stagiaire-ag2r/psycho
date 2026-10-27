import { creerPrng, melangerGraines, type Prng } from '../lib/prng';
import { add, egal, formatable, formater, q, type Format, type Q } from '../lib/rationnel';
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
  const essayer = (pg: Piege): boolean => {
    if (!formatable(pg.valeur, format)) return false;
    // Une réponse négative n'a pas de sens si la bonne réponse ne l'est pas.
    if (pg.valeur.n < 0 && solution.n >= 0) return false;
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
    if (format.type === 'decimal') candidats.push({ valeur: add(solution, mulPetit(dixieme, k)), piege: '' });
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

  const pieges = toutes
    .filter((o) => o.piege && !egal(o.valeur, t.solution))
    .map((o) => `${formater(o.valeur, t.format)} : ${o.piege}`);
  const explication = pieges.length
    ? `${t.explication} Pièges possibles : ${pieges.join(' ; ')}.`
    : t.explication;

  return {
    id: `numerique-v${ref.version}-d${ref.difficulte}-s${ref.seed}`,
    ref,
    consigne: 'Choisis la bonne réponse.',
    stimulus: { type: 'texte', enonce: virguleFr(t.enonce) },
    options,
    bonneReponse,
    explication: virguleFr(explication),
  };
}

/** Écrit les décimales à la française (1.25 → 1,25). */
export function virguleFr(texte: string): string {
  return texte.replace(/(\d)\.(\d)/g, '$1,$2');
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
