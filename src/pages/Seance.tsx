import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import ModalCorrection from '../components/ModalCorrection';
import QuestionView from '../components/QuestionView';
import { NON_AFFILIATION } from '../config/app';
import { EPREUVES, type ConfigEpreuve } from '../config/epreuves';
import { libelleNiveau } from '../config/niveaux';
import { GENERATEURS, genererItem } from '../generateurs';
import { formatDuree } from '../lib/format';
import { graineAleatoire } from '../lib/prng';
import {
  avancer,
  demarrer,
  enregistrerReponse,
  indexCourant,
  passer,
  terminer,
  type EtatSeance,
} from '../lib/session';
import type { Difficulte, EpreuveId, ItemRef, Mode, NiveauId } from '../lib/types';
import { dureeEffectiveSecondes } from '../lib/chrono';
import { useStockage } from '../state/Stockage';
import Resultats from './Resultats';

export default function Seance() {
  const { epreuve, mode } = useParams();
  const { donnees } = useStockage();
  const [manche, setManche] = useState(0);
  const config = EPREUVES[epreuve as EpreuveId];

  if (!config || !config.disponible || !GENERATEURS[config.id] || (mode !== 'entrainement' && mode !== 'examen')) {
    return (
      <p>
        Cette épreuve n’existe pas ou n’est pas encore disponible. <Link to="/">Retour à l’accueil</Link>
      </p>
    );
  }

  return (
    <SeanceInner
      key={manche}
      config={config}
      mode={mode}
      niveau={donnees.prefs.niveau}
      difficulteChoisie={donnees.prefs.difficulte}
      onRejouer={() => setManche((m) => m + 1)}
    />
  );
}

export interface SeanceProps {
  config: ConfigEpreuve;
  mode: Mode;
  niveau: NiveauId;
  difficulteChoisie: Difficulte;
  /** Questions imposées (révision des erreurs) : remplacent le tirage aléatoire */
  refs?: ItemRef[];
  onRejouer?: () => void;
  /**
   * Enchaînement (examen blanc) : si fourni, la séance n'affiche pas ses résultats, elle appelle
   * ce callback une seule fois à la fin et laisse l'appelant continuer.
   */
  onFin?: (etat: EtatSeance, dureeMs: number, difficulte: Difficulte) => void;
  /** false pour une révision : le résultat n'est pas ajouté à l'historique */
  sauvegarder?: boolean;
  onResultats?: (etat: EtatSeance) => void;
  /** Bandeau affiché au-dessus de la séance (ex. « Épreuve 2 / 6 ») */
  bandeau?: ReactNode;
  /** Texte du bouton de départ (par défaut « Commencer ») */
  libelleDepart?: string;
  /** Actions complémentaires sur l'écran de résultats */
  actionsResultats?: ReactNode;
}

