import { Link, useParams } from 'react-router-dom';
import { EPREUVES } from '../config/epreuves';
import { FICHES, FICHES_PAR_ID } from '../data/methodes';
import type { EpreuveId } from '../lib/types';

export default function Methode() {
  const { id } = useParams();

  if (!id) {
    return (
      <section aria-labelledby="titre-methode">
        <h1 id="titre-methode">Fiches méthode</h1>
        <p>Courtes et simples : la démarche, les pièges classiques et comment s’entraîner, épreuve par épreuve.</p>
        <ul className="grille-epreuves">
          {FICHES.map((f) => (
            <li key={f.id} className="carte">
              <h3>{f.titre}</h3>
              <p>{f.resume}</p>
              <Link className="bouton" to={`/methode/${f.id}`}>
                Lire la fiche
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const fiche = FICHES_PAR_ID.get(id as EpreuveId | 'general');
  if (!fiche) {
    return (
      <p>
        Fiche introuvable. <Link to="/methode">Toutes les fiches</Link>
      </p>
    );
  }
  const config = fiche.id !== 'general' ? EPREUVES[fiche.id] : null;

  return (
    <article aria-labelledby="titre-fiche">
      <p>
        <Link to="/methode">← Toutes les fiches</Link>
      </p>
      <h1 id="titre-fiche">{fiche.titre}</h1>
      <p className="encadre">{fiche.resume}</p>
      {fiche.sections.map((s) => (
        <section key={s.titre}>
          <h2>{s.titre}</h2>
          <ul>
            {s.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      ))}
      {config?.disponible && (
        <div className="actions">
          <Link
            className="bouton"
            to={fiche.id === 'personnalite' ? '/personnalite' : `/epreuve/${fiche.id}/entrainement`}
          >
            S’entraîner
          </Link>
        </div>
      )}
      <p className="discret">
        Les formats des épreuves sont reconstitués à partir de témoignages et peuvent différer du test réel.
      </p>
    </article>
  );
}
