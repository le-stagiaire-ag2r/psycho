import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MENTION_ENTRAINEMENT, NON_AFFILIATION } from '../config/app';
import { EPREUVES, ORDRE_EPREUVES } from '../config/epreuves';
import { NIVEAUX, OBJECTIFS } from '../config/niveaux';
import { formatDuree } from '../lib/format';
import { erreursARevoir } from '../lib/revision';
import type { Difficulte, Mode, NiveauId } from '../lib/types';
import { useStockage } from '../state/Stockage';

const DIFFICULTES: { id: Difficulte; libelle: string }[] = [
  { id: 1, libelle: 'Facile' },
  { id: 2, libelle: 'Moyen' },
  { id: 3, libelle: 'Difficile' },
];

export default function Accueil() {
  const { donnees, majPrefs } = useStockage();
  const { niveau, mode, difficulte } = donnees.prefs;
  const nbErreurs = useMemo(
    () => erreursARevoir(donnees.historique, new Set(donnees.erreursResolues)).length,
    [donnees.historique, donnees.erreursResolues],
  );

  return (
    <>
      <section className="hero">
        <h1>Entraîne-toi aux tests de sélection</h1>
        <p className="sous-titre">Gratuit, sans compte, sans pub. Ta progression reste sur ton appareil.</p>
        <p className="mention" role="note">
          {NON_AFFILIATION}
        </p>
      </section>

      <section aria-label="Raccourcis" className="raccourcis">
        <Link className="raccourci" to="/examen" data-guide="raccourci-examen">
          <strong>Examen blanc</strong>
          <span>Enchaîne les épreuves, chrono strict</span>
        </Link>
        <Link className="raccourci" to="/revision" data-guide="raccourci-revision">
          <strong>Réviser mes erreurs</strong>
          <span>{nbErreurs > 0 ? `${nbErreurs} à refaire` : 'Rien à refaire pour l’instant'}</span>
        </Link>
        <Link className="raccourci" to="/methode" data-guide="raccourci-methode">
          <strong>Fiches méthode</strong>
          <span>Astuces et pièges, épreuve par épreuve</span>
        </Link>
      </section>

      <section aria-labelledby="titre-reglages" className="carte reglages">
        <h2 id="titre-reglages" className="visuellement-cache">
          Réglages
        </h2>
        <fieldset className="segmente" data-guide="reglage-niveau">
          <legend>Objectif de score</legend>
          {NIVEAUX.map((n) => (
            <label key={n.id}>
              <input
                type="radio"
                name="niveau"
                checked={niveau === n.id}
                onChange={() => majPrefs({ niveau: n.id as NiveauId })}
              />
              <span>{n.libelle}</span>
            </label>
          ))}
        </fieldset>
        <p className="discret reglages-aide">
          Les questions sont les mêmes pour tous : ce choix change seulement le score cible affiché à la fin (indicatif, non officiel).
        </p>

        <fieldset className="segmente" data-guide="reglage-mode">
          <legend>Mode</legend>
          <label>
            <input
              type="radio"
              name="mode"
              checked={mode === 'entrainement'}
              onChange={() => majPrefs({ mode: 'entrainement' as Mode })}
            />
            <span>Entraînement</span>
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              checked={mode === 'examen'}
              onChange={() => majPrefs({ mode: 'examen' as Mode })}
            />
            <span>Examen blanc</span>
          </label>
        </fieldset>

        {mode === 'entrainement' && (
          <>
            <fieldset className="segmente" data-guide="reglage-difficulte">
              <legend>Difficulté</legend>
              {DIFFICULTES.map((d) => (
                <label key={d.id}>
                  <input
                    type="radio"
                    name="difficulte"
                    checked={difficulte === d.id}
                    onChange={() => majPrefs({ difficulte: d.id })}
                  />
                  <span>{d.libelle}</span>
                </label>
              ))}
            </fieldset>
            <p className="discret reglages-aide">
              Les questions sont toujours nouvelles. <strong>Facile</strong> : pour découvrir une épreuve et comprendre sa logique.{' '}
              <strong>Moyen</strong> : le bon réglage pour s’entraîner (on vise 60 à 75 % de réussite).{' '}
              <strong>Difficile</strong> : plus de pièges, à prendre quand le moyen devient trop facile. Si tu réussis plus de 85 %, monte d’un cran ; sous 50 %, redescends.
            </p>

          </>
        )}
        <p className="discret reglages-aide">
          {mode === 'entrainement'
            ? 'Entraînement : chrono souple, explication après chaque erreur.'
            : 'Examen blanc : chrono strict, correction à la fin.'}
        </p>
      </section>

      <section aria-labelledby="titre-epreuves">
        <h2 id="titre-epreuves">Épreuves</h2>
        <ul className="grille-epreuves">
          {ORDRE_EPREUVES.filter((id) => EPREUVES[id].disponible).map((id, rang, liste) => {
            const c = EPREUVES[id];
            const objectif = OBJECTIFS[id]?.[niveau];
            if (!c.disponible) return null;
            return (
              <li key={id} className="carte carte-epreuve" data-guide={rang === 0 ? 'epreuve' : id === 'personnalite' ? 'personnalite' : undefined}>
                <span className="indice">
                  {String(rang + 1).padStart(2, '0')} / {String(liste.length).padStart(2, '0')}
                </span>
                <h3>{c.titre}</h3>
                <p className="description">{c.description}</p>
                <p className="discret">
                  {id === 'personnalite'
                    ? 'Sans score ni bonne réponse'
                    : mode === 'examen'
                    ? `${c.nbQuestions} questions · ${formatDuree(c.dureeSecondes * 1000)}`
                    : `${c.nbQuestionsEntrainement} questions`}
                  {objectif && mode === 'examen' && ` · objectif ${Math.round(objectif.precisionMin * 100)} %`}
                </p>
                <Link className="bouton" to={id === 'personnalite' ? '/personnalite' : `/epreuve/${id}/${mode}`}>
                  {id === 'personnalite' ? 'Découvrir' : mode === 'examen' ? 'Lancer' : 'S’entraîner'}
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="discret centre">
          Formats indicatifs : ils peuvent différer des épreuves réelles. {MENTION_ENTRAINEMENT}
        </p>
      </section>
    </>
  );
}
