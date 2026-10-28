import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { EPREUVES } from '../config/epreuves';
import { GENERATEURS } from '../generateurs/index';
import type { EpreuveId, Item } from '../lib/types';
import Correction from './Correction';
import QuestionView from './QuestionView';

/**
 * Guide de départ : visite en bulles avec flèche sur la page d'accueil, puis mini-test de 3 questions
 * pour apprendre le fonctionnement (réponse, correction, touches du clavier).
 * Aucune donnée n'est enregistrée : les réponses du mini-test ne comptent pas dans la progression.
 */
interface EtapeVisite {
  type: 'visite';
  /** Valeur de l'attribut data-guide de l'élément à entourer (absent : bulle centrée) */
  cible?: string;
  titre: string;
  texte: string;
}
interface EtapeQuestion {
  type: 'question';
  epreuve: EpreuveId;
  titre: string;
  texte: string;
}
type Etape = EtapeVisite | EtapeQuestion;

const ETAPES: Etape[] = [
  {
    type: 'visite',
    titre: 'Bienvenue sur Psycho',
    texte:
      'Un site 100 % gratuit pour t’entraîner aux tests de sélection : sans compte, sans pub. Ta progression reste dans ton navigateur. Ce guide dure environ 2 minutes ; tu pourras le revoir à tout moment avec le bouton « Guide ».',
  },
  {
    type: 'visite',
    cible: 'reglages',
    titre: '1. Règle ton entraînement',
    texte:
      'Mode : « Entraînement » te laisse le temps et corrige chaque erreur ; « Examen blanc » impose un chrono strict. Difficulté : commence par Moyen. « Objectif de score » ne change que la cible affichée à la fin, jamais les questions.',
  },
  {
    type: 'visite',
    cible: 'epreuve',
    titre: '2. Choisis une épreuve',
    texte:
      'Chaque carte est une épreuve du test. Clique sur le bouton de la carte pour lancer une séance. Les questions sont toujours nouvelles : tu peux recommencer autant que tu veux.',
  },
  {
    type: 'visite',
    cible: 'raccourcis',
    titre: '3. Tes outils',
    texte:
      'Examen blanc : toutes les épreuves à la suite, comme le jour J. Réviser mes erreurs : refais les questions ratées. Fiches méthode : astuces et pièges, épreuve par épreuve.',
  },
  {
    type: 'visite',
    cible: 'nav',
    titre: '4. Menu et progression',
    texte:
      'Ici : ta progression (scores, points faibles, export de sauvegarde), le changement de thème clair ou sombre, et le bouton « Guide » pour revoir cette visite.',
  },
  {
    type: 'visite',
    titre: 'À toi de jouer : 3 questions',
    texte:
      'On essaie pour de vrai avec 3 petites questions. Pendant une séance, tu peux répondre avec les touches 1 à 4 du clavier, et passer une question avec la touche P. Ces essais ne comptent pas dans ta progression.',
  },
  {
    type: 'question',
    epreuve: 'attention',
    titre: 'Question 1 : attention',
    texte: 'Compare vite les deux suites. Si tu te trompes, tu verras comment l’explication s’affiche.',
  },
  {
    type: 'question',
    epreuve: 'codage',
    titre: 'Question 2 : codage',
    texte: 'Retrouve l’association dans le tableau. Ici, tout est question de rapidité et de lecture attentive.',
  },
  {
    type: 'question',
    epreuve: 'logique',
    titre: 'Question 3 : logique des cubes',
    texte: 'Repère la règle qui fait passer d’un cube au suivant, puis applique-la une fois de plus.',
  },
  {
    type: 'visite',
    titre: 'Tu es prêt !',
    texte:
      'En entraînement, une erreur ouvre une fenêtre qui explique pourquoi (flèches ← → pour naviguer). Les erreurs sont gardées pour la révision. Lance maintenant ta première épreuve, ou termine le guide.',
  },
];

function itemPourEpreuve(epreuve: EpreuveId): Item {
  const gen = GENERATEURS[epreuve]!;
  const ref = gen.construireRefs({ graineBase: 4242, nb: 1, difficulte: 1, config: EPREUVES[epreuve] })[0];
  return gen.generer(ref);
}

interface Position {
  halo: { top: number; left: number; width: number; height: number } | null;
  carte: { top: number; left: number; width: number };
  fleche: { cote: 'haut' | 'bas'; x: number } | null;
}

const MARGE = 12;

interface Props {
  onFermer(): void;
}

