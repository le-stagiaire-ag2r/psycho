import { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { DEPOT_GITHUB, NOM_APP, NON_AFFILIATION } from './config/app';
import Guide from './components/Guide';
import { guideDejaVu, marquerGuideVu } from './lib/guide';
import Accueil from './pages/Accueil';
import Confidentialite from './pages/Confidentialite';
import Examen from './pages/Examen';
import Methode from './pages/Methode';
import Personnalite from './pages/Personnalite';
import Progression from './pages/Progression';
import Revision from './pages/Revision';
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
  const [guideOuvert, setGuideOuvert] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Première visite : le guide s'ouvre tout seul sur l'accueil.
  useEffect(() => {
    if (pathname === '/' && !guideDejaVu()) setGuideOuvert(true);
    // Uniquement au chargement initial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ouvrirGuide = () => {
    if (pathname !== '/') navigate('/');
    setGuideOuvert(true);
  };
  const fermerGuide = () => {
    marquerGuideVu();
    setGuideOuvert(false);
  };

  return (
    <>
      <a className="lien-evitement" href="#contenu">
        Aller au contenu
      </a>
      <header className="entete">
        <Link to="/" className="marque">
          {NOM_APP}
        </Link>
        <nav aria-label="Navigation principale" data-guide="nav">
          <Link to="/">Épreuves</Link>
          <Link to="/examen">Examen blanc</Link>
          <Link to="/revision">Révision</Link>
          <Link to="/methode">Méthode</Link>
          <Link to="/progression">Progression</Link>
          <button type="button" className="bouton-lien" onClick={ouvrirGuide}>
            Guide
          </button>
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
          <Route path="/examen" element={<Examen />} />
          <Route path="/revision" element={<Revision />} />
          <Route path="/methode" element={<Methode />} />
          <Route path="/methode/:id" element={<Methode />} />
          <Route path="/personnalite" element={<Personnalite />} />
          <Route path="/progression" element={<Progression />} />
          <Route path="/confidentialite" element={<Confidentialite />} />
          <Route path="*" element={<p>Page introuvable. <Link to="/">Retour à l’accueil</Link></p>} />
        </Routes>
      </main>

      {guideOuvert && <Guide onFermer={fermerGuide} />}

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
