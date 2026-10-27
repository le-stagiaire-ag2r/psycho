import { SYMBOLES, cleImage } from '../data/symboles';
import {
  EMPLACEMENTS,
  REPERES,
  ROT_AXE_DE_VUE,
  emplacementDe,
  hautApres,
  mulMV,
  quartsDepuis,
  type Emplacement,
  type M3,
} from '../lib/geometrie3d';
import { creerPrng, melangerGraines, type Prng } from '../lib/prng';
import type { Difficulte, FaceCube, Generateur, Item, ItemRef, Vue3 } from '../lib/types';

export const VERSION_SUITE_CUBES = 1;

/**
 * Raisonnement logique : suites de cubes.
 *
 * Un cube est représenté par ses trois faces visibles (dessus, avant, droite).
 * Une règle est une transformation de cette vue, appliquée à l'identique à chaque étape.
 * Les règles qui feraient apparaître des faces cachées sont exclues, ainsi que toute règle qui
 * demanderait de connaître une information absente de l'écran (par exemple « le symbole suivant
 * dans une série » dont l'ordre ne serait jamais montré) : tout ce qui est nécessaire à la
 * déduction est visible. Le « cycle de symboles » est couvert par la permutation circulaire
 * des trois symboles visibles.
 */

export const cleV = (v: Vue3): string => v.map((f) => `${f.sym}:${cleImage(f.sym, f.k, f.mir)}`).join('|');
const copie = (v: Vue3): Vue3 => v.map((f) => ({ ...f })) as Vue3;
const NOM_EMP: Record<Emplacement, string> = { dessus: 'du dessus', avant: 'de devant', droite: 'de droite' };
const NB_SYMBOLES = SYMBOLES.length;

export interface Regle {
  id: string;
  /** Description pour la correction */
  description: string;
  f(v: Vue3): Vue3;
  inverse(v: Vue3): Vue3;
}

function sensRotation(d: number): string {
  return d === 1 ? 'd’un quart de tour dans le sens horaire' : d === 2 ? 'd’un demi-tour' : 'd’un quart de tour dans le sens anti-horaire';
}

function rotSlot(e: Emplacement, d: number): Regle {
  const i = EMPLACEMENTS.indexOf(e);
  const appliquer = (v: Vue3, delta: number): Vue3 => {
    const r = copie(v);
    r[i].k = (((r[i].k + delta) % 4) + 4) % 4;
    return r;
  };
  return {
    id: `rot-${e}-${d}`,
    description: `le symbole de la face ${NOM_EMP[e]} pivote ${sensRotation(d)}`,
    f: (v) => appliquer(v, d),
    inverse: (v) => appliquer(v, -d),
  };
}

function rotAll(d: number): Regle {
  const appliquer = (v: Vue3, delta: number): Vue3 => v.map((f) => ({ ...f, k: (((f.k + delta) % 4) + 4) % 4 })) as Vue3;
  return {
    id: `rot-tous-${d}`,
    description: `les trois symboles pivotent chacun ${sensRotation(d)}`,
    f: (v) => appliquer(v, d),
    inverse: (v) => appliquer(v, -d),
  };
}

function permuter(sens: 1 | -1): Regle {
  const appliquer = (v: Vue3, s: number): Vue3 => (s === 1 ? [v[2], v[0], v[1]] : [v[1], v[2], v[0]]) as Vue3;
  return {
    id: `permuter-${sens}`,
    description:
      sens === 1
        ? 'les symboles se décalent : celui du dessus passe devant, celui de devant passe à droite, celui de droite passe dessus'
        : 'les symboles se décalent : celui du dessus passe à droite, celui de droite passe devant, celui de devant passe dessus',
    f: (v) => appliquer(v, sens),
    inverse: (v) => appliquer(v, -sens),
  };
}

/** Matrice transposée = inverse pour une rotation. */
const transposee = (m: M3): M3 => [
  [m[0][0], m[1][0], m[2][0]],
  [m[0][1], m[1][1], m[2][1]],
  [m[0][2], m[1][2], m[2][2]],
];

