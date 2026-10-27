import type { Prng } from '../../lib/prng';
import { add, div, egal, mul, q, sub, type Format, type Q } from '../../lib/rationnel';
import type { Difficulte } from '../../lib/types';

/**
 * Gabarits d'énoncés de maths niveau 3e.
 *
 * Chaque gabarit : tire des paramètres (résultats entiers ou « ronds »), construit
 * l'énoncé, calcule la solution en rationnels exacts, liste les erreurs classiques
 * (distracteurs) et fournit un `verifier()` qui recalcule la réponse d'une autre façon.
 * Les énoncés sont tous originaux.
 */
export interface Piege {
  valeur: Q;
  /** Erreur de raisonnement que ce distracteur représente (affichée en correction) */
  piege: string;
}

export interface Tirage {
  enonce: string;
  solution: Q;
  pieges: Piege[];
  format: Format;
  explication: string;
  /** Recalcule la solution par un autre chemin : doit retourner true */
  verifier(): boolean;
}

export interface Gabarit {
  id: string;
  theme: string;
  /** Difficulté minimale à laquelle ce gabarit apparaît */
  niveau: Difficulte;
  tirer(rng: Prng): Tirage;
}

const entre = (rng: Prng, a: number, b: number) => rng.entier(a, b);
const eur: Format = { type: 'decimal', unite: '€' };
const entier: Format = { type: 'entier' };

function p(valeur: Q, piege: string): Piege {
  return { valeur, piege };
}

