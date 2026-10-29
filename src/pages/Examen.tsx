import { useState } from 'react';
import { Link } from 'react-router-dom';
import ChoixChrono from '../components/ChoixChrono';
import ListeErreurs from '../components/ListeErreurs';
import { EPREUVES_EXAMEN, EPREUVES_OPTIONNELLES_EXAMEN } from '../config/examen';
import { EPREUVES, type ConfigEpreuve } from '../config/epreuves';
import { AVERTISSEMENT_OBJECTIFS, OBJECTIFS, libelleNiveau } from '../config/niveaux';
import { dureeEffectiveSecondes } from '../lib/chrono';
import { decimal, formatDuree, pourcent } from '../lib/format';
import { creerResultat } from '../lib/resultat';
import { calculerBilan, comparerObjectif, type Bilan } from '../lib/scoring';
import type { EtatSeance } from '../lib/session';
import type { Difficulte, EpreuveId } from '../lib/types';
import { useStockage } from '../state/Stockage';
import { SeanceInner } from './Seance';

interface ResultatEtape {
  config: ConfigEpreuve;
  etat: EtatSeance;
  bilan: Bilan;
  dureeMs: number;
}

export default function Examen() {
  const { donnees, ajouterResultat } = useStockage();
  const niveau = donnees.prefs.niveau;
  const [choisies, setChoisies] = useState<EpreuveId[]>(EPREUVES_EXAMEN);
  const [etape, setEtape] = useState<number | null>(null); // null = écran d'accueil de l'examen
  const [resultats, setResultats] = useState<ResultatEtape[]>([]);
  const [examenId, setExamenId] = useState('');
  const [manche, setManche] = useState(0);

  const configs = choisies.map((id) => EPREUVES[id]);
  const chrono = donnees.prefs.chrono;
  const dureeTotale = configs.reduce((s, c) => s + dureeEffectiveSecondes(c.dureeSecondes, chrono), 0) * 1000;

  const demarrer = () => {
    setExamenId(`ex-${new Date().toISOString()}-${Math.random().toString(36).slice(2, 6)}`);
    setResultats([]);
    setEtape(0);
    setManche((m) => m + 1);
  };

  const basculer = (id: EpreuveId) =>
    setChoisies((c) =>
      c.includes(id)
        ? c.filter((x) => x !== id)
        : [...EPREUVES_EXAMEN, ...EPREUVES_OPTIONNELLES_EXAMEN].filter((x) => x === id || c.includes(x)),
    );

  // ---------- Accueil de l'examen ----------
  if (etape === null) {
    return (
      <section aria-labelledby="titre-examen">
        <h1 id="titre-examen">Examen blanc complet</h1>
        <p>
          Enchaîne les épreuves comme un vrai test sur ordinateur : avec un chrono, correction à la fin. Chaque épreuve
          est enregistrée dans ta progression.
        </p>
        <p className="encadre" role="note">
          Formats indicatifs : nombre de questions, durées et ordre sont reconstitués à partir de témoignages et peuvent
          différer du test réel. Niveau visé : <strong>{libelleNiveau(niveau)}</strong> (modifiable sur l’accueil).
        </p>
        <fieldset>
          <legend>Épreuves de l’examen</legend>
          {[...EPREUVES_EXAMEN, ...EPREUVES_OPTIONNELLES_EXAMEN].map((id) => {
            const c = EPREUVES[id];
            return (
              <label key={id} className="choix">
                <input type="checkbox" checked={choisies.includes(id)} onChange={() => basculer(id)} />
                {c.titre} : {c.nbQuestions} questions,{' '}
                {Number.isFinite(dureeEffectiveSecondes(c.dureeSecondes, chrono))
                  ? formatDuree(dureeEffectiveSecondes(c.dureeSecondes, chrono) * 1000)
                  : 'sans limite de temps'}
                {EPREUVES_OPTIONNELLES_EXAMEN.includes(id) ? ' (option)' : ''}
              </label>
            );
          })}
        </fieldset>
        <ChoixChrono />
        <p>
          Durée totale :{' '}
          <strong>{Number.isFinite(dureeTotale) ? formatDuree(dureeTotale) : 'sans limite de temps'}</strong> (hors lecture
          des consignes).
        </p>
        <div className="actions">
          <button type="button" className="bouton" onClick={demarrer} disabled={choisies.length === 0}>
            Lancer l’examen blanc
          </button>
          <Link className="bouton bouton-secondaire" to="/">
            Retour
          </Link>
        </div>
      </section>
    );
  }

  // ---------- Fin de l'examen ----------
  if (etape >= configs.length) {
    return <BilanExamen resultats={resultats} niveau={niveau} onRefaire={() => setEtape(null)} />;
  }

  // ---------- Une épreuve de l'examen ----------
  const config = configs[etape];
  const bandeau = (
    <p className="bandeau-examen" role="status">
      Examen blanc · épreuve {etape + 1} / {configs.length}
    </p>
  );
  return (
    <SeanceInner
      key={`${manche}-${etape}`}
      config={config}
      mode="examen"
      niveau={niveau}
      difficulteChoisie={config.difficulteExamen}
      bandeau={bandeau}
      libelleDepart={`Commencer l’épreuve ${etape + 1}`}
      onFin={(etat: EtatSeance, dureeMs: number, difficulte: Difficulte) => {
        const bilan = calculerBilan(etat.items, etat.reponses, etat.ordre, dureeMs, config.penaliteErreur);
        ajouterResultat(creerResultat(bilan, { epreuve: config.id, mode: 'examen', niveau, difficulte, dureeMs, examenId }));
        setResultats((r) => [...r, { config, etat, bilan, dureeMs }]);
        setEtape((e) => (e === null ? e : e + 1));
      }}
    />
  );
}

