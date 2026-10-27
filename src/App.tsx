import { Link, Route, Routes } from 'react-router-dom';
import { DEPOT_GITHUB, NOM_APP, NON_AFFILIATION } from './config/app';
import Accueil from './pages/Accueil';
import Confidentialite from './pages/Confidentialite';
import Personnalite from './pages/Personnalite';
import Progression from './pages/Progression';
import Seance from './pages/Seance';
import { useStockage } from './state/Stockage';
import type { ThemePref } from './lib/types';

const SUIVANT: Record<ThemePref, ThemePref> = { auto: 'clair', clair: 'sombre', sombre: 'auto' };
const LIBELLE_THEME: Record<ThemePref, string> = {
  auto: 'Thème : auto',
  clair: 'Thème : clair',
  sombre: 'Thème : sombre',
};

export default function App() {
  const { donnees, majPrefs, stockageDispo } = useStockage();
  const theme = donnees.prefs.theme;

  return (
    <>
      <a className="lien-evitement" href="#contenu">
        Aller au contenu
      </a>
      <header className="entete">
        <Link to="/" className="marque">
          {NOM_APP}
        </Link>
        <nav aria-label="Navigation principale">
          <Link to="/">Épreuves</Link>
          <Link to="/progression">Progression</Link>
          <button type="button" className="bouton-lien" onClick={() => majPrefs({ theme: SUIVANT[theme] })}>
            {LIBELLE_THEME[theme]}
          </button>
        </nav>
      </header>

      {!stockageDispo && (
        <p className="alerte" role="status">
          Le stockage du navigateur est bloqué : ta progression ne sera pas conservée. Utilise l’export JSON pour la
          sauvegarder.
        </p>
      )}

      <main id="contenu" className="contenu">
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/epreuve/:epreuve/:mode" element={<Seance />} />
          <Route path="/personnalite" element={<Personnalite />} />
          <Route path="/progression" element={<Progression />} />
          <Route path="/confidentialite" element={<Confidentialite />} />
          <Route path="*" element={<p>Page introuvable. <Link to="/">Retour à l’accueil</Link></p>} />
        </Routes>
      </main>

      <footer className="pied">
        <p className="non-affiliation">{NON_AFFILIATION}</p>
        <p>
          Gratuit, sans compte, sans publicité. <Link to="/confidentialite">Confidentialité</Link> ·{' '}
          <a href={DEPOT_GITHUB} target="_blank" rel="noopener noreferrer">
            Code et contributions
          </a>{' '}
          · Code MIT, contenus CC BY-SA 4.0
        </p>
      </footer>
    </>
  );
}