export default function Guide({ onFermer }: Props) {
  const [indice, setIndice] = useState(0);
  const [choix, setChoix] = useState<Record<number, number>>({});
  const [position, setPosition] = useState<Position | null>(null);
  const carteRef = useRef<HTMLDivElement>(null);
  const boutonRef = useRef<HTMLButtonElement>(null);
  const etape = ETAPES[indice];
  const dernier = indice === ETAPES.length - 1;

  const items = useMemo(() => {
    const m = new Map<number, Item>();
    ETAPES.forEach((e, i) => {
      if (e.type === 'question') m.set(i, itemPourEpreuve(e.epreuve));
    });
    return m;
  }, []);
  const item = items.get(indice);
  const reponse = choix[indice];
  const doitRepondre = etape.type === 'question' && reponse === undefined;

  const placer = useCallback(() => {
    const largeur = Math.min(380, window.innerWidth - 2 * MARGE);
    const carte = carteRef.current;
    const hauteur = carte?.offsetHeight ?? 220;
    const cibleNom = etape.type === 'visite' ? etape.cible : undefined;
    const el = cibleNom ? document.querySelector<HTMLElement>(`[data-guide="${cibleNom}"]`) : null;
    if (!el) {
      setPosition({
        halo: null,
        carte: {
          width: largeur,
          left: Math.max(MARGE, (window.innerWidth - largeur) / 2),
          top: Math.max(MARGE, (window.innerHeight - hauteur) / 2),
        },
        fleche: null,
      });
      return;
    }
    const r = el.getBoundingClientRect();
    const pad = 6;
    const halo = { top: r.top - pad, left: r.left - pad, width: r.width + 2 * pad, height: r.height + 2 * pad };
    const left = Math.min(Math.max(MARGE, r.left + r.width / 2 - largeur / 2), window.innerWidth - largeur - MARGE);
    const placeDessous = window.innerHeight - halo.top - halo.height >= hauteur + 28;
    const placeDessus = halo.top >= hauteur + 28;
    const x = Math.min(Math.max(22, r.left + r.width / 2 - left), largeur - 22);
    if (placeDessous || !placeDessus) {
      const top = placeDessous ? halo.top + halo.height + 16 : Math.max(MARGE, window.innerHeight - hauteur - MARGE);
      setPosition({ halo, carte: { top, left, width: largeur }, fleche: placeDessous ? { cote: 'haut', x } : null });
    } else {
      setPosition({
        halo,
        carte: { top: halo.top - hauteur - 16, left, width: largeur },
        fleche: { cote: 'bas', x },
      });
    }
  }, [etape]);

  // Amène la cible à l'écran, puis calcule la position de la bulle.
  useLayoutEffect(() => {
    const cibleNom = etape.type === 'visite' ? etape.cible : undefined;
    const el = cibleNom ? document.querySelector<HTMLElement>(`[data-guide="${cibleNom}"]`) : null;
    el?.scrollIntoView({ block: 'center', behavior: 'auto' });
    placer();
  }, [etape, placer, reponse]);

  useEffect(() => {
    window.addEventListener('resize', placer);
    window.addEventListener('scroll', placer, true);
    return () => {
      window.removeEventListener('resize', placer);
      window.removeEventListener('scroll', placer, true);
    };
  }, [placer]);

  useEffect(() => {
    boutonRef.current?.focus({ preventScroll: true });
  }, [indice, reponse]);

  const suivant = useCallback(() => {
    if (dernier) onFermer();
    else setIndice((i) => i + 1);
  }, [dernier, onFermer]);
  const precedent = useCallback(() => setIndice((i) => Math.max(0, i - 1)), []);
  const repondre = useCallback(
    (i: number) => setChoix((c) => (c[indice] === undefined ? { ...c, [indice]: i } : c)),
    [indice],
  );

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onFermer();
      } else if (item && reponse === undefined && /^[1-9]$/.test(e.key) && Number(e.key) <= item.options.length) {
        e.preventDefault();
        repondre(Number(e.key) - 1);
      } else if (e.key === 'ArrowRight' && !doitRepondre) {
        e.preventDefault();
        suivant();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        precedent();
      }
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [item, reponse, doitRepondre, suivant, precedent, repondre, onFermer]);

  return (
    <div className="guide" role="dialog" aria-modal="true" aria-labelledby="guide-titre">
      {position?.halo ? (
        <div
          className="guide-halo"
          style={{ top: position.halo.top, left: position.halo.left, width: position.halo.width, height: position.halo.height }}
        />
      ) : (
        <div className="guide-fond" />
      )}
      <div
        ref={carteRef}
        className={`guide-carte ${etape.type === 'question' ? 'guide-carte-large' : ''}`}
        style={position ? { top: position.carte.top, left: position.carte.left, width: position.carte.width } : { visibility: 'hidden' }}
      >
        {position?.fleche && (
          <span className={`guide-fleche guide-fleche-${position.fleche.cote}`} style={{ left: position.fleche.x }} aria-hidden="true" />
        )}
        <p className="guide-compteur">
          Étape {indice + 1} / {ETAPES.length}
        </p>
        <h2 id="guide-titre" className="guide-titre">
          {etape.titre}
        </h2>
        <p>{etape.texte}</p>

        {item && (
          <div className="guide-question">
            <QuestionView item={item} choix={reponse ?? null} onChoisir={repondre} />
            {reponse !== undefined && (
              <div className="guide-retour" role="status">
                <p className={reponse === item.bonneReponse ? 'guide-bravo' : 'guide-oups'}>
                  {reponse === item.bonneReponse ? 'Bravo, c’est juste !' : 'Raté, mais regarde l’explication :'}
                </p>
                <Correction item={item} choix={reponse} />
              </div>
            )}
          </div>
        )}

        <div className="guide-actions">
          <button type="button" className="bouton-lien" onClick={onFermer}>
            Passer le guide
          </button>
          <span className="guide-nav">
            {indice > 0 && (
              <button type="button" className="bouton bouton-secondaire" onClick={precedent}>
                ← Retour
              </button>
            )}
            {dernier ? (
              <>
                <button ref={boutonRef} type="button" className="bouton bouton-secondaire" onClick={onFermer}>
                  Terminer
                </button>
                <Link className="bouton" to="/epreuve/attention/entrainement" onClick={onFermer}>
                  Première épreuve
                </Link>
              </>
            ) : (
              <button ref={boutonRef} type="button" className="bouton" onClick={suivant} disabled={doitRepondre}>
                {doitRepondre ? 'Réponds pour continuer' : 'Suivant →'}
              </button>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