function rotationCube(sens: 1 | -1): Regle {
  const appliquer = (v: Vue3, M: M3): Vue3 => {
    const res: Partial<Record<number, FaceCube>> = {};
    EMPLACEMENTS.forEach((e, i) => {
      const n2 = mulMV(M, REPERES[e].n);
      const e2 = emplacementDe(n2);
      if (e2 === null) throw new Error('La rotation autour de l’axe de vue doit conserver les faces visibles');
      res[EMPLACEMENTS.indexOf(e2)] = { ...v[i], k: quartsDepuis(e2, mulMV(M, hautApres(e, v[i].k))) };
    });
    return [res[0]!, res[1]!, res[2]!];
  };
  return {
    id: `cube-120-${sens}`,
    description: `le cube pivote d’un tiers de tour autour de l’axe qui part du coin le plus proche de toi (${sens === 1 ? 'dans un sens' : 'dans l’autre sens'}) : les trois faces visibles se remplacent circulairement et chaque symbole tourne avec sa face`,
    f: (v) => appliquer(v, sens === 1 ? ROT_AXE_DE_VUE : transposee(ROT_AXE_DE_VUE)),
    inverse: (v) => appliquer(v, sens === 1 ? transposee(ROT_AXE_DE_VUE) : ROT_AXE_DE_VUE),
  };
}

function echanger(a: Emplacement, b: Emplacement): Regle {
  const i = EMPLACEMENTS.indexOf(a);
  const j = EMPLACEMENTS.indexOf(b);
  const appliquer = (v: Vue3): Vue3 => {
    const r = copie(v);
    [r[i], r[j]] = [r[j], r[i]];
    return r;
  };
  return {
    id: `echange-${a}-${b}`,
    description: `les symboles des faces ${NOM_EMP[a].replace('du ', '').replace('de ', '')} et ${NOM_EMP[b].replace('du ', '').replace('de ', '')} s’échangent`,
    f: appliquer,
    inverse: appliquer,
  };
}

function composer(a: Regle, b: Regle): Regle {
  return {
    id: `${a.id}+${b.id}`,
    description: `${a.description}, puis ${b.description}`,
    f: (v) => b.f(a.f(v)),
    inverse: (v) => a.inverse(b.inverse(v)),
  };
}

/** Toutes les règles élémentaires de la grammaire. */
export function reglesElementaires(): Regle[] {
  const r: Regle[] = [];
  for (const e of EMPLACEMENTS) for (const d of [1, 2, 3]) r.push(rotSlot(e, d));
  for (const d of [1, 2, 3]) r.push(rotAll(d));
  r.push(permuter(1), permuter(-1));
  r.push(rotationCube(1), rotationCube(-1));
  r.push(echanger('dessus', 'avant'), echanger('dessus', 'droite'), echanger('avant', 'droite'));
  return r;
}

/** Règles de profondeur 1 et 2 (composition de deux règles élémentaires). */
export function reglesProfondeur2(): Regle[] {
  const base = reglesElementaires();
  const res: Regle[] = [...base];
  for (const a of base) for (const b of base) res.push(composer(a, b));
  return res;
}

const REGLES_PROFONDEUR_2 = reglesProfondeur2();

/**
 * Solveur d'unicité : toutes les règles de la grammaire compatibles avec la suite affichée
 * doivent prédire le même cube suivant. Retourne l'ensemble des prédictions distinctes.
 */
export function predictionsCompatibles(regles: readonly Regle[], suite: readonly Vue3[]): Map<string, Vue3> {
  const predictions = new Map<string, Vue3>();
  for (const regle of regles) {
    let compatible = true;
    for (let i = 0; i + 1 < suite.length; i++) {
      if (cleV(regle.f(suite[i])) !== cleV(suite[i + 1])) {
        compatible = false;
        break;
      }
    }
    if (!compatible) continue;
    const suivant = regle.f(suite[suite.length - 1]);
    predictions.set(cleV(suivant), suivant);
  }
  return predictions;
}

