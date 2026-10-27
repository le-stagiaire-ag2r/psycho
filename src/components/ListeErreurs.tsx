import type { EtatSeance } from '../lib/session';
import Correction from './Correction';
import { lienSignalement } from '../lib/signalement';

/** Correction détaillée des questions ratées (avec lien de signalement). */
export default function ListeErreurs({ etat }: { etat: EtatSeance }) {
  const erreurs = etat.ordre.filter((i) => etat.reponses[i] !== etat.items[i].bonneReponse);
  return (
    <>
      <h2>Correction des erreurs ({erreurs.length})</h2>
      {erreurs.length === 0 ? (
        <p>Aucune erreur sur les questions auxquelles tu as répondu. Bravo.</p>
      ) : (
        <ul className="liste-erreurs">
          {erreurs.map((i) => {
            const item = etat.items[i];
            const choix = etat.reponses[i];
            const s = item.stimulus;
            return (
              <li key={item.id}>
                <details>
                  <summary>
                    {s.type === 'texte' ? s.enonce : item.consigne}{' '}
                    {s.type === 'attention' && (
                      <code>
                        {s.a} / {s.b}
                      </code>
                    )}
                  </summary>
                  <Correction item={item} choix={choix} />
                  <a href={lienSignalement(item)} target="_blank" rel="noopener noreferrer">
                    Signaler une erreur dans cette question
                  </a>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
