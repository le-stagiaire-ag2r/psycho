import type { EtatSeance } from '../lib/session';
import Correction from './Correction';

/** Correction détaillée des questions ratées. */
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
                    {s.type === 'attention-series' && <code>{s.series.join(' · ')}</code>}
                  </summary>
                  <Correction item={item} choix={choix} />
                  <p className="discret">
                    Réf. {item.id} ·{' '}
                    <a href={`/commentaire?ref=${encodeURIComponent(item.id)}`} target="_blank" rel="noopener noreferrer">
                      un souci avec cette question ? (nouvel onglet)
                    </a>
                  </p>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