// ---------- Génération ----------

function tirerRegle(rng: Prng, diff: Difficulte): Regle {
  const base = reglesElementaires();
  if (diff === 1) {
    const simples = base.filter((r) => !r.id.startsWith('cube-120'));
    return rng.choisir(simples);
  }
  if (diff === 2 && rng.chance(0.5)) return rng.choisir(base);
  // Deux règles élémentaires de familles différentes.
  for (;;) {
    const a = rng.choisir(base);
    const b = rng.choisir(base);
    if (a.id.split('-')[0] !== b.id.split('-')[0]) return composer(a, b);
  }
}

function vueInitiale(rng: Prng): Vue3 {
  const syms = rng.melanger([...SYMBOLES.keys()]).slice(0, 3);
  return syms.map((sym) => ({ sym, k: rng.entier(0, 3), mir: false })) as Vue3;
}

function miroirVue(v: Vue3): Vue3 {
  return v.map((f) => ({ ...f, mir: !f.mir })) as Vue3;
}

interface Candidat {
  vue: Vue3;
  nature: string;
  /** Phrase complète expliquant pourquoi cette proposition est fausse */
  pourquoi: string;
  /** Plus c'est haut, plus le piège est subtil */
  finesse: number;
}

function faussesReponses(rng: Prng, regle: Regle, suite: Vue3[], bonne: Vue3): Candidat[] {
  const dernier = suite[suite.length - 1];
  const c: Candidat[] = [];
  c.push({ vue: dernier, nature: 'le dernier cube répété : la règle n’a pas été appliquée', pourquoi: 'C’est le dernier cube de la suite, recopié tel quel : la règle n’a pas été appliquée une fois de plus, donc rien ne change alors que la suite évolue à chaque étape.', finesse: 1 });
  c.push({ vue: regle.f(bonne), nature: 'la règle appliquée une fois de trop', pourquoi: 'Ce cube est trop avancé : il correspond à la règle appliquée deux fois de suite au dernier cube. Il faut l’appliquer une seule fois.', finesse: 1 });
  c.push({ vue: regle.inverse(dernier), nature: 'la règle appliquée dans le mauvais sens (retour en arrière)', pourquoi: 'La règle est appliquée à l’envers : ce cube fait revenir en arrière dans la suite au lieu de la prolonger (mauvais sens de rotation ou d’échange).', finesse: 2 });
  c.push({ vue: miroirVue(bonne), nature: 'le cube miroir de la bonne réponse', pourquoi: 'C’est le cube miroir de la bonne réponse : les mêmes symboles aux mêmes places, mais chacun est inversé gauche-droite. La règle ne produit jamais d’effet miroir.', finesse: 3 });
  for (let i = 0; i < 3; i++) {
    for (const d of [1, 2, 3]) {
      const v = copie(bonne);
      v[i].k = (v[i].k + d) % 4;
      c.push({
        vue: v,
        nature: `la bonne réponse, mais le symbole de la face ${NOM_EMP[EMPLACEMENTS[i]]} est mal orienté`,
        pourquoi: `Presque bon, mais le symbole de la face ${NOM_EMP[EMPLACEMENTS[i]]} n’a pas la bonne orientation : la règle l’aurait fait tourner autrement. Compare l’orientation des symboles un par un.`,
        finesse: 3,
      });
    }
    const v = copie(bonne);
    v[i].sym = (v[i].sym + rng.entier(1, NB_SYMBOLES - 1)) % NB_SYMBOLES;
    c.push({
      vue: v,
      nature: `la bonne réponse, mais le symbole de la face ${NOM_EMP[EMPLACEMENTS[i]]} est faux`,
      pourquoi: `Le symbole de la face ${NOM_EMP[EMPLACEMENTS[i]]} n’est pas le bon : la règle ne change jamais un symbole en un autre, elle ne fait que les tourner ou les déplacer.`,
      finesse: 2,
    });
  }
  const [i, j] = rng.melanger([0, 1, 2]);
  const v = copie(bonne);
  [v[i], v[j]] = [v[j], v[i]];
  c.push({ vue: v, nature: 'la bonne réponse, avec deux symboles échangés', pourquoi: 'Deux symboles sont intervertis par rapport à la bonne réponse : les bons symboles sont présents, mais pas aux bonnes faces.', finesse: 3 });
  return c;
}

