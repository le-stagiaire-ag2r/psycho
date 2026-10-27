import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MENTION_ENTRAINEMENT } from '../config/app';
import type { ConfigEpreuve } from '../config/epreuves';
import { AVERTISSEMENT_OBJECTIFS, OBJECTIFS, libelleNiveau } from '../config/niveaux';
import { decimal, formatDuree, pourcent } from '../lib/format';
import { calculerBilan, comparerObjectif } from '../lib/scoring';
import type { EtatSeance } from '../lib/session';
import { lienSignalement } from '../lib/signalement';
import type { Difficulte, Mode, NiveauId } from '../lib/types';
import { useStockage } from '../state/Stockage';

interface Props {
  config: ConfigEpreuve;
  etat: EtatSeance;
  mode: Mode;
  niveau: NiveauId;
  difficulte: Difficulte;
  dureeMs: number;
  onRejouer(): void;
}

export default function Resultats({ config, etat, mode, niveau, difficulte, dureeMs, onRejouer }: Props) {
  const { ajouterResultat } = useStockage();
  const bilan = useMemo(
    () => calculerBilan(etat.items, etat.reponses, etat.ordre, dureeMs, config.penaliteErreur),
    [etat, dureeMs, config.penaliteErreur],
  );

  // Sauvegarde unique de la séance dans l'historique local.
  const sauve = useRef(false);
  useEffect(() => {
    if (sauve.current) return;
    sauve.current = true;
    const date = new Date().toISOString();
    ajouterResultat({
      id: `${date}-${Math.random().toString(36).slice(2, 8)}`,
      date,
      epreuve: config.id,
      mode,
      niveau,
      difficulte,
      nbItems: bilan.nbItems,
      nbRepondues: bilan.nbRepondues,
      nbCorrectes: bilan.nbCorrectes,
      precision: bilan.precision,
      vitesse: bilan.vitesse,
      vitesseCorrectes: bilan.vitesseCorrectes,
      score: bilan.score,
      dureeMs,
      precisionDebut: bilan.precisionDebut,
      precisionFin: bilan.precisionFin,
      erreurs: bilan.erreurs,
    });
  }, [ajouterResultat, bilan, config.id, difficulte, dureeMs, mode, niveau]);

  const objectif = OBJECTIFS[config.id]?.[niveau];
  const comparaison = objectif ? comparerObjectif(bilan, objectif) : null;
  const baisse =
    bilan.precisionDebut !== null && bilan.precisionFin !== null && bilan.precisionFin < bilan.precisionDebut - 0.1;

  const erreurs = etat.ordre.filter((i) => etat.reponses[i] !== etat.items[i].bonneReponse);

  return (
    <section aria-labelledby="titre-resultats">
      <h1 id="titre-resultats">Résultats : {config.titre}</h1>
      <p className="discret">
        {mode === 'examen' ? 'Examen blanc' : 'Entraînement'} · niveau visé : {libelleNiveau(niveau)} · durée{' '}
        {formatDuree(dureeMs)}
      </p>

      <ul className="tuiles">
        <li>
          <span className="tuile-valeur">{decimal(bilan.score, bilan.score % 1 ? 1 : 0)}</span>
          <span>Score ({bilan.nbCorrectes} bonnes sur {bilan.nbItems})</span>
        </li>
        <li>
          <span className="tuile-valeur">{pourcent(bilan.precision)}</span>
          <span>Précision ({bilan.nbRepondues} réponses données)</span>
        </li>
        <li>
          <span className="tuile-valeur">{decimal(bilan.vitesse)}</span>
          <span>Réponses par minute</span>
        </li>
        <li>
          <span className="tuile-valeur">{decimal(bilan.vitesseCorrectes)}</span>
          <span>Bonnes réponses par minute</span>
        </li>
      </ul>

      {bilan.nbNonRepondues > 0 && (
        <p>
          {bilan.nbNonRepondues} question{bilan.nbNonRepondues > 1 ? 's' : ''} sans réponse. Ce n’est pas anormal : sur
          cette épreuve, il est difficile de tout finir. Mieux vaut moins de questions mais justes.
        </p>
      )}

      {bilan.precisionDebut !== null && bilan.precisionFin !== null && (
        <p>
          Précision début → fin d’épreuve : <strong>{pourcent(bilan.precisionDebut)}</strong> →{' '}
          <strong>{pourcent(bilan.precisionFin)}</strong>.{' '}
          {baisse
            ? 'Tu perds en précision en fin d’épreuve : signe de fatigue ou de précipitation. Ralentis un peu.'
            : 'Ta précision reste stable.'}
        </p>
      )}

      {objectif && comparaison && (
        <div className="encadre">
          <h2>Objectif indicatif ({libelleNiveau(niveau)})</h2>
          <ul>
            <li>
              Précision : {pourcent(bilan.precision)} pour {pourcent(objectif.precisionMin)} visés{' '}
              <strong>{comparaison.precisionOk ? '✓ atteint' : '✗ pas encore'}</strong>
            </li>
            <li>
              Vitesse : {decimal(bilan.vitesseCorrectes)} bonnes réponses/min pour {decimal(objectif.correctesParMinute)}{' '}
              visées <strong>{comparaison.vitesseOk ? '✓ atteint' : '✗ pas encore'}</strong>
            </li>
          </ul>
          <p className="discret">{AVERTISSEMENT_OBJECTIFS}</p>
        </div>
      )}

      <div className="actions">
        <button type="button" className="bouton" onClick={onRejouer}>
          Rejouer
        </button>
        <Link className="bouton bouton-secondaire" to="/">
          Accueil
        </Link>
        <Link className="bouton bouton-secondaire" to="/progression">
          Ma progression
        </Link>
      </div>

      <h2>Correction des erreurs ({erreurs.length})</h2>
      {erreurs.length === 0 ? (
        <p>Aucune erreur sur les questions auxquelles tu as répondu. Bravo.</p>
      ) : (
        <ul className="liste-erreurs">
          {erreurs.map((i) => {
            const item = etat.items[i];
            const choix = etat.reponses[i] as number;
            return (
              <li key={item.id}>
                <details>
                  <summary>
                    {item.consigne}{' '}
                    {item.stimulus.type === 'attention' && (
                      <code>
                        {item.stimulus.a} / {item.stimulus.b}
                      </code>
                    )}
                  </summary>
                  <p>
                    Ta réponse : <strong>{item.options[choix]}</strong> · bonne réponse :{' '}
                    <strong>{item.options[item.bonneReponse]}</strong>
                  </p>
                  <p>{item.explication}</p>
                  <a href={lienSignalement(item)} target="_blank" rel="noopener noreferrer">
                    Signaler une erreur dans cette question
                  </a>
                </details>
              </li>
            );
          })}
        </ul>
      )}
      <p className="discret">{MENTION_ENTRAINEMENT}</p>
    </section>
  );
}
