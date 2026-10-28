import { describe, expect, it } from 'vitest';
import { EPREUVES } from '../config/epreuves';
import { GENERATEURS } from './index';
import type { Difficulte, EpreuveId } from '../lib/types';

/**
 * Tests « golden » : ils verrouillent la sortie EXACTE de chaque générateur pour des graines fixes.
 *
 * Pourquoi : un item = épreuve + VERSION du générateur + graine. Si l'algorithme d'un générateur
 * change sans que sa version soit incrémentée, les questions enregistrées dans l'historique des
 * candidats (et les liens de signalement) ne redonneraient plus la même question.
 *
 * Seule la question est empreinte, pas son explication (texte de correction modifiable librement).
 *
 * Si ce test échoue après une modification VOULUE d'un générateur :
 *   1. incrémente sa constante VERSION_… (le test ci-dessous t'y oblige) ;
 *   2. mets à jour l'empreinte attendue ci-dessous (la valeur reçue est affichée dans l'erreur).
 */
function empreinte(texte: string): string {
  // FNV-1a 32 bits
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const DIFFICULTE: Difficulte = 2;

function empreinteEpreuve(id: EpreuveId): string {
  const gen = GENERATEURS[id]!;
  const refs = gen.construireRefs({ graineBase: 20261027, nb: 24, difficulte: DIFFICULTE, config: EPREUVES[id] });
  // On n'empreint que la QUESTION (énoncé, propositions, bonne réponse) : améliorer une explication
  // ou la raison d'une proposition ne change pas l'identité de la question.
  return empreinte(
    JSON.stringify(
      refs.map((r) => {
        const { explication: _e, pourquoi: _p, ...question } = gen.generer(r) as unknown as Record<string, unknown>;
        return question;
      }),
    ),
  );
}

/**
 * Épreuves générées par CODE uniquement. Verbal et anglais sont des banques de données : corriger
 * une question ne doit pas imposer de changer de version (l'item est identifié par son id).
 */
const ATTENDUES: Partial<Record<EpreuveId, { version: number; empreinte: string }>> = {
  attention: { version: 1, empreinte: '84120b39' },
  codage: { version: 1, empreinte: 'c2fae41e' },
  numerique: { version: 1, empreinte: '59350aab' },
  spatial: { version: 1, empreinte: 'f68abccd' },
  logique: { version: 1, empreinte: '01557153' },
  raisonnement: { version: 1, empreinte: '9c04fb66' },
};

describe('golden : sortie des générateurs pour des graines fixes', () => {
  it('calcul des empreintes', () => {
    const res: Record<string, { version: number; empreinte: string }> = {};
    for (const id of Object.keys(ATTENDUES) as EpreuveId[]) res[id] = { version: GENERATEURS[id]!.version, empreinte: empreinteEpreuve(id) };
    expect(Object.keys(res).length).toBe(6);
    for (const id of Object.keys(ATTENDUES) as EpreuveId[]) {
      expect(GENERATEURS[id]!.version, `${id} : version`).toBe(ATTENDUES[id]!.version);
      expect(empreinteEpreuve(id), `${id} : la sortie du générateur a changé → incrémente sa VERSION et mets à jour l'empreinte`).toBe(ATTENDUES[id]!.empreinte);
    }
  });

  it('un générateur déterministe : deux exécutions donnent la même empreinte', () => {
    for (const id of Object.keys(GENERATEURS) as EpreuveId[]) expect(empreinteEpreuve(id)).toBe(empreinteEpreuve(id));
  });
});
