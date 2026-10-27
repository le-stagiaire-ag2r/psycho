import { Link } from 'react-router-dom';
import { MENTION_ENTRAINEMENT, NON_AFFILIATION } from '../config/app';
import { EPREUVES, ORDRE_EPREUVES } from '../config/epreuves';
import { NIVEAUX, OBJECTIFS } from '../config/niveaux';
import { formatDuree } from '../lib/format';
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

  return (
    <>
      <section>
        <h1>Entraînement aux tests de sélection</h1>
        <p className="encadre" role="note">
          {NON_AFFILIATION}
        </p>
        <p>
          100 % gratuit, sans compte, sans pub. Les questions sont générées dans ton navigateur et ta progression reste
          sur ton appareil. {MENTION_ENTRAINEMENT}
        </p>
      </section>

      <section aria-labelledby="titre-reglages" className="reglages">
        <h2 id="titre-reglages">Réglages</h2>

        <fieldset>
          <legend>Niveau visé</legend>
          {NIVEAUX.map((n) => (
            <label key={n.id} className="choix">
              <input
                type="radio"
                name="niveau"
                checked={niveau === n.id}
                onChange={() => majPrefs({ niveau: n.id as NiveauId })}
              />
              {n.libelle}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Mode</legend>
          <label className="choix">
            <input
              type="radio"
              name="mode"
              checked={mode === 'entrainement'}
              onChange={() => majPrefs({ mode: 'entrainement' as Mode })}
            />
            Entraînement (chrono souple, correction après chaque question)
          </label>
          <label className="choix">
            <input
              type="radio"
              name="mode"
              checked={mode === 'examen'}
              onChange={() => majPrefs({ mode: 'examen' as Mode })}
            />
            Examen blanc (chrono strict, correction à la fin)
          </label>
        </fieldset>

        {mode === 'entrainement' && (
          <fieldset>
            <legend>Difficulté</legend>
            {DIFFICULTES.map((d) => (
              <label key={d.id} className="choix">
                <input
                  type="radio"
                  name="difficulte"
                  checked={difficulte === d.id}
                  onChange={() => majPrefs({ difficulte: d.id })}
                />
                {d.libelle}
              </label>
            ))}
          </fieldset>
        )}
      </section>

      <section aria-labelledby="titre-epreuves">
        <h2 id="titre-epreuves">Épreuves</h2>
        <p className="discret">
          Les formats (nombre de questions, durée) sont indicatifs et peuvent différer des épreuves réelles.
        </p>
        <ul className="grille-epreuves">
          {ORDRE_EPREUVES.map((id) => {
            const c = EPREUVES[id];
            const objectif = OBJECTIFS[id]?.[niveau];
            return (
              <li key={id} className={`carte ${c.disponible ? '' : 'carte-inactive'}`}>
                <h3>{c.titre}</h3>
                <p>{c.description}</p>
                {c.disponible ? (
                  <>
                    <p className="discret">
                      {id === 'personnalite'
                        ? 'Mode découverte : sans score, sans bonne réponse, rien n’est enregistré'
                        : mode === 'examen'
                        ? `${c.nbQuestions} questions en ${formatDuree(c.dureeSecondes * 1000)} (indicatif)`
                        : `${c.nbQuestionsEntrainement} questions, chrono souple`}
                      {objectif && mode === 'examen' && ` · objectif indicatif : ${Math.round(objectif.precisionMin * 100)} % de précision`}
                    </p>
                    <Link className="bouton" to={id === 'personnalite' ? '/personnalite' : `/epreuve/${id}/${mode}`}>
                      {id === 'personnalite' ? 'Découvrir' : mode === 'examen' ? 'Lancer l’examen blanc' : 'S’entraîner'}
                    </Link>
                  </>
                ) : (
                  <p className="discret">Bientôt disponible</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