function BilanExamen({
  resultats,
  niveau,
  onRefaire,
}: {
  resultats: ResultatEtape[];
  niveau: Parameters<typeof libelleNiveau>[0];
  onRefaire(): void;
}) {
  const lignes = resultats.map((r) => {
    const objectif = OBJECTIFS[r.config.id]?.[niveau];
    return { ...r, objectif, comparaison: objectif ? comparerObjectif(r.bilan, objectif) : null };
  });
  const evaluees = lignes.filter((l) => l.comparaison);
  const atteints = evaluees.filter((l) => l.comparaison!.precisionOk && l.comparaison!.vitesseOk).length;
  const faibles = [...evaluees]
    .map((l) => ({
      l,
      // Écart relatif moyen à l'objectif : plus il est négatif, plus l'épreuve est à travailler.
      ecart:
        (l.bilan.precision / l.objectif!.precisionMin - 1 + (l.bilan.vitesseCorrectes / l.objectif!.correctesParMinute - 1)) / 2,
    }))
    .sort((a, b) => a.ecart - b.ecart)
    .slice(0, 2);

  return (
    <section aria-labelledby="titre-bilan">
      <h1 id="titre-bilan">Bilan de l’examen blanc</h1>
      <p className="discret">Niveau visé : {libelleNiveau(niveau)}</p>

      <table className="historique">
        <thead>
          <tr>
            <th>Épreuve</th>
            <th>Bonnes réponses</th>
            <th>Précision</th>
            <th>Vitesse (bonnes/min)</th>
            <th>Objectif indicatif</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => (
            <tr key={l.config.id}>
              <td>{l.config.titre}</td>
              <td>
                {l.bilan.nbCorrectes} / {l.bilan.nbItems}
              </td>
              <td>{pourcent(l.bilan.precision)}</td>
              <td>{decimal(l.bilan.vitesseCorrectes)}</td>
              <td>
                {l.comparaison
                  ? `${l.comparaison.precisionOk ? '✓' : '✗'} précision · ${l.comparaison.vitesseOk ? '✓' : '✗'} vitesse`
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="discret">{AVERTISSEMENT_OBJECTIFS}</p>

      {evaluees.length > 0 && (
        <div className="encadre">
          <p>
            Objectifs indicatifs atteints (précision <em>et</em> vitesse) :{' '}
            <strong>
              {atteints} sur {evaluees.length} épreuves
            </strong>
            .
          </p>
          {faibles.length > 0 && (
            <p>
              À travailler en priorité :{' '}
              {faibles.map(({ l }, i) => (
                <span key={l.config.id}>
                  {i > 0 && ', '}
                  <Link to={`/methode/${l.config.id}`}>{l.config.titre}</Link>
                </span>
              ))}
              .
            </p>
          )}
        </div>
      )}

      <div className="actions">
        <button type="button" className="bouton" onClick={onRefaire}>
          Refaire un examen
        </button>
        <Link className="bouton bouton-secondaire" to="/revision">
          Réviser mes erreurs
        </Link>
        <Link className="bouton bouton-secondaire" to="/progression">
          Ma progression
        </Link>
        <Link className="bouton bouton-secondaire" to="/">
          Accueil
        </Link>
      </div>

      <h2>Correction détaillée</h2>
      {resultats.map((r) => (
        <details key={r.config.id} className="detail-epreuve">
          <summary>
            {r.config.titre} : {r.bilan.nbErreurs} erreur{r.bilan.nbErreurs > 1 ? 's' : ''}
          </summary>
          <ListeErreurs etat={r.etat} />
        </details>
      ))}
    </section>
  );
}