const gabarits: Gabarit[] = [
  {
    id: 'poules-lapins',
    theme: 'Systèmes',
    niveau: 2,
    tirer(rng) {
      const poules = entre(rng, 4, 15);
      const lapins = entre(rng, 3, 14);
      const tetes = poules + lapins;
      const pattes = 2 * poules + 4 * lapins;
      return {
        enonce: `Dans un enclos, il y a des poules et des lapins : on compte ${tetes} têtes et ${pattes} pattes. Combien y a-t-il de lapins ?`,
        solution: q(lapins),
        pieges: [
          p(q(poules), 'le nombre de poules au lieu des lapins'),
          p(q(pattes, 4), 'pattes ÷ 4 (en oubliant les poules)'),
          p(q(tetes, 2), 'têtes ÷ 2'),
          p(q(pattes, 2), 'pattes ÷ 2'),
        ],
        format: entier,
        explication: `Si tous les animaux étaient des poules, il y aurait ${2 * tetes} pattes ; il en manque ${pattes - 2 * tetes}, et chaque lapin en apporte 2 de plus : ${pattes - 2 * tetes} ÷ 2 = ${lapins} lapins.`,
        verifier: () => lapins + poules === tetes && 2 * poules + 4 * lapins === pattes && (pattes - 2 * tetes) / 2 === lapins,
      };
    },
  },
  {
    id: 'velos-tricycles',
    theme: 'Systèmes',
    niveau: 2,
    tirer(rng) {
      const velos = entre(rng, 3, 14);
      const tri = entre(rng, 3, 12);
      const engins = velos + tri;
      const roues = 2 * velos + 3 * tri;
      return {
        enonce: `Devant une école, ${engins} vélos et tricycles sont garés : on compte ${roues} roues en tout. Combien y a-t-il de tricycles ?`,
        solution: q(tri),
        pieges: [
          p(q(velos), 'le nombre de vélos au lieu des tricycles'),
          p(q(roues, 3), 'roues ÷ 3'),
          p(q(roues, 2), 'roues ÷ 2'),
          p(q(roues - engins), 'roues − engins'),
        ],
        format: entier,
        explication: `Avec ${engins} engins à 2 roues, on aurait ${2 * engins} roues ; il en manque ${roues - 2 * engins} et chaque tricycle en ajoute 1 : ${tri} tricycles.`,
        verifier: () => roues - 2 * engins === tri && velos + tri === engins,
      };
    },
  },
  {
    id: 'pieces-billets',
    theme: 'Systèmes',
    niveau: 3,
    tirer(rng) {
      const pieces = entre(rng, 2, 14);
      const billets = entre(rng, 2, 12);
      const n = pieces + billets;
      const somme = 2 * pieces + 5 * billets;
      return {
        enonce: `Une caisse contient ${n} éléments : des pièces de 2 € et des billets de 5 €. Le total est de ${somme} €. Combien y a-t-il de billets de 5 € ?`,
        solution: q(billets),
        pieges: [
          p(q(pieces), 'le nombre de pièces au lieu des billets'),
          p(q(somme, 7), 'total ÷ (2 + 5)'),
          p(q(n, 2), 'moitié des objets'),
          p(q(somme, 5), 'total ÷ 5'),
        ],
        format: entier,
        explication: `Avec ${n} pièces de 2 €, on aurait ${2 * n} € ; il manque ${somme - 2 * n} €, et remplacer une pièce par un billet ajoute 3 € : ${(somme - 2 * n) / 3} billets.`,
        verifier: () => 2 * (n - billets) + 5 * billets === somme,
      };
    },
  },
  {
    id: 'pourcentage-de',
    theme: 'Pourcentages',
    niveau: 1,
    tirer(rng) {
      const pct = rng.choisir([5, 10, 15, 20, 25, 30, 40, 60, 75]);
      const total = entre(rng, 2, 40) * 20;
      const sujet = rng.choisir(['élèves', 'soldats', 'candidats', 'participants']);
      return {
        enonce: `Une salle compte ${total} ${sujet}. ${pct} % d'entre eux portent des lunettes. Combien de ${sujet} portent des lunettes ?`,
        solution: q(pct * total, 100),
        pieges: [
          p(q(total, pct), 'division au lieu d’un pourcentage'),
          p(q((100 - pct) * total, 100), 'le pourcentage complémentaire'),
          p(q(pct * total, 10), 'virgule décalée d’un rang'),
          p(q(pct * total, 1000), 'virgule décalée de trois rangs'),
        ],
        format: entier,
        explication: `${pct} % de ${total} = ${total} × ${pct} ÷ 100 = ${(pct * total) / 100}.`,
        verifier: () => (total * pct) % 100 === 0 && Math.abs((total * pct) / 100 - (total / 100) * pct) < 1e-9,
      };
    },
  },
  {
    id: 'remise',
    theme: 'Pourcentages',
    niveau: 1,
    tirer(rng) {
      const prix = entre(rng, 2, 25) * 20;
      const r = rng.choisir([10, 15, 20, 25, 30, 40]);
      return {
        enonce: `Un article coûte ${prix} €. Pendant les soldes, il bénéficie d'une remise de ${r} %. Quel est son nouveau prix ?`,
        solution: q(prix * (100 - r), 100),
        pieges: [
          p(q(prix - r), `${r} € de remise au lieu de ${r} %`),
          p(q(prix * r, 100), 'le montant de la remise, pas le prix final'),
          p(q(prix * (100 + r), 100), 'une majoration au lieu d’une remise'),
        ],
        format: eur,
        explication: `Remise : ${prix} × ${r} ÷ 100 = ${(prix * r) / 100} €. Prix final : ${prix} − ${(prix * r) / 100} = ${(prix * (100 - r)) / 100} €.`,
        verifier: () => egal(sub(q(prix), mul(q(prix), q(r, 100))), q(prix * (100 - r), 100)),
      };
    },
  },
  {
    id: 'hausse-baisse',
    theme: 'Pourcentages',
    niveau: 2,
    tirer(rng) {
      const prix = rng.choisir([100, 200, 400, 800]);
      const r = rng.choisir([10, 20, 25, 30, 50]);
      const final = q(prix * (100 + r) * (100 - r), 10000);
      return {
        enonce: `Le prix d'un objet à ${prix} € augmente de ${r} %, puis le nouveau prix baisse de ${r} %. Quel est le prix final ?`,
        solution: final,
        pieges: [
          p(q(prix), 'une hausse et une baisse de même taux « s’annulent »'),
          p(q(prix * (100 + r), 100), 'la hausse seulement'),
          p(q(prix * (100 - r), 100), 'la baisse seulement'),
          p(q(prix * (100 - 2 * r), 100), 'la baisse comptée deux fois sur le prix de départ'),
        ],
        format: eur,
        explication: `Après la hausse : ${prix} × ${(100 + r) / 100} = ${(prix * (100 + r)) / 100} €. La baisse s'applique à ce nouveau prix, pas au prix de départ : ${(prix * (100 + r)) / 100} × ${(100 - r) / 100} = ${final.n / final.d} €.`,
        verifier: () => egal(mul(mul(q(prix), q(100 + r, 100)), q(100 - r, 100)), final),
      };
    },
  },
  {
    id: 'evolution-pct',
    theme: 'Pourcentages',
    niveau: 2,
    tirer(rng) {
      const pct = rng.choisir([10, 20, 25, 30, 40, 50]);
      const depart = entre(rng, 2, 20) * 20;
      const arrivee = (depart * (100 + pct)) / 100;
      return {
        enonce: `Le prix d'un abonnement passe de ${depart} € à ${arrivee} €. De quel pourcentage a-t-il augmenté ?`,
        solution: q(pct),
        pieges: [
          p(q(arrivee - depart), 'la différence en euros prise pour un pourcentage'),
          p(q((arrivee - depart) * 100, arrivee), 'rapport à la valeur d’arrivée au lieu du départ'),
          p(q(100 + pct), 'le coefficient multiplicateur (en %)'),
          p(q(pct, 2), 'moitié du bon taux'),
        ],
        format: { type: 'decimal', unite: '%' },
        explication: `Augmentation : ${arrivee} − ${depart} = ${arrivee - depart} €. On la compare au prix de départ : ${arrivee - depart} ÷ ${depart} = ${pct} %.`,
        verifier: () => egal(mul(div(q(arrivee - depart), q(depart)), q(100)), q(pct)),
      };
    },
  },
  {
    id: 'pourcentage-inverse',
    theme: 'Pourcentages',
    niveau: 3,
    tirer(rng) {
      const r = rng.choisir([10, 20, 25, 50]);
      const depart = entre(rng, 2, 25) * 20;
      const apres = (depart * (100 + r)) / 100;
      return {
        enonce: `Après une hausse de ${r} %, un produit coûte ${apres} €. Quel était son prix avant la hausse ?`,
        solution: q(depart),
        pieges: [
          p(q(apres * (100 - r), 100), `une baisse de ${r} % appliquée au prix final`),
          p(q(apres - r), `${r} € retirés au lieu de ${r} %`),
          p(q(apres * r, 100), 'le montant de la hausse seulement'),
          p(q(apres * (100 + r), 100), 'une nouvelle hausse'),
        ],
        format: eur,
        explication: `Avant la hausse, le prix était multiplié par ${(100 + r) / 100}. On divise donc : ${apres} ÷ ${(100 + r) / 100} = ${depart} €.`,
        verifier: () => egal(mul(q(depart), q(100 + r, 100)), q(apres)),
      };
    },
  },
  {
    id: 'remises-successives',
    theme: 'Pourcentages',
    niveau: 3,
    tirer(rng) {
      const [r1, r2] = rng.choisir([
        [10, 20],
        [20, 30],
        [10, 10],
        [50, 20],
        [25, 20],
        [30, 10],
        [20, 20],
        [40, 25],
      ]);
      const total = 100 - ((100 - r1) * (100 - r2)) / 100;
      return {
        enonce: `Un magasin accorde une remise de ${r1} %, puis une seconde remise de ${r2} % sur le prix déjà remisé. Quelle est la remise totale, en pourcentage du prix initial ?`,
        solution: q(total),
        pieges: [
          p(q(r1 + r2), 'additionner les deux taux'),
          p(q(Math.abs(r1 - r2)), 'soustraire les taux'),
          p(q(r1 + r2, 2), 'moyenne des taux'),
        ],
        format: { type: 'decimal', unite: '%' },
        explication: `Coefficient global : ${(100 - r1) / 100} × ${(100 - r2) / 100} = ${((100 - r1) * (100 - r2)) / 10000}. La remise totale vaut 1 − ce coefficient, soit ${total} %.`,
        verifier: () => egal(sub(q(1), mul(q(100 - r1, 100), q(100 - r2, 100))), q(total, 100)),
      };
    },
  },
  {
    id: 'pourcentage-de-pourcentage',
    theme: 'Pourcentages',
    niveau: 3,
    tirer(rng) {
      const a = rng.choisir([10, 20, 25, 40, 50, 60, 75]);
      const b = rng.choisir([10, 20, 25, 40, 50, 60, 75]);
      const total = entre(rng, 1, 10) * 200;
      return {
        enonce: `Dans un groupe de ${total} personnes, ${a} % sont des femmes. Parmi elles, ${b} % ont plus de 30 ans. Combien de femmes ont plus de 30 ans ?`,
        solution: q(total * a * b, 10000),
        pieges: [
          p(q(total * (a + b), 100), 'additionner les pourcentages'),
          p(q(total * a, 100), 'seulement le premier pourcentage'),
          p(q(total * b, 100), 'seulement le second pourcentage'),
          p(q(total * a * b, 100), 'oubli de diviser par 100 une seconde fois'),
        ],
        format: { type: 'decimal' },
        explication: `Femmes : ${total} × ${a} % = ${(total * a) / 100}. Puis ${b} % d'entre elles : ${(total * a) / 100} × ${b} % = ${(total * a * b) / 10000}.`,
        verifier: () => egal(mul(mul(q(total), q(a, 100)), q(b, 100)), q(total * a * b, 10000)),
      };
    },
  },
  {
    id: 'tva',
    theme: 'Pourcentages',
    niveau: 2,
    tirer(rng) {
      const ht = entre(rng, 2, 40) * 5;
      const ttc = (ht * 120) / 100;
      if (rng.chance(0.5)) {
        return {
          enonce: `Un article est vendu ${ht} € hors taxes. Avec une TVA de 20 %, quel est son prix toutes taxes comprises ?`,
          solution: q(ttc),
          pieges: [
            p(q(ht + 20), '20 € de TVA au lieu de 20 %'),
            p(q(ht * 20, 100), 'le montant de la TVA seulement'),
            p(q(ht * 80, 100), 'une baisse de 20 % au lieu d’une hausse'),
            p(q(ht * 112, 100), 'taux de 12 % au lieu de 20 %'),
          ],
          format: eur,
          explication: `Prix TTC = prix HT × 1,20 (TVA à 20 %) = ${ht} × 1,20 = ${ttc} €.`,
          verifier: () => ht + ht / 5 === ttc,
        };
      }
      return {
        enonce: `Un article coûte ${ttc} € toutes taxes comprises (TVA de 20 %). Quel est son prix hors taxes ?`,
        solution: q(ht),
        pieges: [
          p(q(ttc * 80, 100), 'retirer 20 % du prix TTC'),
          p(q(ttc - 20), 'retirer 20 € au lieu de 20 %'),
          p(q(ttc * 20, 100), 'le montant de 20 % du TTC'),
          p(q(ttc * 120, 100), 'rajouter une TVA'),
        ],
        format: eur,
        explication: `Le prix TTC vaut le prix HT × 1,20. Donc HT = ${ttc} ÷ 1,20 = ${ht} €.`,
        verifier: () => egal(mul(q(ht), q(120, 100)), q(ttc)),
      };
    },
  },
  {
    id: 'interets',
    theme: 'Pourcentages',
    niveau: 2,
    tirer(rng) {
      const capital = entre(rng, 5, 40) * 100;
      const taux = rng.choisir([2, 3, 4, 5]);
      const annees = entre(rng, 2, 6);
      return {
        enonce: `On place ${capital} € à intérêts simples au taux annuel de ${taux} % pendant ${annees} ans. Quel est le montant total des intérêts ?`,
        solution: q(capital * taux * annees, 100),
        pieges: [
          p(q(capital * taux, 100), 'intérêts d’une seule année'),
          p(q(capital * (100 + taux * annees), 100), 'capital final au lieu des intérêts'),
          p(q(capital * taux * annees, 10), 'virgule décalée'),
          p(q(capital * taux * (annees - 1), 100), 'une année de moins'),
        ],
        format: eur,
        explication: `Intérêts d'une année : ${capital} × ${taux} % = ${(capital * taux) / 100} €. Sur ${annees} ans : ${(capital * taux) / 100} × ${annees} = ${(capital * taux * annees) / 100} €.`,
        verifier: () => egal(mul(q(capital * taux, 100), q(annees)), q(capital * taux * annees, 100)),
      };
    },
  },
  {
    id: 'fraction-de-quantite',
    theme: 'Fractions',
    niveau: 1,
    tirer(rng) {
      const d = rng.choisir([3, 4, 5, 6, 8]);
      const n = entre(rng, 1, d - 1);
      const total = entre(rng, 2, 15) * d;
      return {
        enonce: `Un stock compte ${total} caisses. Les ${n}/${d} de ces caisses sont expédiées. Combien de caisses sont expédiées ?`,
        solution: q(n * total, d),
        pieges: [
          p(q(total, d), 'oubli de multiplier par le numérateur'),
          p(q(total * n), 'oubli de diviser par le dénominateur'),
          p(q(total - (n * total) / d), 'le nombre de caisses restantes'),
          p(q(total * d, n), 'fraction inversée'),
        ],
        format: entier,
        explication: `${total} ÷ ${d} = ${total / d}, puis × ${n} = ${(n * total) / d}.`,
        verifier: () => (total / d) * n === (n * total) / d,
      };
    },
  },
  {
    id: 'fractions-reste',
    theme: 'Fractions',
    niveau: 2,
    tirer(rng) {
      const [a, b, c, d] = rng.choisir([
        [1, 4, 1, 3],
        [1, 2, 1, 5],
        [2, 5, 1, 4],
        [1, 3, 1, 6],
        [3, 8, 1, 4],
        [1, 6, 1, 4],
      ]);
      const utilise = add(q(a, b), q(c, d));
      const reste = sub(q(1), utilise);
      return {
        enonce: `Pour un chantier, on utilise ${a}/${b} d'un tas de sable le lundi, puis ${c}/${d} du tas initial le mardi. Quelle fraction du tas initial reste-t-il ?`,
        solution: reste,
        pieges: [
          p(utilise, 'la fraction utilisée, pas celle qui reste'),
          p(sub(q(1), q(a + c, b + d)), 'additionner numérateurs et dénominateurs'),
          p(mul(q(b - a, b), q(d - c, d)), 'appliquer la seconde fraction au reste'),
          p(sub(q(1), q(a, b)), 'oublier le mardi'),
        ],
        format: { type: 'fraction' },
        explication: `Utilisé : ${a}/${b} + ${c}/${d} = ${utilise.n}/${utilise.d} (dénominateur commun). Reste : 1 − ${utilise.n}/${utilise.d} = ${reste.n}/${reste.d}.`,
        verifier: () => egal(add(reste, add(q(a, b), q(c, d))), q(1)),
      };
    },
  },
  {
    id: 'carburant-successif',
    theme: 'Fractions',
    niveau: 3,
    tirer(rng) {
      const [a, b] = rng.choisir([
        [q(1, 4), q(1, 3)],
        [q(1, 3), q(1, 2)],
        [q(1, 5), q(1, 4)],
        [q(2, 5), q(1, 3)],
      ]);
      const litres = rng.choisir([60, 120, 180, 240]);
      const sol = mul(mul(q(litres), sub(q(1), a)), sub(q(1), b));
      return {
        enonce: `Un réservoir contient ${litres} litres. Un premier trajet consomme ${a.n}/${a.d} du contenu, puis un second trajet consomme ${b.n}/${b.d} de ce qui restait. Combien de litres reste-t-il ?`,
        solution: sol,
        pieges: [
          p(mul(q(litres), sub(q(1), add(a, b))), 'additionner les deux fractions du contenu initial'),
          p(mul(q(litres), sub(q(1), b)), 'oublier le premier trajet'),
          p(mul(q(litres), add(a, b)), 'les litres consommés au lieu des litres restants'),
          p(mul(mul(q(litres), a), b), 'multiplier les deux fractions consommées'),
        ],
        format: entier,
        explication: `Après le 1er trajet : ${litres} × ${sub(q(1), a).n}/${sub(q(1), a).d} = ${mul(q(litres), sub(q(1), a)).n} L. Le 2e trajet porte sur ce reste : ${mul(q(litres), sub(q(1), a)).n} × ${sub(q(1), b).n}/${sub(q(1), b).d} = ${sol.n} L.`,
        verifier: () => {
          const apres1 = litres - litres * (a.n / a.d);
          return Math.abs(apres1 - apres1 * (b.n / b.d) - sol.n / sol.d) < 1e-9;
        },
      };
    },
  },
  {
    id: 'plus-grande-fraction',
    theme: 'Fractions',
    niveau: 2,
    tirer(rng) {
      const vus: Q[] = [];
      let essais = 0;
      while (vus.length < 5 && essais++ < 200) {
        const d = entre(rng, 3, 12);
        const n = entre(rng, 1, d - 1);
        const f = q(n, d);
        if (!vus.some((v) => v.n * f.d === f.n * v.d) && !(f.d === 1)) vus.push(f);
      }
      const max = vus.reduce((m, v) => (v.n * m.d > m.n * v.d ? v : m));
      return {
        enonce: 'Parmi les fractions proposées, laquelle est la plus grande ?',
        solution: max,
        pieges: vus.filter((v) => v !== max).map((v) => p(v, '')),
        format: { type: 'fraction' },
        explication: `Mets toutes les fractions au même dénominateur (ou compare-les à 1/2). La plus grande est ${max.n}/${max.d} ≈ ${(max.n / max.d).toFixed(2).replace('.', ',')}.`,
        verifier: () => vus.every((v) => v === max || v.n * max.d < max.n * v.d),
      };
    },
  },
  {
    id: 'vitesse-temps',
    theme: 'Vitesse',
    niveau: 1,
    tirer(rng) {
      let v = 60;
      let minutes = 90;
      for (let i = 0; i < 100; i++) {
        v = rng.choisir([30, 40, 45, 50, 75, 80, 90, 120]);
        minutes = rng.choisir([20, 30, 40, 45, 50, 75, 80, 90, 100, 105, 120, 135]);
        if ((v * minutes) % 60 === 0) break;
      }
      const d = (v * minutes) / 60;
      return {
        enonce: `Un convoi roule à ${v} km/h. Combien de minutes lui faut-il pour parcourir ${d} km ?`,
        solution: q(minutes),
        pieges: [
          p(q(d * 100, v), 'durée convertie en base 100 (1,5 h devient « 150 min »)'),
          p(q(d, v), 'la durée en heures prise pour des minutes'),
          p(q(d * v, 60), 'distance × vitesse'),
        ],
        format: { type: 'entier', unite: 'min' },
        explication: `Durée = distance ÷ vitesse = ${d} ÷ ${v} h. En minutes : ${d} ÷ ${v} × 60 = ${minutes} min.`,
        verifier: () => (minutes / 60) * v === d,
      };
    },
  },
  {
    id: 'distance-duree',
    theme: 'Vitesse',
    niveau: 1,
    tirer(rng) {
      const v = entre(rng, 5, 30) * 4;
      const [h, m] = rng.choisir([
        [1, 30],
        [2, 15],
        [2, 30],
        [3, 45],
        [0, 45],
        [1, 45],
      ]);
      const d = (v * (h * 60 + m)) / 60;
      return {
        enonce: `Un véhicule roule à ${v} km/h pendant ${h} h ${String(m).padStart(2, '0')} min. Quelle distance parcourt-il ?`,
        solution: q(d),
        pieges: [
          p(q(v * (h * 100 + m), 100), 'minutes converties en base 100'),
          p(q(v * h), 'les minutes oubliées'),
          p(q(v * (h * 60 + m)), 'la durée en minutes sans diviser par 60'),
          p(q(v * (h + m), 60), 'heures et minutes additionnées avant de convertir'),
        ],
        format: { type: 'decimal', unite: 'km' },
        explication: `${h} h ${m} min = ${h * 60 + m} min = ${(h * 60 + m) / 60} h. Distance = ${v} × ${(h * 60 + m) / 60} = ${d} km.`,
        verifier: () => Math.abs((v * (h * 60 + m)) / 60 - d) < 1e-9,
      };
    },
  },
  {
    id: 'vitesse-moyenne-ar',
    theme: 'Vitesse',
    niveau: 3,
    tirer(rng) {
      const [a, b] = rng.choisir([
        [60, 90],
        [40, 60],
        [30, 70],
        [20, 30],
        [60, 120],
        [50, 75],
        [45, 90],
        [30, 60],
        [80, 120],
        [40, 120],
      ]);
      const moy = (2 * a * b) / (a + b);
      return {
        enonce: `Un camion fait l'aller à ${a} km/h et le retour, sur le même trajet, à ${b} km/h. Quelle est sa vitesse moyenne sur l'ensemble de l'aller-retour ?`,
        solution: q(moy),
        pieges: [
          p(q(a + b, 2), 'moyenne simple des deux vitesses'),
          p(q(a * b, a + b), 'moitié de la bonne valeur'),
          p(q(a + b), 'somme des vitesses'),
          p(q(Math.abs(a - b)), 'différence des vitesses'),
        ],
        format: { type: 'decimal', unite: 'km/h' },
        explication: `Pour une distance d à l'aller et au retour, le temps total est d/${a} + d/${b}. Vitesse moyenne = 2d ÷ temps total = 2 × ${a} × ${b} ÷ (${a} + ${b}) = ${moy} km/h (et non la moyenne simple).`,
        verifier: () => {
          const d = a * b; // distance quelconque multiple des deux vitesses
          return Math.abs((2 * d) / (d / a + d / b) - moy) < 1e-9;
        },
      };
    },
  },
  {
    id: 'conversion-vitesse',
    theme: 'Vitesse',
    niveau: 2,
    tirer(rng) {
      if (rng.chance(0.5)) {
        const k = entre(rng, 2, 8);
        const v = 18 * k;
        return {
          enonce: `Convertir ${v} km/h en mètres par seconde.`,
          solution: q(5 * k),
          pieges: [
            p(q(v * 36, 10), 'multiplier par 3,6 au lieu de diviser'),
            p(q(v, 6), 'diviser par 6'),
            p(q(v, 60), 'diviser par 60'),
            p(q(v, 100), 'diviser par 100'),
          ],
          format: { type: 'entier', unite: 'm/s' },
          explication: `1 km/h = 1000 m ÷ 3600 s = 1 ÷ 3,6 m/s. Donc ${v} ÷ 3,6 = ${5 * k} m/s.`,
          verifier: () => (v * 1000) / 3600 === 5 * k,
        };
      }
      const w = entre(rng, 2, 40);
      return {
        enonce: `Convertir ${w} m/s en kilomètres par heure.`,
        solution: q(w * 36, 10),
        pieges: [
          p(q(w * 10, 36), 'diviser par 3,6 au lieu de multiplier'),
          p(q(w * 6), 'multiplier par 6'),
          p(q(w * 60), 'multiplier par 60'),
          p(q(w * 360, 10), 'multiplier par 36'),
        ],
        format: { type: 'decimal', unite: 'km/h' },
        explication: `En 1 heure (3600 s) on parcourt ${w} × 3600 m = ${(w * 3600) / 1000} km. Soit ${w} × 3,6 = ${(w * 36) / 10} km/h.`,
        verifier: () => (w * 3600) / 1000 === (w * 36) / 10,
      };
    },
  },
  {
    id: 'duree-horaires',
    theme: 'Temps',
    niveau: 1,
    tirer(rng) {
      let h1 = 8;
      let m1 = 15;
      let h2 = 10;
      let m2 = 5;
      do {
        h1 = entre(rng, 6, 15);
        m1 = entre(rng, 1, 11) * 5;
        h2 = h1 + entre(rng, 1, 5);
        m2 = entre(rng, 0, 11) * 5;
      } while (m2 >= m1 || h2 * 60 + m2 - (h1 * 60 + m1) <= 30);
      const fmt = (h: number, m: number) => `${h} h ${String(m).padStart(2, '0')}`;
      const minutes = h2 * 60 + m2 - (h1 * 60 + m1);
      return {
        enonce: `Un train part à ${fmt(h1, m1)} et arrive à ${fmt(h2, m2)}. Quelle est la durée du trajet, en minutes ?`,
        solution: q(minutes),
        pieges: [
          p(q(h2 * 100 + m2 - (h1 * 100 + m1)), 'calcul en base 100'),
          p(q((h2 - h1) * 60 + (m1 - m2)), 'écart des minutes pris dans le mauvais sens'),
          p(q((h2 - h1) * 60 + (m2 - m1) + 60), 'une heure de trop'),
          p(q((h2 - h1) * 60 + m2 + m1), 'minutes additionnées'),
        ],
        format: { type: 'entier', unite: 'min' },
        explication: `De ${fmt(h1, m1)} à ${h1 + 1} h 00 : ${60 - m1} min ; puis ${h2 - h1 - 1} h (${(h2 - h1 - 1) * 60} min) jusqu'à ${h2} h 00 ; puis ${m2} min jusqu'à ${fmt(h2, m2)}. Total : ${60 - m1} + ${(h2 - h1 - 1) * 60} + ${m2} = ${minutes} min.`,
        verifier: () => (h2 - h1) * 60 - (m1 - m2) === minutes,
      };
    },
  },
  {
    id: 'regle-de-trois-inverse',
    theme: 'Proportionnalité',
    niveau: 2,
    tirer(rng) {
      const produit = rng.choisir([24, 36, 48, 60, 72, 90, 120]);
      const diviseurs = [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30].filter((x) => produit % x === 0);
      const o1 = rng.choisir(diviseurs);
      const o2 = rng.choisir(diviseurs.filter((x) => x !== o1));
      const j1 = produit / o1;
      const j2 = produit / o2;
      return {
        enonce: `${o1} ouvriers terminent un chantier en ${j1} jours. En combien de jours ${o2} ouvriers, travaillant au même rythme, le termineront-ils ?`,
        solution: q(j2),
        pieges: [
          p(q(j1 * o2, o1), 'proportionnalité directe au lieu d’inverse'),
          p(q(j1 + (o1 - o2)), 'raisonnement additif'),
          p(q(produit), 'le nombre de « jours-ouvriers » total'),
        ],
        format: { type: 'decimal', unite: 'jour|jours' },
        explication: `Plus il y a d'ouvriers, moins il faut de jours : le produit reste constant. ${o1} × ${j1} = ${produit} jours-ouvriers, donc ${produit} ÷ ${o2} = ${j2} jours.`,
        verifier: () => o2 * j2 === o1 * j1,
      };
    },
  },
  {
    id: 'proportionnalite',
    theme: 'Proportionnalité',
    niveau: 1,
    tirer(rng) {
      const base = rng.choisir([2, 4, 5, 6, 8]);
      const grammes = entre(rng, 1, 6) * base * 25;
      const cible = rng.choisir([2, 3, 4, 5, 6, 8, 10, 12].filter((x) => x !== base));
      const sol = (grammes * cible) / base;
      return {
        enonce: `Une recette pour ${base} personnes demande ${grammes} g de farine. Quelle quantité de farine faut-il pour ${cible} personnes ?`,
        solution: q(sol),
        pieges: [
          p(q(grammes + (cible - base)), 'raisonnement additif'),
          p(q(grammes * base, cible), 'proportionnalité inversée'),
          p(q(grammes, base), 'la quantité pour une seule personne'),
          p(q(grammes * cible), 'oubli de diviser par le nombre de personnes initial'),
        ],
        format: { type: 'entier', unite: 'g' },
        explication: `Pour 1 personne : ${grammes} ÷ ${base} = ${grammes / base} g. Pour ${cible} personnes : ${grammes / base} × ${cible} = ${sol} g.`,
        verifier: () => sol * base === grammes * cible,
      };
    },
  },
  {
    id: 'moyenne-manquante',
    theme: 'Moyennes',
    niveau: 2,
    tirer(rng) {
      for (let essai = 0; ; essai++) {
        const n = entre(rng, 3, 5);
        const moy = entre(rng, 10, 16);
        const notes = Array.from({ length: n - 1 }, () => entre(rng, 5, 19));
        const somme = notes.reduce((a, b) => a + b, 0);
        const x = moy * n - somme;
        if (x < 0 || x > 20 || (x === moy && essai < 50)) continue;
        return {
          enonce: `Un candidat a obtenu ${notes.join(', ')} aux ${n - 1} premières épreuves. Quelle note doit-il obtenir à la dernière épreuve pour avoir une moyenne de ${moy} sur les ${n} épreuves (même coefficient) ?`,
          solution: q(x),
          pieges: [
            p(q(moy), 'la moyenne visée prise pour la note manquante'),
            p(q(somme, n - 1), 'la moyenne des notes déjà obtenues'),
            p(q(moy * (n - 1) - somme), 'moyenne × (n − 1) au lieu de × n'),
          ],
          format: entier,
          explication: `Total nécessaire : ${moy} × ${n} = ${moy * n}. Déjà obtenu : ${somme}. Il manque ${moy * n} − ${somme} = ${x}.`,
          verifier: () => (somme + x) / n === moy,
        };
      }
    },
  },
  {
    id: 'moyenne-ponderee',
    theme: 'Moyennes',
    niveau: 3,
    tirer(rng) {
      const [coefs] = [rng.choisir([[3, 2], [1, 1, 2], [1, 2, 2], [2, 3], [1, 3], [1, 1, 3]])];
      const notes = coefs.map(() => entre(rng, 6, 19));
      const total = coefs.reduce((s, c) => s + c, 0);
      const pondere = notes.reduce((s, x, i) => s + x * coefs[i], 0);
      const liste = notes.map((x, i) => `${x} (coefficient ${coefs[i]})`).join(', ');
      return {
        enonce: `Un candidat obtient les notes suivantes : ${liste}. Quelle est sa moyenne pondérée ?`,
        solution: q(pondere, total),
        pieges: [
          p(q(notes.reduce((a, b) => a + b, 0), notes.length), 'moyenne simple, coefficients ignorés'),
          p(q(pondere, notes.length), 'division par le nombre de notes au lieu de la somme des coefficients'),
          p(q(pondere), 'somme pondérée sans division'),
          p(q(notes.reduce((a, b) => a + b, 0), total), 'somme des notes divisée par les coefficients'),
        ],
        format: { type: 'decimal' },
        explication: `Somme pondérée : ${notes.map((x, i) => `${x}×${coefs[i]}`).join(' + ')} = ${pondere}. On divise par la somme des coefficients (${total}) : ${pondere} ÷ ${total}.`,
        verifier: () => egal(div(q(pondere), q(total)), q(pondere, total)),
      };
    },
  },
  {
    id: 'ages',
    theme: 'Équations',
    niveau: 3,
    tirer(rng) {
      for (;;) {
        const k = rng.choisir([2, 3]);
        const fils = entre(rng, 6, 16);
        const x = entre(rng, 1, 20);
        const pere = k * (fils + x) - x;
        if (pere > 60 || pere <= fils) continue;
        return {
          enonce: `Un père a ${pere} ans et son fils ${fils} ans. Dans combien d'années l'âge du père sera-t-il ${k === 2 ? 'le double' : 'le triple'} de celui de son fils ?`,
          solution: q(x),
          pieges: [
            p(q(pere - k * fils), 'on oublie que l’âge du père augmente aussi'),
            p(q(pere - fils), 'la différence d’âge'),
            p(q(Math.round(pere / k) - fils), 'âge du père ÷ ' + k + ' − âge du fils'),
          ].filter((e) => e.valeur.n >= 0),
          format: { type: 'entier', unite: 'ans' },
          explication: `Dans x ans : ${pere} + x = ${k} × (${fils} + x), donc ${pere} + x = ${k * fils} + ${k}x, soit ${pere - k * fils} = ${k - 1}x, donc x = ${x}. Les deux âges augmentent du même nombre d'années.`,
          verifier: () => pere + x === k * (fils + x),
        };
      }
    },
  },
  {
    id: 'nombre-pense',
    theme: 'Équations',
    niveau: 1,
    tirer(rng) {
      const x = entre(rng, 2, 20);
      const a = entre(rng, 2, 9);
      const b = entre(rng, 3, 40);
      const c = a * x + b;
      return {
        enonce: `Je pense à un nombre. Je le multiplie par ${a}, puis j'ajoute ${b} : j'obtiens ${c}. Quel est ce nombre ?`,
        solution: q(x),
        pieges: [
          p(q(c - b), 'oubli de diviser par ' + a),
          p(q(c, a) , `${c} ÷ ${a} sans retirer ${b}`),
          p(q(c + b, a), `${b} ajouté au lieu d’être retiré`),
          p(q(c, a + b), 'division par la somme'),
        ],
        format: entier,
        explication: `On remonte les opérations à l'envers : ${c} − ${b} = ${c - b}, puis ${c - b} ÷ ${a} = ${x}.`,
        verifier: () => a * x + b === c,
      };
    },
  },
  {
    id: 'partage',
    theme: 'Proportionnalité',
    niveau: 2,
    tirer(rng) {
      const parts = rng.choisir([
        [1, 2, 3],
        [1, 2, 2],
        [1, 3, 4],
        [2, 3, 5],
        [1, 1, 3],
      ]);
      const w = parts.reduce((a, b) => a + b, 0);
      const unite = entre(rng, 2, 15) * 10;
      const total = unite * w;
      const max = Math.max(...parts);
      return {
        enonce: `Trois amis se partagent ${total} € proportionnellement à ${parts.join(', ')}. Combien reçoit celui qui a la plus grosse part ?`,
        solution: q(unite * max),
        pieges: [
          p(q(total, 3), 'partage égal'),
          p(q(unite), 'la valeur d’une seule part'),
          p(q(total, max), 'total divisé par la plus grosse part'),
        ],
        format: eur,
        explication: `Il y a ${parts.join(' + ')} = ${w} parts. Une part vaut ${total} ÷ ${w} = ${unite} €. La plus grosse en compte ${max} : ${unite * max} €.`,
        verifier: () => parts.reduce((s, x) => s + x * unite, 0) === total,
      };
    },
  },
  {
    id: 'melange-prix',
    theme: 'Moyennes',
    niveau: 3,
    tirer(rng) {
      const [a, b] = rng.choisir([
        [2, 3],
        [1, 3],
        [3, 2],
        [3, 1],
        [1, 1],
      ]);
      const x = entre(rng, 2, 9);
      const y = entre(rng, 10, 20);
      const prix = q(a * x + b * y, a + b);
      return {
        enonce: `Un épicier mélange ${a} kg de thé à ${x} € le kilo et ${b} kg de thé à ${y} € le kilo. Quel est le prix du kilo du mélange ?`,
        solution: prix,
        pieges: [
          p(q(x + y, 2), 'moyenne simple des deux prix'),
          p(q(a * x + b * y), 'prix total, pas le prix du kilo'),
          p(q(a * x + b * y, 2), 'division par 2 au lieu du nombre de kilos'),
          p(q(b * x + a * y, a + b), 'quantités inversées'),
        ],
        format: eur,
        explication: `Coût total : ${a} × ${x} + ${b} × ${y} = ${a * x + b * y} €. Pour ${a + b} kg, le kilo coûte ${a * x + b * y} ÷ ${a + b} €.`,
        verifier: () => egal(mul(prix, q(a + b)), q(a * x + b * y)),
      };
    },
  },
  {
    id: 'rectangle',
    theme: 'Géométrie',
    niveau: 2,
    tirer(rng) {
      const w = entre(rng, 3, 15);
      const l = entre(rng, w + 1, 25);
      const aire = l * w;
      return {
        enonce: `Un terrain rectangulaire a une aire de ${aire} m² et une largeur de ${w} m. Quel est son périmètre ?`,
        solution: q(2 * (l + w)),
        pieges: [
          p(q(l), 'la longueur seulement'),
          p(q(l + w), 'le demi-périmètre'),
          p(q(2 * l + w), 'un côté oublié'),
          p(q(aire + w), 'aire + largeur'),
        ],
        format: { type: 'entier', unite: 'm' },
        explication: `Longueur = aire ÷ largeur = ${aire} ÷ ${w} = ${l} m. Périmètre = 2 × (${l} + ${w}) = ${2 * (l + w)} m.`,
        verifier: () => l * w === aire && 2 * (aire / w + w) === 2 * (l + w),
      };
    },
  },
  {
    id: 'triangle-aire',
    theme: 'Géométrie',
    niveau: 1,
    tirer(rng) {
      const b = entre(rng, 4, 20);
      const h = entre(rng, 3, 16);
      if ((b * h) % 2 !== 0) return this.tirer(rng);
      return {
        enonce: `Quelle est l'aire d'un triangle de base ${b} cm et de hauteur ${h} cm ?`,
        solution: q(b * h, 2),
        pieges: [
          p(q(b * h), 'oubli de diviser par 2'),
          p(q(b + h), 'somme de la base et de la hauteur'),
          p(q(b * h, 4), 'division par 4'),
          p(q(2 * (b + h)), 'périmètre d’un rectangle'),
        ],
        format: { type: 'decimal', unite: 'cm²' },
        explication: `Aire d'un triangle = base × hauteur ÷ 2 = ${b} × ${h} ÷ 2 = ${(b * h) / 2} cm².`,
        verifier: () => (b * h) / 2 === (b / 2) * h,
      };
    },
  },
  {
    id: 'pythagore',
    theme: 'Géométrie',
    niveau: 3,
    tirer(rng) {
      const [a, b, c] = rng.choisir([
        [3, 4, 5],
        [6, 8, 10],
        [5, 12, 13],
        [8, 15, 17],
        [9, 12, 15],
        [7, 24, 25],
        [12, 16, 20],
        [15, 20, 25],
        [20, 21, 29],
      ]);
      if (rng.chance(0.5)) {
        return {
          enonce: `Un triangle est rectangle, ses deux côtés de l'angle droit mesurent ${a} cm et ${b} cm. Quelle est la longueur de l'hypoténuse ?`,
          solution: q(c),
          pieges: [
            p(q(a + b), 'somme des deux côtés'),
            p(q(a * a + b * b), 'oubli de la racine carrée'),
            p(q(Math.abs(b - a)), 'différence des deux côtés'),
          ],
          format: { type: 'entier', unite: 'cm' },
          explication: `Pythagore : hypoténuse² = ${a}² + ${b}² = ${a * a + b * b}, donc hypoténuse = √${a * a + b * b} = ${c} cm.`,
          verifier: () => a * a + b * b === c * c,
        };
      }
      return {
        enonce: `Un triangle rectangle a une hypoténuse de ${c} cm et un côté de l'angle droit de ${a} cm. Quelle est la longueur de l'autre côté de l'angle droit ?`,
        solution: q(b),
        pieges: [
          p(q(c - a), 'différence hypoténuse − côté'),
          p(q(c * c - a * a), 'oubli de la racine carrée'),
          p(q(c + a), 'somme'),
        ],
        format: { type: 'entier', unite: 'cm' },
        explication: `Pythagore : côté² = ${c}² − ${a}² = ${c * c - a * a}, donc côté = √${c * c - a * a} = ${b} cm.`,
        verifier: () => c * c - a * a === b * b,
      };
    },
  },
  {
    id: 'volume-litres',
    theme: 'Unités',
    niveau: 2,
    tirer(rng) {
      const a = rng.choisir([40, 50, 60, 80, 100]);
      const b = rng.choisir([20, 25, 40, 50]);
      const c = rng.choisir([30, 40, 50, 60]);
      const litres = (a * b * c) / 1000;
      return {
        enonce: `Un aquarium mesure ${a} cm de long, ${b} cm de large et ${c} cm de haut. Combien de litres d'eau contient-il, rempli à ras bord ? (1 litre = 1 dm³)`,
        solution: q(a * b * c, 1000),
        pieges: [
          p(q(a * b * c, 100), 'conversion cm³ → litres : facteur 100'),
          p(q(a * b * c, 10000), 'conversion cm³ → litres : facteur 10 000'),
          p(q(a * b * c, 10), 'conversion cm³ → litres : facteur 10'),
          p(q(a * b * c), 'volume en cm³, non converti'),
        ],
        format: { type: 'decimal', unite: 'L' },
        explication: `Volume = ${a} × ${b} × ${c} = ${a * b * c} cm³. Or 1 L = 1 dm³ = 1000 cm³, donc ${a * b * c} ÷ 1000 = ${litres} L.`,
        verifier: () => Math.abs((a / 10) * (b / 10) * (c / 10) - litres) < 1e-9,
      };
    },
  },
  {
    id: 'conversion-surface',
    theme: 'Unités',
    niveau: 2,
    tirer(rng) {
      const val = rng.choisir([2, 3.5, 0.5, 4.2, 1.5, 6]);
      const [cible, facteur] = rng.choisir([
        ['dm²', 100],
        ['cm²', 10000],
      ] as const);
      const v100 = Math.round(val * 10);
      const sol = q(v100 * facteur, 10);
      const faux = [10, 100, 1000, 10000].filter((f) => f !== facteur);
      return {
        enonce: `Convertir ${String(val).replace('.', ',')} m² en ${cible}.`,
        solution: sol,
        pieges: faux.slice(0, 4).map((f) => p(q(v100 * f, 10), `facteur ${f} au lieu de ${facteur}`)),
        format: { type: 'decimal', unite: cible },
        explication: `Pour les surfaces, chaque changement d'unité multiplie par 100 (1 m² = 100 dm² = 10 000 cm²). ${String(val).replace('.', ',')} × ${facteur} = ${(v100 * facteur) / 10}.`,
        verifier: () => Math.abs(val * facteur - (v100 * facteur) / 10) < 1e-9,
      };
    },
  },
  {
    id: 'echelle',
    theme: 'Unités',
    niveau: 2,
    tirer(rng) {
      const [echelle, pas] = rng.choisir([
        [10000, 1],
        [25000, 4],
        [50000, 2],
        [100000, 1],
      ] as const);
      const cm = entre(rng, 1, 12) * pas;
      const km = (cm * echelle) / 100000;
      return {
        enonce: `Sur une carte à l'échelle 1/${echelle.toLocaleString('fr-FR').replace(/ /g, ' ')}, deux villages sont distants de ${cm} cm. Quelle est la distance réelle, en kilomètres ?`,
        solution: q(cm * echelle, 100000),
        pieges: [
          p(q(cm * echelle, 10000), 'une erreur de facteur 10 (m / km)'),
          p(q(cm * echelle, 1000), 'une erreur de facteur 100'),
          p(q(cm * echelle), 'distance en centimètres, non convertie'),
          p(q(cm * echelle, 1000000), 'une erreur de facteur 10 en sens inverse'),
        ],
        format: { type: 'decimal', unite: 'km' },
        explication: `${cm} cm sur la carte = ${cm} × ${echelle} cm en réalité = ${cm * echelle} cm. Or 1 km = 100 000 cm, donc ${km} km.`,
        verifier: () => Math.abs((cm * echelle) / 100 / 1000 - km) < 1e-9,
      };
    },
  },
  {
    id: 'consommation',
    theme: 'Unités',
    niveau: 1,
    tirer(rng) {
      const conso10 = rng.choisir([55, 60, 65, 70, 80]);
      const d = entre(rng, 2, 30) * 20;
      const litres = q(conso10 * d, 1000);
      return {
        enonce: `Un véhicule consomme ${String(conso10 / 10).replace('.', ',')} litres aux 100 km. Combien de litres consomme-t-il sur ${d} km ?`,
        solution: litres,
        pieges: [
          p(q(conso10 * d, 10), 'oubli de diviser par 100'),
          p(q(d * 10, conso10), 'distance ÷ consommation'),
          p(q(conso10 * d, 100), 'virgule décalée'),
          p(q(conso10 * d, 10000), 'virgule décalée dans l’autre sens'),
        ],
        format: { type: 'decimal', unite: 'L' },
        explication: `${d} km = ${d / 100} fois 100 km. Consommation : ${conso10 / 10} × ${d / 100} = ${(conso10 * d) / 1000} L.`,
        verifier: () => Math.abs((conso10 / 10) * (d / 100) - (conso10 * d) / 1000) < 1e-9,
      };
    },
  },
  {
    id: 'travail-ensemble',
    theme: 'Proportionnalité',
    niveau: 3,
    tirer(rng) {
      const [a, b] = rng.choisir([
        [6, 3],
        [12, 4],
        [10, 15],
        [20, 30],
        [12, 6],
        [24, 8],
        [30, 20],
        [40, 10],
        [8, 8],
        [60, 30],
      ]);
      const t = q(a * b, a + b);
      return {
        enonce: `Un premier robinet remplit une citerne en ${a} heures, un second la remplit en ${b} heures. Ouverts ensemble, en combien d'heures la remplissent-ils ?`,
        solution: t,
        pieges: [
          p(q(a + b, 2), 'moyenne des deux durées'),
          p(q(a + b), 'somme des durées'),
          p(q(Math.abs(a - b)), 'différence des durées'),
          p(q(a * b), 'produit des durées'),
        ],
        format: { type: 'decimal', unite: 'h' },
        explication: `Chaque heure, le 1er remplit 1/${a} de la citerne et le 2e 1/${b}. Ensemble : 1/${a} + 1/${b} = ${add(q(1, a), q(1, b)).n}/${add(q(1, a), q(1, b)).d} par heure, donc la citerne est pleine en ${t.d === 1 ? t.n : t.n + '/' + t.d} h.`,
        verifier: () => egal(mul(t, add(q(1, a), q(1, b))), q(1)),
      };
    },
  },
  {
    id: 'suite-numerique',
    theme: 'Suites',
    niveau: 1,
    tirer(rng) {
      if (rng.chance(0.5)) {
        const decroit = rng.chance(0.3);
        const r = entre(rng, 2, 9) * (decroit ? -1 : 1);
        const u0 = entre(rng, 1, 20) + (decroit ? 4 * Math.abs(r) : 0);
        const t = [0, 1, 2, 3].map((i) => u0 + i * r);
        const sol = u0 + 4 * r;
        return {
          enonce: `Quel est le terme suivant de la suite : ${t.join(' ; ')} ; … ?`,
          solution: q(sol),
          pieges: [
            p(q(sol + r), 'un pas de trop'),
            p(q(t[3]), 'le dernier terme répété'),
            p(q(t[3] + t[3] - t[1]), 'régularité mal comprise'),
          ],
          format: entier,
          explication: `La suite progresse de ${r > 0 ? '+' : ''}${r} à chaque terme : ${t[3]} ${r > 0 ? '+' : '−'} ${Math.abs(r)} = ${sol}.`,
          verifier: () => sol - t[3] === t[3] - t[2] && t[3] - t[2] === r,
        };
      }
      const u0 = entre(rng, 1, 4);
      const r = rng.choisir([2, 3]);
      const t = [0, 1, 2, 3].map((i) => u0 * r ** i);
      const sol = u0 * r ** 4;
      return {
        enonce: `Quel est le terme suivant de la suite : ${t.join(' ; ')} ; … ?`,
        solution: q(sol),
        pieges: [
          p(q(t[3] + (t[3] - t[2])), 'on suppose une progression additive'),
          p(q(t[3]), 'le dernier terme répété'),
          p(q(sol * r), 'un cran de trop'),
        ],
        format: entier,
        explication: `Chaque terme est le précédent multiplié par ${r} : ${t[3]} × ${r} = ${sol}.`,
        verifier: () => t[3] * r === sol && t[1] === t[0] * r,
      };
    },
  },
  {
    id: 'priorites',
    theme: 'Calcul',
    niveau: 1,
    tirer(rng) {
      const forme = entre(rng, 1, 3);
      if (forme === 1) {
        const a = entre(rng, 2, 15);
        const b = entre(rng, 2, 9);
        const c = entre(rng, 2, 9);
        return {
          enonce: `Calculer : ${a} + ${b} × ${c}`,
          solution: q(a + b * c),
          pieges: [
            p(q((a + b) * c), 'addition effectuée avant la multiplication'),
            p(q(a * b + c), 'opérations mal associées'),
            p(q(a + b + c), 'tout additionné'),
            p(q(a * b * c), 'tout multiplié'),
          ],
          format: entier,
          explication: `La multiplication est prioritaire : ${b} × ${c} = ${b * c}, puis ${a} + ${b * c} = ${a + b * c}.`,
          verifier: () => a + b * c === a + c * b,
        };
      }
      if (forme === 2) {
        const b = entre(rng, 2, 6);
        const c = entre(rng, 2, 6);
        const a = b * c + entre(rng, 1, 20);
        const d = entre(rng, 1, 10);
        return {
          enonce: `Calculer : ${a} − ${b} × ${c} + ${d}`,
          solution: q(a - b * c + d),
          pieges: [
            p(q((a - b) * c + d), 'soustraction effectuée avant la multiplication'),
            p(q(a - b * (c + d)), 'parenthèses imaginaires'),
            p(q(a - b * c - d), 'signe du dernier terme mal lu'),
            p(q(a + b * c + d), 'signe de la multiplication mal lu'),
          ],
          format: entier,
          explication: `${b} × ${c} = ${b * c} d'abord ; puis ${a} − ${b * c} + ${d} = ${a - b * c + d} (de gauche à droite).`,
          verifier: () => a - b * c + d === d + a - c * b,
        };
      }
      const a = entre(rng, 2, 9);
      const b = entre(rng, 2, 6);
      return {
        enonce: `Calculer : ${a} × ${b}²`,
        solution: q(a * b * b),
        pieges: [
          p(q((a * b) ** 2), 'le carré appliqué au produit'),
          p(q(a * b * 2), 'carré remplacé par un doublement'),
          p(q(a + b * b), 'multiplication remplacée par une addition'),
          p(q(a * a * b), 'carré appliqué au mauvais nombre'),
        ],
        format: entier,
        explication: `Le carré s'applique à ${b} seulement : ${b}² = ${b * b}, puis ${a} × ${b * b} = ${a * b * b}.`,
        verifier: () => a * b * b === a * (b ** 2),
      };
    },
  },
  {
    id: 'probabilite',
    theme: 'Probabilités',
    niveau: 2,
    tirer(rng) {
      const r = entre(rng, 2, 9);
      const b = entre(rng, 2, 9);
      const n = r + b;
      const sol = q(r, n);
      return {
        enonce: `Un sac contient ${r} boules rouges et ${b} boules bleues. On tire une boule au hasard. Quelle est la probabilité qu'elle soit rouge ? (réponse sous forme de fraction)`,
        solution: sol,
        pieges: [
          p(q(b, n), 'la probabilité d’obtenir une bleue'),
          p(q(1, n), 'une chance parmi toutes les boules'),
          p(q(r, n + 1), 'total mal compté'),
        ],
        format: { type: 'fraction' },
        explication: `Probabilité = cas favorables ÷ cas possibles = ${r} ÷ (${r} + ${b}) = ${r}/${n}${sol.d !== n ? ' = ' + sol.n + '/' + sol.d : ''}.`,
        verifier: () => egal(add(sol, q(b, n)), q(1)),
      };
    },
  },
  {
    id: 'unites-temps',
    theme: 'Temps',
    niveau: 1,
    tirer(rng) {
      const h = entre(rng, 1, 6);
      const m = rng.choisir([15, 30, 45]);
      return {
        enonce: `Combien de minutes y a-t-il dans ${h} h ${m} min ?`,
        solution: q(h * 60 + m),
        pieges: [
          p(q(h * 100 + m), 'une heure comptée pour 100 minutes'),
          p(q(h * 60), 'les minutes oubliées'),
          p(q(h + m), 'heures et minutes additionnées'),
          p(q(h * 60 + m + 60), 'une heure de trop'),
        ],
        format: { type: 'entier', unite: 'min' },
        explication: `${h} h = ${h * 60} min, donc ${h * 60} + ${m} = ${h * 60 + m} min.`,
        verifier: () => (h * 60 + m) / 60 === h + m / 60,
      };
    },
  },
  {
    id: 'vitesse-calcul',
    theme: 'Vitesse',
    niveau: 1,
    tirer(rng) {
      const v = rng.choisir([40, 45, 50, 60, 80, 90, 100, 120]);
      const h = entre(rng, 2, 5);
      const d = v * h;
      return {
        enonce: `Une voiture parcourt ${d} km en ${h} h à vitesse constante. Quelle est sa vitesse, en km/h ?`,
        solution: q(v),
        pieges: [
          p(q(d * h), 'distance × durée'),
          p(q(d + h), 'distance + durée'),
          p(q(d, h + 1), 'durée mal comptée'),
          p(q(h, d), 'durée ÷ distance (rapport inversé)'),
        ],
        format: { type: 'entier', unite: 'km/h' },
        explication: `Vitesse = distance ÷ durée = ${d} ÷ ${h} = ${v} km/h.`,
        verifier: () => v * h === d,
      };
    },
  },
  {
    id: 'division-boites',
    theme: 'Calcul',
    niveau: 1,
    tirer(rng) {
      const par = rng.choisir([4, 5, 6, 8, 9, 12]);
      const nbBoites = entre(rng, 3, 15);
      const total = par * nbBoites;
      const objet = rng.choisir(['balles', 'stylos', 'bouteilles', 'cartouches']);
      return {
        enonce: `Une caisse contient ${total} ${objet}. Chaque boîte contient ${par} ${objet}. Combien de boîtes peut-on remplir ?`,
        solution: q(nbBoites),
        pieges: [
          p(q(total - par), 'une soustraction au lieu d’une division'),
          p(q(total + par), 'une addition au lieu d’une division'),
          p(q(nbBoites + 1), 'une boîte de trop'),
          p(q(nbBoites - 1), 'une boîte de moins'),
        ],
        format: entier,
        explication: `${total} ÷ ${par} = ${nbBoites} boîtes.`,
        verifier: () => nbBoites * par === total,
      };
    },
  },
  {
    id: 'proportion-prix',
    theme: 'Proportionnalité',
    niveau: 1,
    tirer(rng) {
      const unitaire2 = rng.choisir([1, 2, 3, 4, 5, 6, 8, 10]); // prix unitaire en demi-euros
      const a = rng.choisir([2, 4, 6, 8, 10]);
      let b = a;
      while (b === a) b = entre(rng, 2, 16);
      const prixA = q(a * unitaire2, 2);
      const sol = q(b * unitaire2, 2);
      const nombre = (x: Q) => (x.d === 1 ? String(x.n) : String(x.n / x.d));
      return {
        enonce: `${a} stylos coûtent ${nombre(prixA)} €. Combien coûtent ${b} stylos au même prix ?`,
        solution: sol,
        pieges: [
          p(add(prixA, q(b - a)), 'raisonnement additif : on ajoute 1 € par stylo en plus'),
          p(q(b * a * unitaire2, 2), 'prix de ' + a + ' stylos multiplié par le nombre de stylos'),
          p(q(a * unitaire2, 2 * b), 'proportion inversée'),
          p(q(b * unitaire2, 4), 'prix unitaire divisé une fois de trop'),
        ],
        format: eur,
        explication: `1 stylo coûte ${nombre(prixA)} ÷ ${a} = ${nombre(q(unitaire2, 2))} €. Donc ${b} stylos coûtent ${b} × ${nombre(q(unitaire2, 2))} = ${nombre(sol)} €.`,
        verifier: () => egal(mul(div(prixA, q(a)), q(b)), sol),
      };
    },
  },
  {
    id: 'multiples',
    theme: 'Calcul',
    niveau: 2,
    tirer(rng) {
      const k = rng.choisir([3, 4, 5, 6, 7]);
      const debut = entre(rng, 5, 30);
      const fin = debut + entre(rng, 4 * k, 12 * k);
      // On compte à la main, pour recouper la formule.
      let nb = 0;
      for (let x = debut; x <= fin; x++) if (x % k === 0) nb++;
      return {
        enonce: `Combien y a-t-il de multiples de ${k} entre ${debut} et ${fin} (bornes incluses) ?`,
        solution: q(nb),
        pieges: [
          p(q(Math.floor((fin - debut) / k)), 'écart ÷ pas, sans compter les deux extrémités'),
          p(q(Math.floor((fin - debut) / k) + 1), 'on ajoute 1 sans vérifier les bornes'),
          p(q(Math.floor(fin / k)), 'tous les multiples depuis 0'),
          p(q(Math.ceil((fin - debut) / k)), 'arrondi au mauvais sens'),
        ],
        format: entier,
        explication: `Premier multiple ≥ ${debut} : ${Math.ceil(debut / k) * k} ; dernier multiple ≤ ${fin} : ${Math.floor(fin / k) * k}. Il y en a ${Math.floor(fin / k)} − ${Math.ceil(debut / k)} + 1 = ${nb}.`,
        verifier: () => Math.floor(fin / k) - Math.ceil(debut / k) + 1 === nb,
      };
    },
  },
];

export const GABARITS: readonly Gabarit[] = gabarits;

export function gabaritParId(id: string): Gabarit {
  const g = GABARITS.find((x) => x.id === id);
  if (!g) throw new Error(`Gabarit inconnu : ${id}`);
  return g;
}
