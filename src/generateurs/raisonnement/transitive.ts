import type { Prng } from '../../lib/prng';
import type { Difficulte } from '../../lib/types';

/**
 * Logique de comparaison : « Pierre est plus grand que Paul, Paul est plus grand que Jean.
 * Qui est le plus petit ? » La réponse est calculée par un solveur : on énumère tous les
 * classements possibles des personnes et on exige qu'UN SEUL soit compatible avec les énoncés.
 */
const NOMS = ['Pierre', 'Paul', 'Jean', 'Marc', 'Luc', 'Hugo', 'Louis', 'Adam', 'Théo', 'Léo', 'Tom', 'Noé'];

interface Relation {
  /** « plus grand » */
  haut: string;
  /** « plus petit » */
  bas: string;
}
const RELATIONS: Relation[] = [
  { haut: 'grand', bas: 'petit' },
  { haut: 'âgé', bas: 'jeune' },
  { haut: 'lourd', bas: 'léger' },
  { haut: 'rapide', bas: 'lent' },
  { haut: 'fort', bas: 'faible' },
];

/** « que Paul » mais « qu'Adam » : élision devant une voyelle. */
export function que(nom: string): string {
  return /^[AEIOUÉÈÊ]/.test(nom) ? `qu'${nom}` : `que ${nom}`;
}

/** Énoncé élémentaire : `plus` est classé au-dessus de `moins`. */
interface Enonce {
  plus: string;
  moins: string;
}

function* permutations<T>(liste: T[]): Generator<T[]> {
  if (liste.length <= 1) {
    yield liste;
    return;
  }
  for (let i = 0; i < liste.length; i++) {
    const reste = [...liste.slice(0, i), ...liste.slice(i + 1)];
    for (const p of permutations(reste)) yield [liste[i], ...p];
  }
}

/** Classements (du plus haut au plus bas) compatibles avec tous les énoncés. */
export function classementsCompatibles(personnes: string[], enonces: Enonce[]): string[][] {
  const res: string[][] = [];
  for (const p of permutations(personnes)) {
    if (enonces.every((e) => p.indexOf(e.plus) < p.indexOf(e.moins))) res.push(p);
  }
  return res;
}

export interface Transitive {
  enonce: string;
  /** Noms apparaissant dans l'énoncé */
  personnes: string[];
  reponse: string;
  /** Pièges : noms plausibles mais faux */
  explication: string;
}

export function genererTransitive(rng: Prng, diff: Difficulte): Transitive {
  const nb = diff === 3 ? 4 : 3;
  for (let essai = 0; essai < 200; essai++) {
    const personnes = rng.melanger(NOMS).slice(0, nb);
    const rel = rng.choisir(RELATIONS);
    // `ordre` : du plus « haut » (ex. le plus grand) au plus « bas » : c'est la vérité à retrouver.
    const ordre = [...personnes];
    const enonces: Enonce[] = [];
    for (let i = 0; i + 1 < nb; i++) enonces.push({ plus: ordre[i], moins: ordre[i + 1] });
    const phrases = rng.melanger(enonces).map((e) => {
      // Une fois sur deux, on formule la relation à l'envers (« B est plus petit que A »).
      return rng.chance(0.5) ? `${e.plus} est plus ${rel.haut} ${que(e.moins)}.` : `${e.moins} est plus ${rel.bas} ${que(e.plus)}.`;
    });

    // Question : le plus haut, le plus bas, ou (à 4 personnes) le deuxième.
    const types: ('haut' | 'bas' | 'second')[] = nb === 4 ? ['haut', 'bas', 'second'] : ['haut', 'bas'];
    const type = rng.choisir(types);
    const question =
      type === 'haut'
        ? `Qui est le plus ${rel.haut} ?`
        : type === 'bas'
          ? `Qui est le plus ${rel.bas} ?`
          : `Qui est le deuxième plus ${rel.haut} ?`;

    // Unicité : un seul classement compatible, donc une seule réponse.
    const compatibles = classementsCompatibles(personnes, enonces);
    if (compatibles.length !== 1) continue;
    const classement = compatibles[0];
    const reponse = type === 'haut' ? classement[0] : type === 'bas' ? classement[nb - 1] : classement[1];

    const detail = `Classement du plus ${rel.haut} au plus ${rel.bas} : ${classement.join(' > ')}.`;
    return {
      enonce: `${phrases.join(' ')} ${question}`,
      personnes,
      reponse,
      explication: `${detail} Attention au sens des comparaisons : « plus ${rel.bas} » inverse l'ordre de « plus ${rel.haut} ».`,
    };
  }
  throw new Error('Aucune logique de comparaison valide trouvée');
}

export function autresNoms(exclus: string[], rng: Prng, n: number): string[] {
  return rng.melanger(NOMS.filter((x) => !exclus.includes(x))).slice(0, n);
}
