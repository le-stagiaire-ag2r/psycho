import anglaisJson from '../data/anglais.json';
import verbalJson from '../data/verbal.json';
import { creerPrng, melangerGraines } from '../lib/prng';
import type { Difficulte, EpreuveId, Generateur, Item, ItemRef } from '../lib/types';

/**
 * Banques d'items écrits à l'avance (verbal, anglais), stockées en JSON versionné.
 * Chaque item contient la bonne réponse et des fausses réponses ; l'ordre des propositions
 * est tiré au sort à partir de la graine (reproductible).
 *
 * Relecture : chaque item a un champ `relecture` (null tant qu'un humain ne l'a pas relu).
 * Les items rédigés avec l'aide d'une IA doivent passer par une relecture humaine avant
 * d'être considérés comme fiables (voir CONTRIBUTING.md).
 */
export interface ItemBanque {
  id: string;
  type: string;
  niveau: 1 | 2 | 3;
  enonce: string;
  bonne: string;
  /** Pourquoi la bonne réponse est juste */
  pourquoiBonne: string;
  /** Mauvaises réponses, chacune avec la raison pour laquelle elle est fausse */
  fausses: { texte: string; raison: string }[];
  /** « À retenir » : la règle ou le sens, en une phrase */
  explication: string;
  relecture: { par: string; date: string } | null;
}

interface FichierBanque {
  version: number;
  epreuve: string;
  items: ItemBanque[];
}

export const VERSION_BANQUE = 1;

export const BANQUES: Partial<Record<EpreuveId, ItemBanque[]>> = {
  verbal: (verbalJson as FichierBanque).items,
  anglais: (anglaisJson as FichierBanque).items,
};

const CONSIGNES: Partial<Record<EpreuveId, string>> = {
  verbal: 'Choisis la bonne réponse.',
  anglais: 'Choose the correct answer.',
};

function banqueDe(epreuve: EpreuveId): ItemBanque[] {
  const b = BANQUES[epreuve];
  if (!b) throw new Error(`Pas de banque pour l'épreuve « ${epreuve} »`);
  return b;
}

export function itemDepuisBanque(epreuve: EpreuveId, ref: ItemRef): Item {
  if (ref.version !== VERSION_BANQUE) {
    throw new Error(`Version de générateur non supportée : ${epreuve} v${ref.version}`);
  }
  const banque = banqueDe(epreuve);
  const id = String(ref.params?.item ?? '');
  const brut = banque.find((x) => x.id === id);
  if (!brut) throw new Error(`Item inconnu dans la banque ${epreuve} : ${id}`);
  const nbChoix = Number(ref.params?.nbChoix ?? 4);
  const rng = creerPrng(ref.seed);

  // Sous-ensemble de fausses réponses (si la banque en fournit plus que nécessaire), puis mélange.
  const fausses = rng.melanger(brut.fausses).slice(0, nbChoix - 1);
  const toutes = rng.melanger([{ texte: brut.bonne, raison: brut.pourquoiBonne }, ...fausses]);
  const options = toutes.map((o) => o.texte);

  return {
    id: `${epreuve}-v${ref.version}-${brut.id}-s${ref.seed}`,
    ref,
    consigne: CONSIGNES[epreuve] ?? 'Choisis la bonne réponse.',
    stimulus: { type: 'texte', enonce: brut.enonce },
    options,
    bonneReponse: options.indexOf(brut.bonne),
    explication: brut.explication,
    pourquoi: toutes.map((o) => o.raison),
  };
}

/**
 * Tire `nb` items distincts de la banque, ceux du niveau demandé en priorité puis des niveaux
 * voisins. Si la banque est plus petite que la demande, on reboucle sur les mêmes items.
 */
export function creerGenerateurBanque(epreuve: EpreuveId): Generateur {
  return {
    version: VERSION_BANQUE,
    generer: (ref) => itemDepuisBanque(epreuve, ref),
    construireRefs({ graineBase, nb, difficulte, config }) {
      const rng = creerPrng(graineBase);
      const seulementRelus = Number(config.parametres.seulementRelus ?? 0) === 1;
      const disponibles = banqueDe(epreuve).filter((x) => !seulementRelus || x.relecture !== null);
      if (disponibles.length === 0) throw new Error(`Aucun item disponible pour « ${epreuve} »`);
      // Mélange puis tri stable par écart de niveau : à niveau égal, l'ordre reste aléatoire.
      const ordonnes = rng.melanger(disponibles).sort((a, b) => Math.abs(a.niveau - difficulte) - Math.abs(b.niveau - difficulte));
      const choisis = ordonnes.slice(0, nb);
      // On remélange le lot retenu pour ne pas enchaîner tous les items d'un même type.
      const ordre = rng.melanger(choisis);
      return Array.from({ length: nb }, (_, i) => ({
        epreuve,
        version: VERSION_BANQUE,
        seed: melangerGraines(graineBase, i),
        difficulte: difficulte as Difficulte,
        params: { item: ordre[i % ordre.length].id, nbChoix: config.nbChoix },
      }));
    },
  };
}

export const generateurVerbal = creerGenerateurBanque('verbal');
export const generateurAnglais = creerGenerateurBanque('anglais');
