import { DEPOT_GITHUB } from '../config/app';
import type { Item } from './types';

/** Lien GitHub Issues pré-rempli (épreuve + version + graine), sans backend. */
export function lienSignalement(item: Item): string {
  const titre = `[Erreur] ${item.id}`;
  const corps = [
    `Épreuve : ${item.ref.epreuve}`,
    `Version du générateur : ${item.ref.version}`,
    `Graine : ${item.ref.seed}`,
    `Difficulté : ${item.ref.difficulte}`,
    `Référence complète : \`${JSON.stringify(item.ref)}\``,
    '',
    '**Qu’est-ce qui ne va pas ?** (plusieurs réponses possibles, réponse fausse, énoncé ambigu…)',
    '',
  ].join('\n');
  const params = new URLSearchParams({ title: titre, body: corps, labels: 'erreur-question' });
  return `${DEPOT_GITHUB}/issues/new?${params.toString()}`;
}
