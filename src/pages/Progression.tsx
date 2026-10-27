import { useRef, useState } from 'react';
import Sparkline from '../components/Sparkline';
import { EPREUVES, ORDRE_EPREUVES } from '../config/epreuves';
import { OBJECTIFS, libelleNiveau } from '../config/niveaux';
import { decimal, formatDuree, pourcent } from '../lib/format';
import type { EpreuveId } from '../lib/types';
import { useStockage } from '../state/Stockage';

function moyenne(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
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

  return (
    <>
      <h1>Ma progression</h1>
      <p className="discret">Enregistrée uniquement dans ton navigateur. Exporte-la pour changer d’appareil.</p>

      {epreuvesJouees.length === 0 && <p>Aucune séance pour l’instant. Lance une épreuve depuis l’accueil.</p>}

      {epreuvesJouees.map((id: EpreuveId) => {
        const seances = historique.filter((r) => r.epreuve === id);
        const recentes = seances.slice(-20);
        const cinq = seances.slice(-5);
        const objectif = OBJECTIFS[id]?.[prefs.niveau];
        const precMoy = moyenne(cinq.map((r) => r.precision));
        const vitMoy = moyenne(cinq.map((r) => r.vitesseCorrectes));
        const faibles: string[] = [];
        if (objectif) {
          if (precMoy < objectif.precisionMin) faibles.push('précision');
          if (vitMoy < objectif.correctesParMinute) faibles.push('vitesse');
        }
        return (
          <section key={id} className="carte-large" aria-labelledby={`t-${id}`}>
            <h2 id={`t-${id}`}>{EPREUVES[id].titre}</h2>
            <p>
              {seances.length} séance{seances.length > 1 ? 's' : ''} · 5 dernières : précision moyenne{' '}
              <strong>{pourcent(precMoy)}</strong>, <strong>{decimal(vitMoy)}</strong> bonnes réponses/min.
            </p>
            {objectif && (
              <p className={faibles.length ? 'point-faible' : 'point-fort'}>
                {faibles.length
                  ? `Point faible pour l’objectif indicatif « ${libelleNiveau(prefs.niveau)} » : ${faibles.join(' et ')}.`
                  : `Objectif indicatif « ${libelleNiveau(prefs.niveau)} » atteint sur les 5 dernières séances.`}
              </p>
            )}
            <div className="courbes">
              <figure>
                <Sparkline
                  valeurs={recentes.map((r) => r.precision)}
                  min={0}
                  max={1}
                  libelle="Précision par séance"
                />
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
