import { describe, expect, it } from 'vitest';
import { EPREUVES } from './config/epreuves';
import { BANQUES } from './generateurs/banque';
import { generateurNumerique } from './generateurs/numerique';
import { GABARITS } from './generateurs/numerique/gabarits';
import personnalite from './data/personnalite.json';

/**
 * Contrôles de « crédibilité » du contenu : ce que la relecture humaine a trouvé de défauts
 * de présentation est verrouillé ici pour ne pas revenir.
 */
/** En français l'espace avant ? : ; ! est CORRECTE ; en anglais elle est fautive. */
const TYPO_COMMUN = [
  { motif: /  +/, nom: 'espaces doubles' },
  { motif: /['’] /, nom: 'apostrophe suivie d’une espace' },
  { motif: /^\s|\s$/, nom: 'espace en début ou fin' },
  { motif: /\s[.,]/, nom: 'espace avant un point ou une virgule' },
];
const TYPO_ANGLAIS = [{ motif: /[^_\s]\s[;:!?]/, nom: 'espace avant ponctuation (usage anglais)' }];

describe('banques verbal et anglais : typographie', () => {
  for (const [nom, items] of Object.entries(BANQUES)) {
    it(`${nom} : énoncés, réponses et explications sans défaut typographique`, () => {
      for (const it of items!) {
        // Les énoncés d'anglais sont en anglais ; leurs explications sont en français.
        const textes = nom === 'anglais' ? [it.enonce, it.bonne, ...it.fausses.map((f) => f.texte)] : [it.enonce, it.explication, it.bonne, ...it.fausses.map((f) => f.texte)];
        // En anglais, 'mot' entre apostrophes est normal : on ne teste pas la règle de l'apostrophe sur les énoncés.
        const regles = nom === 'anglais' ? [...TYPO_COMMUN.filter((r) => !r.nom.startsWith('apostrophe')), ...TYPO_ANGLAIS] : TYPO_COMMUN;
        for (const t of textes) {
          for (const { motif, nom: defaut } of regles) {
            expect(`${it.id} ${defaut} : ${motif.test(t)}`).toBe(`${it.id} ${defaut} : false`);
          }
        }
        if (nom === 'anglais') for (const m of TYPO_COMMUN.slice(0, 3)) expect(m.motif.test(it.explication)).toBe(false);
      }
    });
  }

  it('les synonymes et contraires sont posés sans article (« but », pas « un but »)', () => {
    for (const it of BANQUES.verbal!.filter((x) => x.type === 'synonyme' || x.type === 'contraire')) {
      expect(it.enonce).not.toMatch(/« (un|une|le|la|les) /i);
    }
  });

  it('chaque proverbe est reconstitué proprement dans son explication', () => {
    for (const it of BANQUES.verbal!.filter((x) => x.type === 'proverbe')) {
      expect(it.explication.includes(`${it.bonne}. »`)).toBe(true);
    }
  });

  it('les analogies utilisent « comme » (pas d’élision bancale devant une voyelle)', () => {
    for (const it of BANQUES.verbal!.filter((x) => x.type === 'analogie')) {
      expect(it.enonce).toMatch(/ comme /);
    }
  });
});

describe('anglais : aucun indice involontaire dans les propositions', () => {
  const items = BANQUES.anglais!;
  const VOYELLES = /^[aeiou]/i;
  it('l’article « a / an » placé avant le trou s’accorde avec TOUTES les propositions (sinon la bonne réponse se devine)', () => {
    for (const it of items) {
      const m = /\b(a|an) ___/.exec(it.enonce);
      if (!m) continue;
      // Items dont le but est justement de choisir l'article : les propositions SONT les articles.
      if (['a', 'an'].includes(it.bonne.toLowerCase())) continue;
      for (const o of [it.bonne, ...it.fausses.map((f) => f.texte)]) {
        const attendu = VOYELLES.test(o) ? 'an' : 'a';
        expect(`${it.id} « ${m[1]} ${o} » : ${m[1] === attendu}`).toBe(`${it.id} « ${m[1]} ${o} » : true`);
      }
    }
  });
  it('aucun pluriel ne se glisse après « a ___ » (« a shorts »)', () => {
    for (const it of items) {
      if (!/\ba ___/.test(it.enonce) || ['a', 'an'].includes(it.bonne.toLowerCase())) continue;
      for (const o of [it.bonne, ...it.fausses.map((f) => f.texte)]) expect(`${it.id} ${o} : ${/[^s]s$/.test(o) && !/(ss|us|is)$/.test(o)}`).toBe(`${it.id} ${o} : false`);
    }
  });
  it('les trous « ___ » sont présents une fois (1 trou), deux fois (2 trous) ou jamais (choix de la phrase correcte)', () => {
    const attendu: Record<string, number> = { grammaire: 1, vocabulaire: 0, grammaire2: 2, phrase: 0 };
    for (const it of items) {
      const nb = it.enonce.split('___').length - 1;
      if (it.type === 'grammaire' || it.type === 'grammaire2') expect(`${it.id} : ${nb}`).toBe(`${it.id} : ${attendu[it.type]}`);
      if (it.type === 'phrase') expect(nb).toBe(0);
    }
  });
  it('à deux trous, chaque proposition contient exactement deux parties séparées par « / »', () => {
    for (const it of items.filter((x) => x.type === 'grammaire2'))
      for (const o of [it.bonne, ...it.fausses.map((f) => f.texte)]) expect(`${it.id} ${o} : ${o.split(' / ').length}`).toBe(`${it.id} ${o} : 2`);
  });
});

describe('questionnaire de personnalité : formulation', () => {
  it('chaque affirmation est une phrase complète à la première personne', () => {
    const items = (personnalite as { items: { texte: string }[] }).items;
    for (const i of items) {
      expect(i.texte).toMatch(/^(Je|J'|Cela|Dans|Mon|Mes|Les|Il m'|Il )/);
      expect(i.texte.endsWith('.')).toBe(true);
    }
    // « Je suis un emploi du temps » est ambigu (être / suivre).
    expect(items.map((i) => i.texte)).not.toContain('Je suis un emploi du temps.');
  });
});

describe('gabarits numériques : présentation crédible', () => {
  const generer = (id: string, seed: number) =>
    generateurNumerique.generer({
      epreuve: 'numerique',
      version: 1,
      seed,
      difficulte: 3,
      params: { gabarit: id, nbChoix: EPREUVES.numerique.nbChoix },
    });

  it('aucune étiquette de piège absurde ou vide de sens dans les corrections', () => {
    const interdits = [/proche, mais faux/, /approximati/, /symétrie/, /virgule décalée\s*;\s*virgule/];
    for (const g of GABARITS) {
      for (let s = 1; s <= 60; s++) {
        const it = generer(g.id, s);
        for (const motif of interdits) expect(`${g.id}: ${motif.test(it.explication)}`).toBe(`${g.id}: false`);
        // Jamais d'énoncé ou d'explication avec un point décimal à l'anglo-saxonne.
        const enonce = it.stimulus.type === 'texte' ? it.stimulus.enonce : '';
        expect(/\d\.\d/.test(enonce + it.explication)).toBe(false);
      }
    }
  });

  it('les durées « jour(s) » s’accordent (jamais « 1 jours »)', () => {
    for (let s = 1; s <= 400; s++) {
      for (const o of generer('regle-de-trois-inverse', s).options) {
        expect(/^1 jours$/.test(o)).toBe(false);
        expect(/^(0,\d+|1) jours$/.test(o)).toBe(false);
      }
    }
  });

  it('une probabilité ou une fraction restante ne dépasse jamais 1 dans les propositions', () => {
    for (const id of ['probabilite', 'fractions-reste', 'plus-grande-fraction']) {
      for (let s = 1; s <= 300; s++) {
        const it = generer(id, s);
        for (const o of it.options) {
          const [n, d = '1'] = o.split('/');
          expect(Number(n) / Number(d)).toBeLessThanOrEqual(1);
          expect(Number(n)).toBeGreaterThan(0);
        }
      }
    }
  });

  it('les réponses entières ne sont pas entourées de faux prix « à 0,1 € près »', () => {
    for (const id of ['partage', 'remise', 'interets', 'melange-prix']) {
      for (let s = 1; s <= 200; s++) {
        const it = generer(id, s);
        const bonne = it.options[it.bonneReponse];
        if (bonne.includes(',')) continue; // solution décimale : des décimales sont normales
        const proches = it.options.filter((o) => /^\d+,[19] /.test(o));
        expect(proches).toHaveLength(0);
      }
    }
  });

  it('les nombres de 4 chiffres ou plus portent une espace de milliers', () => {
    for (let s = 1; s <= 200; s++) {
      const it = generer('volume-litres', s);
      const texte = (it.stimulus.type === 'texte' ? it.stimulus.enonce : '') + it.explication + it.options.join(' ');
      expect(/(?<![\d,])\d{4,}(?!\d)/.test(texte)).toBe(false);
    }
  });

  it('énoncés : pas de « 25 % des livres portent des lunettes » (sujet toujours humain)', () => {
    for (let s = 1; s <= 200; s++) {
      const it = generer('pourcentage-de', s);
      const e = it.stimulus.type === 'texte' ? it.stimulus.enonce : '';
      expect(e).not.toMatch(/livres/);
    }
  });

  it('le gabarit des horaires explique correctement le calcul', () => {
    for (let s = 1; s <= 200; s++) {
      const it = generer('duree-horaires', s);
      const m = /Total : (\d+) \+ (\d+) \+ (\d+) = (\d+) min/.exec(it.explication);
      expect(m).not.toBeNull();
      expect(Number(m![1]) + Number(m![2]) + Number(m![3])).toBe(Number(m![4]));
      expect(it.options[it.bonneReponse]).toBe(`${m![4]} min`);
    }
  });
});
