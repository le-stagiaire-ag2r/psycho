import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EPREUVES, ORDRE_EPREUVES } from '../config/epreuves';
import { erreursARevoir, grouperParEpreuve } from '../lib/revision';
import type { EtatSeance } from '../lib/session';
import type { EpreuveId, ItemRef } from '../lib/types';
import { useStockage } from '../state/Stockage';
import { SeanceInner } from './Seance';

const MAX_PAR_SEANCE = 20;

export default function Revision() {
  const { donnees, marquerResolues } = useStockage();
  // Séance en cours : figée au clic, pour que la liste ne change pas sous nos pieds.
  const [session, setSession] = useState<{ epreuve: EpreuveId; refs: ItemRef[] } | null>(null);
  const [manche, setManche] = useState(0);
  const [corrigees, setCorrigees] = useState(0);

  const resolues = useMemo(() => new Set(donnees.erreursResolues), [donnees.erreursResolues]);
  const erreurs = useMemo(() => erreursARevoir(donnees.historique, resolues), [donnees.historique, resolues]);
  const parEpreuve = useMemo(() => grouperParEpreuve(erreurs), [erreurs]);

  if (session) {
    return (
      <SeanceInner
        key={`${session.epreuve}-${manche}`}
        config={EPREUVES[session.epreuve]}
        mode="entrainement"
        niveau={donnees.prefs.niveau}
        difficulteChoisie={donnees.prefs.difficulte}
        refs={session.refs}
        sauvegarder={false}
        libelleDepart="Commencer la révision"
        onResultats={(etat: EtatSeance) => {
          const reussies = etat.ordre.filter((i) => etat.reponses[i] === etat.items[i].bonneReponse).map((i) => etat.items[i].id);
          marquerResolues(reussies);
          setCorrigees(reussies.length);
        }}
        actionsResultats={
          <>
            <button
              type="button"
              className="bouton bouton-secondaire"
              onClick={() => {
                setSession(null);
                setManche((m) => m + 1);
              }}
            >
              Retour à la révision
            </button>
            {corrigees > 0 && <p role="status">{corrigees} question(s) maîtrisée(s) retirée(s) de ta liste.</p>}
          </>
        }
      />
    );
  }

  return (
    <section aria-labelledby="titre-revision">
      <h1 id="titre-revision">Révision des erreurs</h1>
      <p>
        Refais les questions que tu as ratées : elles sont régénérées à l’identique grâce à leur graine. Une question
        réussie en révision est retirée de la liste ; une question ratée y reste.
      </p>
      {erreurs.length === 0 ? (
        <p className="encadre">
          Aucune erreur à revoir pour l’instant. Fais quelques séances, tes erreurs apparaîtront ici.{' '}
          <Link to="/">Choisir une épreuve</Link>
        </p>
      ) : (
        <ul className="grille-epreuves">
          {ORDRE_EPREUVES.filter((id) => parEpreuve.has(id)).map((id) => {
            const nb = parEpreuve.get(id)!.length;
            return (
              <li key={id} className="carte">
                <h2>{EPREUVES[id].titre}</h2>
                <p>
                  {nb} erreur{nb > 1 ? 's' : ''} à revoir
                  {nb > MAX_PAR_SEANCE ? ` (par séances de ${MAX_PAR_SEANCE})` : ''}
                </p>
                <button
                  type="button"
                  className="bouton"
                  onClick={() => setSession({ epreuve: id, refs: parEpreuve.get(id)!.slice(0, MAX_PAR_SEANCE).map((e) => e.ref) })}
                >
                  Réviser
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