export function SeanceInner({
  config,
  mode,
  niveau,
  difficulteChoisie,
  refs: refsImposees,
  onRejouer,
  onFin,
  sauvegarder = true,
  onResultats,
  bandeau,
  libelleDepart = 'Commencer',
  actionsResultats,
}: SeanceProps) {
  const { donnees: donneesChrono } = useStockage();
  const examen = mode === 'examen';
  const difficulte: Difficulte = refsImposees?.[0]?.difficulte ?? (examen ? config.difficulteExamen : difficulteChoisie);
  const nbQuestions = refsImposees?.length ?? (examen ? config.nbQuestions : config.nbQuestionsEntrainement);

  // Les questions sont dérivées d'une graine de séance : reproductibles et signalables.
  const [graineBase] = useState(graineAleatoire);
  const items = useMemo(() => {
    const refs =
      refsImposees ?? GENERATEURS[config.id]!.construireRefs({ graineBase, nb: nbQuestions, difficulte, config });
    return refs.map(genererItem);
  }, [config, graineBase, nbQuestions, difficulte, refsImposees]);

  const [etat, setEtat] = useState<EtatSeance | null>(null);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  /** Mode entraînement : choix affiché pendant la correction, avant de passer à la suite */
  const [choixAffiche, setChoixAffiche] = useState<number | null>(null);
  /** Fenêtre de correction ouverte, et position (dans `ordre`) de la question qu'elle affiche */
  const [modale, setModale] = useState(false);
  const [vue, setVue] = useState(0);

  // Horloge : tant que la séance tourne.
  const enCours = etat !== null && !etat.fini;
  useEffect(() => {
    if (!enCours) return;
    const id = window.setInterval(() => setMaintenant(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [enCours]);

  // Fin automatique du chrono strict en examen blanc.
  const dureeMaxMs = dureeEffectiveSecondes(config.dureeSecondes, donneesChrono.prefs.chrono) * 1000;
  const chronoLimite = Number.isFinite(dureeMaxMs);
  const restantMs = examen && chronoLimite && etat ? dureeMaxMs - (maintenant - etat.debutMs) : null;
  useEffect(() => {
    if (etat && !etat.fini && restantMs !== null && restantMs <= 0) {
      setEtat(terminer(etat, etat.debutMs + dureeMaxMs));
      setChoixAffiche(null);
    }
  }, [restantMs, etat, dureeMaxMs]);

  const index = etat ? indexCourant(etat) : null;
  const item = etat && index !== null ? etat.items[index] : null;

  const commencer = () => {
    const t = Date.now();
    setMaintenant(t);
    setEtat(demarrer(items, t));
  };

  const repondre = (choix: number) => {
    if (!etat || etat.fini || choixAffiche !== null) return;
    const t = Date.now();
    const apres = enregistrerReponse(etat, choix, t);
    if (examen) setEtat(avancer(apres, t));
    else {
      setEtat(apres);
      setChoixAffiche(choix);
      // Une erreur ouvre tout de suite la correction ; une bonne réponse laisse avancer sans interruption.
      if (choix !== etat.items[indexCourant(etat) ?? 0].bonneReponse) {
        setVue(apres.ordre.length - 1);
        setModale(true);
      }
    }
  };

  const suivant = () => {
    if (!etat) return;
    setEtat(avancer(etat, Date.now()));
    setChoixAffiche(null);
    setModale(false);
  };

  const passerQuestion = () => {
    if (!etat || etat.fini || choixAffiche !== null || !config.passerAutorise) return;
    setEtat(passer(etat, Date.now()));
  };

  const abandonner = () => {
    if (!etat) return;
    setEtat(terminer(etat, Date.now()));
    setChoixAffiche(null);
    setModale(false);
  };

  // Raccourcis clavier : 1-9 pour répondre, ← / → pour les questions à deux choix, P pour passer.
  useEffect(() => {
    if (!etat || etat.fini || !item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || choixAffiche !== null || modale) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= item.options.length) repondre(n - 1);
      else if (item.options.length === 2 && e.key === 'ArrowLeft') repondre(0);
      else if (item.options.length === 2 && e.key === 'ArrowRight') repondre(1);
      else if (e.key === 'p' || e.key === 'P') passerQuestion();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ---------- Fin de séance ----------
  const dejaSignale = useRef(false);
  const fini = etat?.fini ?? false;
  const duree = etat ? Math.min((etat.finMs ?? maintenant) - etat.debutMs, examen ? dureeMaxMs : Infinity) : 0;
  useEffect(() => {
    if (fini && etat && onFin && !dejaSignale.current) {
      dejaSignale.current = true;
      onFin(etat, duree, difficulte);
    }
  }, [fini, etat, onFin, duree, difficulte]);

  if (etat?.fini) {
    if (onFin) return <p role="status">Épreuve terminée…</p>;
    return (
      <Resultats
        config={config}
        etat={etat}
        mode={mode}
        niveau={niveau}
        difficulte={difficulte}
        dureeMs={duree}
        onRejouer={onRejouer}
        sauvegarder={sauvegarder}
        onTermine={onResultats}
        actionsSupplementaires={actionsResultats}
      />
    );
  }

  // ---------- Écran de départ ----------
  if (!etat || !item) {
    return (
      <section aria-labelledby="titre-depart" className="depart">
        {bandeau}
        <h1 id="titre-depart">{config.titre}</h1>
        <p className="sous-titre">{config.description}</p>
        <ul className="puces">
          <li>{examen ? 'Examen blanc' : 'Entraînement'}</li>
          <li>{nbQuestions} questions</li>
          <li>{examen ? (chronoLimite ? `Chrono ${formatDuree(dureeMaxMs)}` : 'Sans limite de temps') : 'Chrono souple'}</li>
          <li>Niveau : {libelleNiveau(niveau)}</li>
          {config.materiel && <li>{config.materiel}</li>}
          {examen && chronoLimite && <li>Le test s’arrête net à la fin du temps</li>}
        </ul>
        <div className="actions actions-centre">
          <button type="button" className="bouton bouton-grand" onClick={commencer} autoFocus>
            {libelleDepart}
          </button>
        </div>
        <p className="discret centre">
          Touches 1 à {Math.min(config.nbChoix, 9)}
          {config.nbChoix === 2 ? ' ou ← / →' : ''} pour répondre
          {config.passerAutorise ? ', P pour passer' : ''}.
        </p>
        <details className="repli">
          <summary>Conseils pour cette épreuve</summary>
          <ul>
            {config.conseils.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          {config.avertissement && <p className="discret">{config.avertissement}</p>}
          <p className="discret">Formats indicatifs. {NON_AFFILIATION}</p>
        </details>
        <div className="actions actions-centre">
          {!onFin && (
            <Link className="bouton-lien" to="/">
              Retour
            </Link>
          )}
          <Link className="bouton-lien" to={`/methode/${config.id}`} target="_blank">
            Fiche méthode
          </Link>
        </div>
      </section>
    );
  }

  // ---------- Question en cours ----------
  const restantes = etat.file.length;
  const faites = etat.ordre.length;
  const ecouleMs = maintenant - etat.debutMs;
  const alerte = restantMs !== null && restantMs < 30000;

  const correct = choixAffiche !== null && choixAffiche === item.bonneReponse;
  const libelleSuivant = restantes <= 1 ? 'Voir le résultat' : 'Question suivante';

  return (
    <section aria-label={`Séance ${config.titre}`} className="seance">
      {bandeau}
      <div className="barre-seance">
        <span>
          Question {faites + 1} <span className="discret">/ {etat.items.length}</span>
        </span>
        <span
          className={`chrono ${alerte ? 'chrono-alerte' : ''}`}
          role="timer"
          aria-label={restantMs !== null ? 'Temps restant' : 'Temps écoulé'}
        >
          {restantMs !== null ? formatDuree(Math.max(0, restantMs)) : formatDuree(ecouleMs)}
        </span>
      </div>
      <progress max={etat.items.length} value={faites} aria-label="Progression" />

      <QuestionView key={item.id + faites} item={item} choix={choixAffiche} onChoisir={repondre} />

      {choixAffiche !== null && (
        <div className={`retour ${correct ? 'retour-ok' : 'retour-ko'}`} role="status">
          <strong>{correct ? '✓ Bonne réponse' : '✗ Raté'}</strong>
          <button type="button" className="bouton-lien" onClick={() => { setVue(etat.ordre.length - 1); setModale(true); }}>
            {correct ? 'Pourquoi ?' : 'Voir l’explication'}
          </button>
        </div>
      )}

      <div className="actions actions-centre">
        {choixAffiche !== null ? (
          <button type="button" className="bouton bouton-grand" onClick={suivant} autoFocus={!modale}>
            {libelleSuivant}
          </button>
        ) : (
          config.passerAutorise &&
          restantes > 1 && (
            <button type="button" className="bouton bouton-secondaire" onClick={passerQuestion}>
              Passer (P)
            </button>
          )
        )}
      </div>
      <div className="actions actions-centre actions-discretes">
        <button type="button" className="bouton-lien" onClick={abandonner}>
          Terminer maintenant
        </button>
        {(choixAffiche !== null || !examen) && (
          <span className="discret">
            Réf. {item.id} ·{' '}
            <a href={`/commentaire?ref=${encodeURIComponent(item.id)}`} target="_blank" rel="noopener noreferrer">
              un souci avec cette question ? (nouvel onglet)
            </a>
          </span>
        )}
      </div>

      {modale && !examen && (
        <ModalCorrection
          items={etat.items}
          reponses={etat.reponses}
          ordre={etat.ordre}
          vue={Math.min(vue, etat.ordre.length - 1)}
          onVue={setVue}
          onFermer={() => setModale(false)}
          onSuivant={suivant}
          libelleSuivant={libelleSuivant}
        />
      )}
    </section>
  );
}
