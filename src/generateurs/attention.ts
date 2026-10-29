import { creerPrng, melangerGraines, type Prng } from '../lib/prng';
import type { Difficulte, Generateur, Item, ItemRef } from '../lib/types';

/** Version 1 : deux suites de lettres, « identiques ou non ». Conservée pour rejouer l'historique. */
export const VERSION_ATTENTION_V1 = 1;
/** Version 2 : plusieurs séries de caractères, trouver l'intrus ou « pas d'intrus » (format décrit par les candidats). */
export const VERSION_ATTENTION = 2;

/** Lettres que l'œil confond facilement. */
const PAIRES_VISUELLES = ['OQ', 'EF', 'MN', 'PR', 'IL', 'CG', 'UV', 'BR', 'HN'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LETTRES_AMBIGUES = [...new Set(PAIRES_VISUELLES.join(''))];

export function partenairesVisuels(lettre: string): string[] {
  const res: string[] = [];
  for (const p of PAIRES_VISUELLES) {
    if (p.includes(lettre)) res.push(p[0] === lettre ? p[1] : p[0]);
  }
  return res;
}

type TypePerturbation = 'transposition' | 'substitution' | 'doublement' | 'omission';

export interface Perturbation {
  resultat: string;
  type: TypePerturbation;
  description: string;
}

interface Candidat extends Perturbation {
  /** Position la plus à gauche touchée (0-indexé) */
  i: number;
  /** Dernière position touchée */
  j: number;
}

const POIDS: Record<Difficulte, Record<TypePerturbation, number>> = {
  1: { substitution: 3, doublement: 2, omission: 2, transposition: 1 },
  2: { substitution: 2, doublement: 2, omission: 2, transposition: 2 },
  3: { substitution: 3, doublement: 1, omission: 1, transposition: 3 },
};

function longueurChaine(rng: Prng, diff: Difficulte): number {
  if (diff === 1) return rng.entier(5, 6);
  if (diff === 2) return rng.entier(6, 7);
  return rng.entier(7, 8);
}

export function genererChaine(rng: Prng, n: number, diff: Difficulte): string {
  let s = '';
  for (let k = 0; k < n; k++) {
    // Plus c'est difficile, plus on met de lettres facilement confondues.
    const ambigue = diff >= 2 && rng.chance(diff === 3 ? 0.6 : 0.4);
    s += ambigue ? rng.choisir(LETTRES_AMBIGUES) : rng.choisir([...ALPHABET]);
  }
  return s;
}

/** Position "au bord" (facile à repérer) ou "au milieu" (difficile) ? */
function estBord(i: number, j: number, n: number): boolean {
  return i === 0 || j >= n - 1;
}
function estMilieu(i: number, j: number, n: number): boolean {
  const debut = Math.floor(n / 3);
  const fin = Math.ceil((2 * n) / 3) - 1;
  return i >= debut && j <= fin + 1 && !estBord(i, j, n);
}

/**
 * Perturbe une chaîne pour qu'elle soit TOUJOURS différente de l'originale.
 * Les transpositions ne portent que sur deux lettres différentes (échanger deux
 * lettres identiques ne changerait rien).
 */
export function perturber(base: string, rng: Prng, diff: Difficulte): Perturbation {
  const n = base.length;
  const cands: Candidat[] = [];

  for (let i = 0; i < n - 1; i++) {
    if (base[i] === base[i + 1]) continue;
    cands.push({
      type: 'transposition',
      i,
      j: i + 1,
      resultat: base.slice(0, i) + base[i + 1] + base[i] + base.slice(i + 2),
      description: `les lettres ${i + 1} et ${i + 2} sont inversées (${base[i]}${base[i + 1]} au lieu de ${base[i + 1]}${base[i]})`,
    });
  }
  for (let i = 0; i < n; i++) {
    for (const r of partenairesVisuels(base[i])) {
      cands.push({
        type: 'substitution',
        i,
        j: i,
        resultat: base.slice(0, i) + r + base.slice(i + 1),
        description: `la lettre ${i + 1} change : ${base[i]} devient ${r} (lettres visuellement proches)`,
      });
    }
    if (diff <= 2) {
      const autres = [...ALPHABET].filter((l) => l !== base[i]);
      const r = rng.choisir(autres);
      cands.push({
        type: 'substitution',
        i,
        j: i,
        resultat: base.slice(0, i) + r + base.slice(i + 1),
        description: `la lettre ${i + 1} change : ${base[i]} devient ${r}`,
      });
    }
    cands.push({
      type: 'doublement',
      i,
      j: i,
      resultat: base.slice(0, i + 1) + base[i] + base.slice(i + 1),
      description: `la lettre ${i + 1} (${base[i]}) est doublée`,
    });
    cands.push({
      type: 'omission',
      i,
      j: i,
      resultat: base.slice(0, i) + base.slice(i + 1),
      description: `la lettre ${i + 1} (${base[i]}) a disparu`,
    });
  }

  // Préférence de position selon la difficulté (repli : toutes les positions).
  let retenus = cands;
  if (diff === 1) retenus = cands.filter((c) => estBord(c.i, c.j, n));
  else if (diff === 3) retenus = cands.filter((c) => estMilieu(c.i, c.j, n));
  if (retenus.length === 0) retenus = cands;

  // Choix du type pondéré, parmi les types réellement disponibles.
  const types = [...new Set(retenus.map((c) => c.type))];
  const total = types.reduce((s, t) => s + POIDS[diff][t], 0);
  let tirage = rng.suivant() * total;
  let type = types[types.length - 1];
  for (const t of types) {
    tirage -= POIDS[diff][t];
    if (tirage < 0) {
      type = t;
      break;
    }
  }
  const choisi = rng.choisir(retenus.filter((c) => c.type === type));

  if (choisi.resultat === base) throw new Error('perturber() a recréé la chaîne d’origine');
  return { resultat: choisi.resultat, type: choisi.type, description: choisi.description };
}

function genererAttentionV1(ref: ItemRef): Item {
  if (ref.version !== VERSION_ATTENTION_V1) {
    throw new Error(`Version de générateur non supportée : attention v${ref.version}`);
  }
  const rng = creerPrng(ref.seed);
  const base = genererChaine(rng, longueurChaine(rng, ref.difficulte), ref.difficulte);
  const identique = rng.chance(0.5);

  let b = base;
  const explication = `Compare toujours lettre par lettre, de gauche à droite, sans te fier à l'allure générale : l'œil « complète » facilement une suite qui ressemble à l'autre.`;
  let pourquoi = [
    `Juste : les deux suites sont exactement les mêmes (${base}). Lettre par lettre, aucune ne change de place ni de forme.`,
    `Faux : aucune différence n'existe, ${base} se retrouve à l'identique dans la seconde suite. Ne cherche pas un défaut qui n'est pas là.`,
  ];
  if (!identique) {
    const p = perturber(base, rng, ref.difficulte);
    b = p.resultat;
    // Dans l'ordre des options : « Identiques » (fausse), puis « Différentes » (juste).
    pourquoi = [
      `Faux : dans la seconde suite, ${p.description}. (${base} / ${b}) Les suites se ressemblent, mais elles ne sont pas identiques.`,
      `Juste : dans la seconde suite, ${p.description}. (${base} / ${b})`,
    ];
  }

  return {
    id: `attention-v${ref.version}-d${ref.difficulte}-s${ref.seed}`,
    ref,
    consigne: 'Les deux suites de lettres sont-elles identiques ?',
    stimulus: { type: 'attention', a: base, b },
    options: ['Identiques', 'Différentes'],
    bonneReponse: identique ? 0 : 1,
    explication,
    pourquoi,
  };
}

// ---------------------------------------------------------------------------
// Version 2 : séries de caractères, un intrus (ou aucun)
// ---------------------------------------------------------------------------

const CHIFFRES = '0123456789';
/** Caractères que l'œil confond facilement, chiffres et lettres compris. */
const PROCHES: string[] = [...PAIRES_VISUELLES, '08', '38', '56', '68', '17', '49', '27', 'O0', 'I1', 'S5', 'B8', 'Z2', 'G6'];

function procheDe(c: string): string[] {
  const res: string[] = [];
  for (const p of PROCHES) if (p.includes(c)) res.push(p[0] === c ? p[1] : p[0]);
  return res;
}

const estChiffre = (c: string): boolean => CHIFFRES.includes(c);

type FamilleCode = 'chiffres' | 'lettres' | 'mixte';

const FAMILLES: Record<Difficulte, [FamilleCode, number][]> = {
  1: [['chiffres', 3], ['lettres', 2]],
  2: [['chiffres', 2], ['lettres', 2], ['mixte', 2]],
  3: [['chiffres', 1], ['lettres', 2], ['mixte', 3]],
};

function tirerFamille(rng: Prng, diff: Difficulte): FamilleCode {
  const liste = FAMILLES[diff];
  const total = liste.reduce((s, [, p]) => s + p, 0);
  let t = rng.suivant() * total;
  for (const [f, p] of liste) {
    t -= p;
    if (t < 0) return f;
  }
  return liste[liste.length - 1][0];
}

export function genererCode(rng: Prng, diff: Difficulte): { code: string; famille: FamilleCode } {
  const n = diff === 1 ? rng.entier(5, 6) : diff === 2 ? rng.entier(6, 7) : rng.entier(7, 8);
  const famille = tirerFamille(rng, diff);
  if (famille === 'lettres') return { code: genererChaine(rng, n, diff), famille };
  if (famille === 'chiffres') {
    let s = String(rng.entier(1, 9));
    while (s.length < n) s += rng.choisir([...CHIFFRES]);
    return { code: s, famille };
  }
  // mixte : au moins un chiffre et une lettre
  let s = '';
  for (let k = 0; k < n; k++) s += rng.chance(0.5) ? rng.choisir([...CHIFFRES]) : rng.choisir([...ALPHABET]);
  if (!/\d/.test(s)) s = rng.choisir([...CHIFFRES]) + s.slice(1);
  if (!/[A-Z]/.test(s)) s = s.slice(0, -1) + rng.choisir([...ALPHABET]);
  return { code: s, famille };
}

/**
 * Altère un code (toujours : le résultat est différent de la base).
 * Transposition de deux caractères différents, substitution par un caractère proche, doublement ou oubli.
 */
export function alterer(base: string, rng: Prng, diff: Difficulte): Perturbation {
  const n = base.length;
  const cands: Candidat[] = [];
  for (let i = 0; i < n - 1; i++) {
    if (base[i] === base[i + 1]) continue;
    cands.push({
      type: 'transposition',
      i,
      j: i + 1,
      resultat: base.slice(0, i) + base[i + 1] + base[i] + base.slice(i + 2),
      description: `les caractères ${i + 1} et ${i + 2} sont inversés (${base[i]}${base[i + 1]} au lieu de ${base[i + 1]}${base[i]})`,
    });
  }
  for (let i = 0; i < n; i++) {
    const proches = procheDe(base[i]);
    for (const r of proches) {
      cands.push({
        type: 'substitution',
        i,
        j: i,
        resultat: base.slice(0, i) + r + base.slice(i + 1),
        description: `le caractère ${i + 1} change : ${base[i]} devient ${r} (deux caractères qui se ressemblent)`,
      });
    }
    if (diff === 1 || proches.length === 0) {
      const pool = estChiffre(base[i]) ? [...CHIFFRES] : [...ALPHABET];
      const r = rng.choisir(pool.filter((c) => c !== base[i]));
      cands.push({
        type: 'substitution',
        i,
        j: i,
        resultat: base.slice(0, i) + r + base.slice(i + 1),
        description: `le caractère ${i + 1} change : ${base[i]} devient ${r}`,
      });
    }
    cands.push({
      type: 'doublement',
      i,
      j: i,
      resultat: base.slice(0, i + 1) + base[i] + base.slice(i + 1),
      description: `le caractère ${i + 1} (${base[i]}) est doublé`,
    });
    cands.push({
      type: 'omission',
      i,
      j: i,
      resultat: base.slice(0, i) + base.slice(i + 1),
      description: `le caractère ${i + 1} (${base[i]}) a disparu`,
    });
  }
  let retenus = cands;
  if (diff === 1) retenus = cands.filter((c) => estBord(c.i, c.j, n));
  else if (diff === 3) retenus = cands.filter((c) => estMilieu(c.i, c.j, n));
  if (retenus.length === 0) retenus = cands;
  const types = [...new Set(retenus.map((c) => c.type))];
  const total = types.reduce((s, t) => s + POIDS[diff][t], 0);
  let tirage = rng.suivant() * total;
  let type = types[types.length - 1];
  for (const t of types) {
    tirage -= POIDS[diff][t];
    if (tirage < 0) {
      type = t;
      break;
    }
  }
  const choisi = rng.choisir(retenus.filter((c) => c.type === type));
  if (choisi.resultat === base) throw new Error('alterer() a recréé le code d’origine');
  return { resultat: choisi.resultat, type: choisi.type, description: choisi.description };
}

/** Probabilité qu'une question ne contienne aucun intrus (« pas d'intrus »). */
export const PROBA_SANS_INTRUS = 0.25;

function genererAttentionV2(ref: ItemRef): Item {
  const rng = creerPrng(ref.seed);
  const nbChoix = Number(ref.params?.nbChoix ?? 4);
  const nbSeries = Math.max(2, nbChoix - 1);
  const { code: base } = genererCode(rng, ref.difficulte);
  const sansIntrus = rng.chance(PROBA_SANS_INTRUS);
  const posIntrus = rng.entier(0, nbSeries - 1);

  const series = Array.from({ length: nbSeries }, () => base);
  let alteration: Perturbation | null = null;
  if (!sansIntrus) {
    alteration = alterer(base, rng, ref.difficulte);
    series[posIntrus] = alteration.resultat;
  }

  const options = [...series.map((_, i) => `Série ${i + 1}`), 'Pas d’intrus'];
  const explication =
    'Balaye les séries du regard sans les lire une à une : une série différente des autres « accroche » l’œil. Si rien n’accroche après un court instant, choisis « Pas d’intrus » et passe.';

  const pourquoi = options.map((_, o) => {
    if (o === nbSeries) {
      return sansIntrus
        ? `Juste : les ${nbSeries} séries sont exactement les mêmes (${base}). Il n'y a pas d'intrus, même si on a l'impression d'en voir un.`
        : `Faux : il y a bien un intrus, la série ${posIntrus + 1} (${series[posIntrus]}) : ${alteration!.description}. Les autres séries valent ${base}.`;
    }
    if (sansIntrus) {
      return `Faux : la série ${o + 1} (${series[o]}) est identique aux autres séries : il n'y a pas d'intrus dans cette question.`;
    }
    if (o === posIntrus) {
      return `Juste : la série ${o + 1} (${series[o]}) est l'intrus : ${alteration!.description}. Les autres séries valent ${base}.`;
    }
    return `Faux : la série ${o + 1} (${series[o]}) est identique aux autres séries (${base}) : l'intrus est la série ${posIntrus + 1}.`;
  });

  return {
    id: `attention-v${ref.version}-d${ref.difficulte}-s${ref.seed}`,
    ref,
    consigne: 'Une de ces séries est-elle différente des autres ?',
    stimulus: { type: 'attention-series', series },
    options,
    bonneReponse: sansIntrus ? nbSeries : posIntrus,
    explication,
    pourquoi,
  };
}

function genererAttention(ref: ItemRef): Item {
  if (ref.version === VERSION_ATTENTION_V1) return genererAttentionV1(ref);
  if (ref.version === VERSION_ATTENTION) return genererAttentionV2(ref);
  throw new Error(`Version de générateur non supportée : attention v${ref.version}`);
}

export const generateurAttention: Generateur = {
  version: VERSION_ATTENTION,
  generer: genererAttention,
  construireRefs({ graineBase, nb, difficulte, config }) {
    return Array.from({ length: nb }, (_, i) => ({
      epreuve: 'attention' as const,
      version: VERSION_ATTENTION,
      seed: melangerGraines(graineBase, i),
      difficulte,
      params: { nbChoix: config.nbChoix },
    }));
  },
};
