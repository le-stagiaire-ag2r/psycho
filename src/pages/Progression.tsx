import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Sparkline from '../components/Sparkline';
import { EPREUVES, ORDRE_EPREUVES } from '../config/epreuves';
import { AVERTISSEMENT_OBJECTIFS, OBJECTIFS, libelleNiveau } from '../config/niveaux';
import { decimal, formatDuree, pourcent } from '../lib/format';
import type { ResultatSeance } from '../lib/storage';
import type { EpreuveId } from '../lib/types';
import { useStockage } from '../state/Stockage';

function moyenne(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Épreuves classées de la plus éloignée à la plus proche de l'objectif indicatif (moyenne des 5 dernières séances). */
function pointsFaibles(historique: ResultatSeance[], niveau: Parameters<typeof libelleNiveau>[0]) {
  const res: { id: EpreuveId; ecart: number; precision: number; vitesse: number; manque: string[] }[] = [];
  for (const id of ORDRE_EPREUVES) {
    const objectif = OBJECTIFS[id]?.[niveau];
    const cinq = historique.filter((r) => r.epreuve === id).slice(-5);
    if (!objectif || cinq.length === 0) continue;
    const precision = moyenne(cinq.map((r) => r.precision));
    const vitesse = moyenne(cinq.map((r) => r.vitesseCorrectes));
    const manque: string[] = [];
    if (precision < objectif.precisionMin) manque.push('précision');
    if (vitesse < objectif.correctesParMinute) manque.push('vitesse');
    const ecart = (precision / objectif.precisionMin - 1 + (vitesse / objectif.correctesParMinute - 1)) / 2;
    res.push({ id, ecart, precision, vitesse, manque });
  }
  return res.sort((a, b) => a.ecart - b.ecart);
}

export default function Progression() {
  const { donnees, exporterJson, importerJson, reinitialiser } = useStockage();
  const [message, setMessage] = useState('');
  const fichier = useRef<HTMLInputElement>(null);
  const { historique, prefs } = donnees;

  const exporterFichier = () => {
    const blob = new Blob([exporterJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `psycho-progression-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importerFichier = async (f: File | undefined) => {
    if (!f) return;
    try {
      const ok = importerJson(await f.text());
      setMessage(ok ? 'Import réussi : l’historique a été fusionné.' : 'Fichier invalide : rien n’a été importé.');
    } catch {
      setMessage('Impossible de lire ce fichier.');
    }
    if (fichier.current) fichier.current.value = '';
  };

  const epreuvesJouees = ORDRE_EPREUVES.filter((id) => historique.some((r) => r.epreuve === id));
  const faibles = pointsFaibles(historique, prefs.niveau);

  const totalQuestions = historique.reduce((s, r) => s + r.nbRepondues, 0);
  const totalDuree = historique.reduce((s, r) => s + r.dureeMs, 0);
  const avecTendance = historique.filter((r) => r.precisionDebut !== null && r.precisionFin !== null).slice(-20);
  const debut = moyenne(avecTendance.map((r) => r.precisionDebut as number));
  const fin = moyenne(avecTendance.map((r) => r.precisionFin as number));

  // Examens blancs enchaînés, regroupés par identifiant.
  const examens = new Map<string, ResultatSeance[]>();
  for (const r of historique) if (r.examenId) examens.set(r.examenId, [...(examens.get(r.examenId) ?? []), r]);
  const listeExamens = [...examens.values()].reverse().slice(0, 5);

  return (
    <>
      <h1>Ma progression</h1>
      <p className="discret">Enregistrée uniquement dans ton navigateur. Exporte-la pour changer d’appareil.</p>

      {epreuvesJouees.length === 0 && <p>Aucune séance pour l’instant. Lance une épreuve depuis l’accueil.</p>}

      {historique.length > 0 && (
        <>
          <ul className="tuiles">
            <li>
              <span className="tuile-valeur">{historique.length}</span>
              <span>séances</span>
            </li>
            <li>
              <span className="tuile-valeur">{totalQuestions}</span>
              <span>questions répondues</span>
            </li>
            <li>
              <span className="tuile-valeur">{formatDuree(totalDuree)}</span>
              <span>temps d’entraînement</span>
            </li>
            {avecTendance.length >= 3 && (
              <li>
                <span className="tuile-valeur">
                  {pourcent(debut)} → {pourcent(fin)}
                </span>
                <span>précision début → fin d’épreuve (20 dernières séances)</span>
              </li>
            )}
          </ul>

          {faibles.length > 0 && (
            <section aria-labelledby="titre-faibles" className="encadre">
              <h2 id="titre-faibles">À travailler (niveau visé : {libelleNiveau(prefs.niveau)})</h2>
              <ol>
                {faibles.slice(0, 3).map((f) => (
                  <li key={f.id}>
                    <strong>{EPREUVES[f.id].titre}</strong> : {pourcent(f.precision)} de précision,{' '}
                    {decimal(f.vitesse)} bonnes réponses/min
                    {f.manque.length > 0 ? ` (à améliorer : ${f.manque.join(' et ')})` : ' (objectif atteint)'} ·{' '}
                    <Link to={`/methode/${f.id}`}>fiche méthode</Link>
                  </li>
                ))}
              </ol>
              <p className="discret">{AVERTISSEMENT_OBJECTIFS}</p>
            </section>
          )}
        </>
      )}

      {listeExamens.length > 0 && (
        <section aria-labelledby="titre-examens">
          <h2 id="titre-examens">Derniers examens blancs</h2>
          <ul>
            {listeExamens.map((ex) => (
              <li key={ex[0].examenId}>
                {new Date(ex[0].date).toLocaleDateString('fr-FR')} : {ex.length} épreuves, précision moyenne{' '}
                <strong>{pourcent(moyenne(ex.map((r) => r.precision)))}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      {epreuvesJouees.map((id: EpreuveId) => {
        const seances = historique.filter((r) => r.epreuve === id);
        const recentes = seances.slice(-20);
        const cinq = seances.slice(-5);
        const objectif = OBJECTIFS[id]?.[prefs.niveau];
        const precMoy = moyenne(cinq.map((r) => r.precision));
        const vitMoy = moyenne(cinq.map((r) => r.vitesseCorrectes));
        const faiblesId: string[] = [];
        if (objectif) {
          if (precMoy < objectif.precisionMin) faiblesId.push('précision');
          if (vitMoy < objectif.correctesParMinute) faiblesId.push('vitesse');
        }
        return (
          <section key={id} className="carte-large" aria-labelledby={`t-${id}`}>
            <h2 id={`t-${id}`}>{EPREUVES[id].titre}</h2>
            <p>
              {seances.length} séance{seances.length > 1 ? 's' : ''} · 5 dernières : précision moyenne{' '}
              <strong>{pourcent(precMoy)}</strong>, <strong>{decimal(vitMoy)}</strong> bonnes réponses/min.
            </p>
            {objectif && (
              <p className={faiblesId.length ? 'point-faible' : 'point-fort'}>
                {faiblesId.length
                  ? `Point faible pour l’objectif indicatif « ${libelleNiveau(prefs.niveau)} » : ${faiblesId.join(' et ')}.`
                  : `Objectif indicatif « ${libelleNiveau(prefs.niveau)} » atteint sur les 5 dernières séances.`}
              </p>
            )}
            <div className="courbes">
              <figure>
                <Sparkline valeurs={recentes.map((r) => r.precision)} min={0} max={1} libelle="Précision par séance" />
                <figcaption>Précision</figcaption>
              </figure>
              <figure>
                <Sparkline valeurs={recentes.map((r) => r.vitesseCorrectes)} min={0} libelle="Bonnes réponses par minute" />
                <figcaption>Bonnes réponses / min</figcaption>
              </figure>
            </div>
            <table className="historique">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Score</th>
                  <th>Précision</th>
                  <th>Durée</th>
                  <th>Erreurs</th>
                </tr>
              </thead>
              <tbody>
                {[...seances].reverse().slice(0, 8).map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.date).toLocaleDateString('fr-FR')}</td>
                    <td>{r.mode === 'examen' ? 'Examen' : 'Entraîn.'}</td>
                    <td>
                      {decimal(r.score, r.score % 1 ? 1 : 0)}/{r.nbItems}
                    </td>
                    <td>{pourcent(r.precision)}</td>
                    <td>{formatDuree(r.dureeMs)}</td>
                    <td>{r.erreurs.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}

      <section aria-labelledby="titre-donnees">
        <h2 id="titre-donnees">Mes données</h2>
        <div className="actions">
          <button type="button" className="bouton bouton-secondaire" onClick={exporterFichier}>
            Exporter (JSON)
          </button>
          <button type="button" className="bouton bouton-secondaire" onClick={() => fichier.current?.click()}>
            Importer (JSON)
          </button>
          <input
            ref={fichier}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => void importerFichier(e.target.files?.[0])}
          />
          <button
            type="button"
            className="bouton-lien"
            onClick={() => {
              if (window.confirm('Effacer tout l’historique et les préférences de cet appareil ?')) {
                reinitialiser();
                setMessage('Données effacées.');
              }
            }}
          >
            Tout effacer
          </button>
        </div>
        {message && <p role="status">{message}</p>}
      </section>
    </>
  );
}
