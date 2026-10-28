import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import personnaliteJson from '../data/personnalite.json';
import { creerPrng, graineAleatoire } from '../lib/prng';
import { formatDuree } from '../lib/format';

/**
 * Personnalité : MODE DÉCOUVERTE uniquement.
 * - aucun score, aucun profil, aucune « bonne » réponse ;
 * - les réponses restent en mémoire le temps de la séance et ne sont ni enregistrées ni envoyées nulle part ;
 * - le but est de se familiariser avec le format (échelle en 5 points, nombreuses affirmations).
 */
interface Affirmation {
  id: string;
  dimension: string;
  texte: string;
}

const AFFIRMATIONS = (personnaliteJson as { items: Affirmation[] }).items;

const ECHELLE = [
  'Pas du tout d’accord',
  'Plutôt pas d’accord',
  'Ni d’accord, ni pas d’accord',
  'Plutôt d’accord',
  'Tout à fait d’accord',
];

const DIMENSIONS: { nom: string; texte: string }[] = [
  { nom: 'Extraversion', texte: 'Le goût du contact, de l’action et de la prise de parole, par opposition à la réserve et à la discrétion.' },
  { nom: 'Agréabilité', texte: 'L’attention portée aux autres : empathie, coopération, bienveillance.' },
  { nom: 'Conscience', texte: 'Le sens de l’organisation, du détail et du devoir : planification, rigueur, persévérance.' },
  { nom: 'Stabilité émotionnelle', texte: 'La façon de vivre le stress et les variations d’humeur (son contraire est parfois appelé « névrosisme »).' },
  { nom: 'Ouverture', texte: 'La curiosité intellectuelle, l’imagination et le goût des idées nouvelles ou abstraites.' },
];

// Tailles proposées : le vrai questionnaire est annoncé long (100 à 250 affirmations, environ 251 en 50 minutes selon des témoignages), on permet donc de s'entraîner à l'endurance.
const TOTAL = AFFIRMATIONS.length;
const TAILLES = [25, 50, 100, 150, 200, TOTAL];

export default function Personnalite() {
  const [etape, setEtape] = useState<'intro' | 'questionnaire' | 'fin'>('intro');
  const [taille, setTaille] = useState(25);
  const [graine, setGraine] = useState(graineAleatoire);
  const [index, setIndex] = useState(0);
  const [nbRepondues, setNbRepondues] = useState(0);
  const [debut, setDebut] = useState(0);
  const [fin, setFin] = useState(0);

  const questions = useMemo(() => creerPrng(graine).melanger(AFFIRMATIONS).slice(0, taille), [graine, taille]);
  // Les réponses ne sont volontairement PAS conservées : seule la progression compte pour la mise en situation.

  const repondre = () => {
    setNbRepondues((n) => n + 1);
    if (index + 1 >= questions.length) {
      setFin(Date.now());
      setEtape('fin');
    } else setIndex(index + 1);
  };

  useEffect(() => {
    if (etape !== 'questionnaire') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= 5) repondre();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const commencer = () => {
    setGraine(graineAleatoire());
    setIndex(0);
    setNbRepondues(0);
    setDebut(Date.now());
    setEtape('questionnaire');
  };

  if (etape === 'intro') {
    return (
      <section aria-labelledby="titre-perso">
        <h1 id="titre-perso">Personnalité : mode découverte</h1>
        <p className="encadre" role="note">
          Il n’y a <strong>aucune bonne réponse</strong>, <strong>aucun score</strong> et <strong>aucun profil</strong> ici.
          Ce questionnaire sert uniquement à te familiariser avec le format : beaucoup d’affirmations, une échelle en 5
          points, à enchaîner sans trop réfléchir. Ce n’est pas une reproduction du test réel et il ne prédit rien.
        </p>
        <p>
          <strong>Tes réponses ne sont ni enregistrées ni envoyées</strong> : elles restent dans la page le temps de la
          séance, puis disparaissent.
        </p>
        <h2>Les cinq grandes dimensions</h2>
        <p>
          Les questionnaires de personnalité de type « Big Five » regroupent les affirmations autour de cinq dimensions.
          Aucune n’est « meilleure » qu’une autre dans l’absolu :
        </p>
        <ul>
          {DIMENSIONS.map((d) => (
            <li key={d.nom}>
              <strong>{d.nom}</strong> : {d.texte}
            </li>
          ))}
        </ul>
        <fieldset>
          <legend>Nombre d’affirmations</legend>
          {TAILLES.map((t) => (
            <label key={t} className="choix">
              <input type="radio" name="taille" checked={taille === t} onChange={() => setTaille(t)} />
              {t} affirmations
              {t === TOTAL ? ' (toutes)' : ''}
            </label>
          ))}
        </fieldset>
        <p className="discret">
          Le vrai questionnaire est annoncé comme long (de 100 à 250 affirmations selon les témoignages, par exemple 251
          en 50 minutes, soit environ 12 secondes par affirmation : à valider) et reformule plusieurs fois les mêmes
          idées : c’est aussi le cas ici, avec {TOTAL} affirmations tirées de l’inventaire en accès libre IPIP
          (traduites et reformulées, voir ATTRIBUTIONS.md). Cet inventaire n’est pas le test réel.
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

  if (etape === 'fin') {
    return (
      <section aria-labelledby="titre-fin">
        <h1 id="titre-fin">Terminé</h1>
        <p>
          Tu as répondu à <strong>{nbRepondues}</strong> affirmations en <strong>{formatDuree(fin - debut)}</strong>.
        </p>
        <p className="encadre" role="note">
          Aucun score n’est calculé, aucune réponse n’a été conservée : il n’y a rien à « réussir ». Retiens surtout le
          format, et le fait qu’une longue série d’affirmations demande de rester attentif et régulier jusqu’au bout.
        </p>
        <div className="actions">
          <button type="button" className="bouton" onClick={() => setEtape('intro')}>
            Recommencer
          </button>
          <Link className="bouton bouton-secondaire" to="/">
            Accueil
          </Link>
        </div>
      </section>
    );
  }

  const courante = questions[index];
  return (
    <section aria-label="Questionnaire de personnalité (mode découverte)">
      <div className="barre-seance">
        <span>
          Affirmation {index + 1} / {questions.length}
        </span>
        <span className="discret">Mode découverte : aucune réponse n’est enregistrée</span>
      </div>
      <progress max={questions.length} value={index} aria-label="Progression" />
      <p className="enonce affirmation">{courante.texte}</p>
      <div className="echelle" role="group" aria-label="Échelle de réponse">
        {ECHELLE.map((libelle, i) => (
          <button key={libelle} type="button" className="option" onClick={repondre}>
            <kbd>{i + 1}</kbd> {libelle}
          </button>
        ))}
      </div>
      <div className="actions">
        <button
          type="button"
          className="bouton-lien"
          onClick={() => {
            setFin(Date.now());
            setEtape('fin');
          }}
        >
          Terminer maintenant
        </button>
      </div>
    </section>
  );
}
