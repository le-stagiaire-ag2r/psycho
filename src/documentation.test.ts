import { describe, expect, it } from 'vitest';
import { EPREUVES } from './config/epreuves';
import { BANQUES } from './generateurs/banque';
import { GENERATEURS } from './generateurs/index';
import type { Difficulte, EpreuveId } from './lib/types';

/**
 * Chaque question doit expliquer POURQUOI chaque proposition est juste ou fausse :
 * c'est ce qui permet d'apprendre de ses erreurs.
 */
const EPREUVES_QCM = (Object.keys(GENERATEURS) as EpreuveId[]).filter((id) => GENERATEURS[id]);

function defauts(texte: string): string[] {
  const res: string[] = [];
  if (/undefined|NaN|\[object|null/.test(texte)) res.push('valeur technique affichée');
  if (/ {2}/.test(texte)) res.push('double espace');
  if (/\s[,.;]/.test(texte.replace(/ [:;?!»]/g, '').replace(/ \.\.\./g, '…'))) res.push('espace avant ponctuation');
  if (/\d\.\d/.test(texte)) res.push('point décimal au lieu de la virgule');
  return res;
}

describe.each(EPREUVES_QCM)('documentation : %s', (id) => {
  it.each([1, 2, 3] as Difficulte[])('chaque proposition est expliquée (difficulté %i)', (d) => {
    const gen = GENERATEURS[id]!;
    const refs = gen.construireRefs({ graineBase: 77, nb: 120, difficulte: d, config: EPREUVES[id] });
    for (const ref of refs) {
      const item = gen.generer(ref);
      const ou = `${item.id}`;
      expect(item.pourquoi, `${ou} : pourquoi absent`).toBeDefined();
      expect(item.pourquoi.length, `${ou} : un « pourquoi » par proposition`).toBe(item.options.length);
      expect(item.explication.trim().length, `${ou} : explication vide`).toBeGreaterThan(12);
      item.pourquoi.forEach((p, i) => {
        expect(p.trim().length, `${ou} proposition ${i} : explication trop courte`).toBeGreaterThan(25);
        expect(defauts(p), `${ou} proposition ${i} : « ${p} »`).toEqual([]);
      });
      expect(defauts(item.explication), `${ou} : « ${item.explication} »`).toEqual([]);
      // Les explications de propositions fausses sont toutes différentes entre elles quand elles sont propres à la proposition.
      // (Cubes : deux faux cubes peuvent légitimement partager la même nature de défaut.)
      if (!['spatial', 'logique'].includes(id)) {
        expect(new Set(item.pourquoi).size, `${ou} : deux propositions ont la même explication`).toBe(item.pourquoi.length);
      }
    }
  });
});

describe('documentation : banques verbal et anglais', () => {
  for (const [nom, items] of Object.entries(BANQUES)) {
    it(`${nom} : toutes les propositions ont une raison claire`, () => {
      for (const it of items!) {
        expect(it.pourquoiBonne.trim().length, `${it.id} : pourquoiBonne`).toBeGreaterThan(25);
        expect(defauts(it.pourquoiBonne), `${it.id}`).toEqual([]);
        expect(it.fausses.length).toBeGreaterThanOrEqual(3);
        for (const f of it.fausses) {
          expect(f.raison.trim().length, `${it.id} « ${f.texte} » : raison trop courte`).toBeGreaterThan(25);
          expect(defauts(f.raison), `${it.id} « ${f.texte} » : ${f.raison}`).toEqual([]);
        }
        const raisons = it.fausses.map((f) => f.raison);
        expect(new Set(raisons).size, `${it.id} : raisons identiques`).toBe(raisons.length);
      }
    });
  }
});
