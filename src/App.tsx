import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { NOM_APP, NON_AFFILIATION } from './config/app';
import { aproposDejaVu, guideDejaVu, marquerGuideVu } from './lib/guide';
import Accueil from './pages/Accueil';
import { titreDePage } from './lib/titres';

// Les pages lourdes (générateurs, banques de questions, questionnaire) ne sont chargées qu'au besoin.
const Guide = lazy(() => import('./components/Guide'));
const APropos = lazy(() => import('./pages/APropos'));
const Confidentialite = lazy(() => import('./pages/Confidentialite'));
const Examen = lazy(() => import('./pages/Examen'));
const Methode = lazy(() => import('./pages/Methode'));
const Personnalite = lazy(() => import('./pages/Personnalite'));
const Progression = lazy(() => import('./pages/Progression'));
const Revision = lazy(() => import('./pages/Revision'));
const Seance = lazy(() => import('./pages/Seance'));
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

  // Première visite : d'abord la page « À propos » (bêta, limites), puis le guide qui s'ouvre sur l'accueil.
  useEffect(() => {
    if (pathname !== '/') return;
    if (!aproposDejaVu()) navigate('/a-propos', { replace: true });
    else if (!guideDejaVu()) setGuideOuvert(true);
    // Une fois la page « À propos » lue, le retour sur l'accueil ouvre le guide
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Un titre d'onglet propre à chaque page (historique, favoris, lecteurs d'écran).
  useEffect(() => {
    document.title = titreDePage(pathname);
  }, [pathname]);

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
          <Link to="/a-propos">À propos</Link>
          <Link to="/progression">Progression</Link>
          <button type="button" className="bouton-lien" onClick={ouvrirGuide} data-guide="nav-guide">
            Guide
          </button>
          <button type="button" className="bouton-lien" onClick={() => majPrefs({ theme: SUIVANT[theme] })} data-guide="nav-theme">
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
        <Suspense fallback={<p role="status">Chargement…</p>}>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/epreuve/:epreuve/:mode" element={<Seance />} />
          <Route path="/examen" element={<Examen />} />
          <Route path="/revision" element={<Revision />} />
          <Route path="/methode" element={<Methode />} />
          <Route path="/methode/:id" element={<Methode />} />
          <Route path="/personnalite" element={<Personnalite />} />
          <Route path="/progression" element={<Progression />} />
          <Route path="/a-propos" element={<APropos />} />
          <Route path="/confidentialite" element={<Confidentialite />} />
          <Route path="*" element={
              <section aria-labelledby="titre-404">
                <h1 id="titre-404">Page introuvable</h1>
                <p>
                  <Link to="/">Retour à l’accueil</Link>
                </p>
              </section>
            } />
        </Routes>
        </Suspense>
      </main>

      {guideOuvert && (
        <Suspense fallback={null}>
          <Guide onFermer={fermerGuide} />
        </Suspense>
      )}

      <footer className="pied">
        <p className="non-affiliation">{NON_AFFILIATION}</p>
        <p>
          Gratuit, sans compte, sans publicité. <Link to="/a-propos">Site en bêta : à propos</Link> · <Link to="/confidentialite">Confidentialité</Link> · Code MIT, contenus CC BY-SA 4.0
        </p>
      </footer>
    </>
  );
}
