import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MENTION_ENTRAINEMENT } from '../config/app';
import type { ConfigEpreuve } from '../config/epreuves';
import { AVERTISSEMENT_OBJECTIFS, OBJECTIFS, libelleNiveau } from '../config/niveaux';
import { decimal, formatDuree, pourcent } from '../lib/format';
import { creerResultat } from '../lib/resultat';
import { calculerBilan, comparerObjectif } from '../lib/scoring';
import type { EtatSeance } from '../lib/session';
import type { Difficulte, Mode, NiveauId } from '../lib/types';
import { useStockage } from '../state/Stockage';
import ListeErreurs from '../components/ListeErreurs';

interface Props {
  config: ConfigEpreuve;
  etat: EtatSeance;
  mode: Mode;
  niveau: NiveauId;
  difficulte: Difficulte;
  dureeMs: number;
  onRejouer?: () => void;
  /** false pour une séance de révision : rien n'est ajouté à l'historique */
  sauvegarder?: boolean;
  /** Appelé une fois, à l'affichage des résultats (ex. marquer des erreurs comme résolues) */
  onTermine?: (etat: EtatSeance) => void;
  /** Contenu complémentaire affiché sous les boutons (ex. lien vers la fiche méthode) */
  actionsSupplementaires?: React.ReactNode;
}

export default function Resultats({
  config,
  etat,
  mode,
  niveau,
  difficulte,
  dureeMs,
  onRejouer,
  sauvegarder = true,
  onTermine,
  actionsSupplementaires,
}: Props) {
  const { ajouterResultat } = useStockage();
  const bilan = useMemo(
    () => calculerBilan(etat.items, etat.reponses, etat.ordre, dureeMs, config.penaliteErreur),
    [etat, dureeMs, config.penaliteErreur],
  );

  // Sauvegarde unique de la séance dans l'historique local.
  const fait = useRef(false);
  useEffect(() => {
    if (fait.current) return;
    fait.current = true;
    if (sauvegarder) ajouterResultat(creerResultat(bilan, { epreuve: config.id, mode, niveau, difficulte, dureeMs }));
    onTermine?.(etat);
  }, [ajouterResultat, bilan, config.id, difficulte, dureeMs, etat, mode, niveau, onTermine, sauvegarder]);

  const objectif = OBJECTIFS[config.id]?.[niveau];
  const comparaison = objectif ? comparerObjectif(bilan, objectif) : null;
  const baisse =
    bilan.precisionDebut !== null && bilan.precisionFin !== null && bilan.precisionFin < bilan.precisionDebut - 0.1;

  return (
    <section aria-labelledby="titre-resultats">
      <h1 id="titre-resultats">Résultats : {config.titre}</h1>
      <p className="discret">
        {mode === 'examen' ? 'Examen blanc' : 'Entraînement'} · niveau visé : {libelleNiveau(niveau)} · durée{' '}
        {formatDuree(dureeMs)}
        {!sauvegarder && ' · révision (non ajoutée à l’historique)'}
      </p>

      <ul className="tuiles">
        <li>
          <span className="tuile-valeur">{decimal(bilan.score, bilan.score % 1 ? 1 : 0)}</span>
          <span>Score ({bilan.nbCorrectes} bonne{bilan.nbCorrectes > 1 ? 's' : ''} sur {bilan.nbItems})</span>
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
        {onRejouer && (
          <button type="button" className="bouton" onClick={onRejouer}>
            Rejouer
          </button>
        )}
        <Link className="bouton bouton-secondaire" to="/">
          Accueil
        </Link>
        <Link className="bouton bouton-secondaire" to="/progression">
          Ma progression
        </Link>
        <Link className="bouton bouton-secondaire" to={`/methode/${config.id}`}>
          Fiche méthode
        </Link>
        {actionsSupplementaires}
      </div>

      <ListeErreurs etat={etat} />
      <p className="discret">{MENTION_ENTRAINEMENT}</p>
    </section>
  );
}

