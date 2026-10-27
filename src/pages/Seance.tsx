import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QuestionView from '../components/QuestionView';
import { EPREUVES, type ConfigEpreuve } from '../config/epreuves';
import { NON_AFFILIATION } from '../config/app';
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
import { lienSignalement } from '../lib/signalement';
import type { Difficulte, EpreuveId, Mode, NiveauId } from '../lib/types';
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

interface InnerProps {
  config: ConfigEpreuve;
  mode: Mode;
  niveau: NiveauId;
  difficulteChoisie: Difficulte;
  onRejouer(): void;
}

function SeanceInner({ config, mode, niveau, difficulteChoisie, onRejouer }: InnerProps) {
  const examen = mode === 'examen';
  const difficulte: Difficulte = examen ? config.difficulteExamen : difficulteChoisie;
  const nbQuestions = examen ? config.nbQuestions : config.nbQuestionsEntrainement;

  // Les questions sont dérivées d'une graine de séance : reproductibles et signalables.
  const [graineBase] = useState(graineAleatoire);
  const items = useMemo(() => {
    const gen = GENERATEURS[config.id]!;
    return gen.construireRefs({ graineBase, nb: nbQuestions, difficulte, config }).map(genererItem);
  }, [config, graineBase, nbQuestions, difficulte]);

  const [etat, setEtat] = useState<EtatSeance | null>(null);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  /** Mode entraînement : choix affiché pendant la correction, avant de passer à la suite */
  const [choixAffiche, setChoixAffiche] = useState<number | null>(null);

  // Horloge : tant que la séance tourne.
  const enCours = etat !== null && !etat.fini;
  useEffect(() => {
    if (!enCours) return;
    const id = window.setInterval(() => setMaintenant(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [enCours]);

  // Fin automatique du chrono strict en examen blanc.
  const dureeMaxMs = config.dureeSecondes * 1000;
  const restantMs = examen && etat ? dureeMaxMs - (maintenant - etat.debutMs) : null;
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
    }
  };

  const suivant = () => {
    if (!etat) return;
    setEtat(avancer(etat, Date.now()));
    setChoixAffiche(null);
  };

  const passerQuestion = () => {
    if (!etat || etat.fini || choixAffiche !== null || !config.passerAutorise) return;
    setEtat(passer(etat, Date.now()));
  };

  const abandonner = () => {
    if (!etat) return;
    setEtat(terminer(etat, Date.now()));
    setChoixAffiche(null);
  };

  // Raccourcis clavier : 1-9 pour répondre, ← / → pour les questions à deux choix, P pour passer.
  useEffect(() => {
    if (!etat || etat.fini || !item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || choixAffiche !== null) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= item.options.length) repondre(n - 1);
      else if (item.options.length === 2 && e.key === 'ArrowLeft') repondre(0);
      else if (item.options.length === 2 && e.key === 'ArrowRight') repondre(1);
      else if (e.key === 'p' || e.key === 'P') passerQuestion();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ---------- Écran de fin ----------
  if (etat?.fini) {
    const fin = etat.finMs ?? maintenant;
    let dureeMs = fin - etat.debutMs;
    if (examen) dureeMs = Math.min(dureeMs, dureeMaxMs);
    return (
      <Resultats
        config={config}
        etat={etat}
        mode={mode}
        niveau={niveau}
        difficulte={difficulte}
        dureeMs={dureeMs}
        onRejouer={onRejouer}
      />
    );
  }

  // ---------- Écran de départ ----------
  if (!etat || !item) {
    return (
      <section aria-labelledby="titre-depart">
        <h1 id="titre-depart">{config.titre}</h1>
        <p>{config.description}</p>
        <ul className="infos">
          <li>Mode : {examen ? 'examen blanc' : 'entraînement'}</li>
          <li>Niveau visé : {libelleNiveau(niveau)}</li>
          <li>
            {nbQuestions} questions
            {examen ? `, chrono strict de ${formatDuree(dureeMaxMs)}` : ', chrono souple (il ne coupe pas la séance)'}
          </li>
          {!examen && <li>Correction détaillée après chaque réponse</li>}
          <li>Raccourcis : touches 1 à {config.nbChoix}{config.nbChoix === 2 ? ' ou ← / →' : ''}{config.passerAutorise ? ', P pour passer' : ''}</li>
        </ul>
        <h2>Conseils</h2>
        <ul>
          {config.conseils.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="discret">
          Formats indicatifs, reconstitués à partir d’informations publiques. {NON_AFFILIATION}
        </p>
        <div className="actions">
          <button type="button" className="bouton" onClick={commencer} autoFocus>
            Commencer
          </button>
          <Link className="bouton bouton-secondaire" to="/">
            Retour
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

  return (
    <section aria-label={`Séance ${config.titre}`}>
      <div className="barre-seance">
        <span>
          Question {faites + 1} / {etat.items.length}
        </span>
        <span
          className={`chrono ${alerte ? 'chrono-alerte' : ''}`}
          role="timer"
          aria-label={examen ? 'Temps restant' : 'Temps écoulé'}
        >
          {examen ? formatDuree(Math.max(0, restantMs ?? 0)) : formatDuree(ecouleMs)}
        </span>
      </div>
      <progress max={etat.items.length} value={faites} aria-label="Progression" />

      <QuestionView key={item.id + faites} item={item} choix={choixAffiche} onChoisir={repondre} />

      <div className="actions">
        {choixAffiche !== null ? (
          <button type="button" className="bouton" onClick={suivant} autoFocus>
            {restantes <= 1 ? 'Voir le résultat' : 'Question suivante'}
          </button>
        ) : (
          config.passerAutorise &&
          restantes > 1 && (
            <button type="button" className="bouton bouton-secondaire" onClick={passerQuestion}>
              Passer (P)
            </button>
          )
        )}
        <button type="button" className="bouton-lien" onClick={abandonner}>
          Terminer maintenant
        </button>
        {(choixAffiche !== null || !examen) && (
          <a className="discret" href={lienSignalement(item)} target="_blank" rel="noopener noreferrer">
            Signaler une erreur
          </a>
        )}
      </div>
    </section>
  );
}