function genererSuite(ref: ItemRef): Item {
  if (ref.version !== VERSION_SUITE_CUBES) {
    throw new Error(`Version de générateur non supportée : suite de cubes v${ref.version}`);
  }
  const params = ref.params ?? {};
  const nbChoix = Number(params.nbChoix ?? 5);
  const nbAffiches = ref.difficulte === 3 ? 4 : 3;
  const rng = creerPrng(ref.seed);

  for (let essai = 0; essai < 2000; essai++) {
    const regle = tirerRegle(rng, ref.difficulte);
    const depart = vueInitiale(rng);
    const suite: Vue3[] = [depart];
    for (let i = 1; i <= nbAffiches; i++) suite.push(regle.f(suite[i - 1]));
    const cles = suite.map(cleV);
    // Chaque étape doit changer quelque chose, et on évite les cycles trop courts.
    if (new Set(cles).size !== cles.length) continue;
    const affiches = suite.slice(0, nbAffiches);
    const bonne = suite[nbAffiches];

    // Unicité : toutes les règles compatibles (profondeur ≤ 2) prédisent le même cube.
    const predictions = predictionsCompatibles(REGLES_PROFONDEUR_2, affiches);
    if (predictions.size !== 1 || !predictions.has(cleV(bonne))) continue;

    // Faux cubes : distincts de la bonne réponse et entre eux ; les plus fins aux niveaux élevés.
    const vus = new Set<string>([cleV(bonne)]);
    const candidats = rng
      .melanger(faussesReponses(rng, regle, affiches, bonne))
      .sort((a, b) => (ref.difficulte === 1 ? a.finesse - b.finesse : ref.difficulte === 3 ? b.finesse - a.finesse : 0));
    const faux: Candidat[] = [];
    for (const c of candidats) {
      const k = cleV(c.vue);
      if (vus.has(k)) continue;
      vus.add(k);
      faux.push(c);
      if (faux.length === nbChoix - 1) break;
    }
    if (faux.length < nbChoix - 1) continue;

    const props = rng.melanger([{ vue: bonne, nature: '', pourquoi: '' }, ...faux]);
    const lettres = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, props.length);
    const idxBonne = props.findIndex((p) => p.nature === '');
    return {
      id: `logique-v${ref.version}-d${ref.difficulte}-s${ref.seed}`,
      ref,
      consigne: 'Quel cube vient ensuite dans la suite ?',
      stimulus: { type: 'suite-cubes', suite: affiches, propositions: props.map((p) => p.vue) },
      options: lettres,
      bonneReponse: idxBonne,
      explication: `La règle : ${regle.description}. Elle s’applique de la même façon à chaque étape : pour la trouver, compare deux cubes qui se suivent, face par face, et vérifie qu’elle marche aussi entre les suivants.`,
      pourquoi: props.map((p) =>
        p.nature
          ? p.pourquoi
          : `C’est le résultat de la règle (${regle.description}) appliquée une fois au dernier cube de la suite, comme entre les cubes précédents.`,
      ),
    };
  }
  throw new Error(`Aucune suite valide trouvée pour la graine ${ref.seed}`);
}

export const generateurLogique: Generateur = {
  version: VERSION_SUITE_CUBES,
  generer: genererSuite,
  construireRefs({ graineBase, nb, difficulte, config }) {
    return Array.from({ length: nb }, (_, i) => ({
      epreuve: 'logique' as const,
      version: VERSION_SUITE_CUBES,
      seed: melangerGraines(graineBase, i),
      difficulte,
      params: { nbChoix: config.nbChoix },
    }));
  },
};
