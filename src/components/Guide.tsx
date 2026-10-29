import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { EPREUVES } from '../config/epreuves';
import { GENERATEURS } from '../generateurs/index';
import { calculerPlacement, zoneLibreAuDessus, type Placement, type Rect } from '../lib/guidePosition';
import type { EpreuveId, Item } from '../lib/types';
import Correction from './Correction';
import QuestionView from './QuestionView';

/**
 * Guide de départ : visite en bulles avec flèche, puis mini-test de 3 questions, puis conseils d'utilisation.
 * Aucune donnée n'est enregistrée : les réponses du mini-test ne comptent pas dans la progression.
 */
interface EtapeVisite {
  type: 'visite';
  /** Valeur de l'attribut data-guide de l'élément à entourer (absent ou introuvable : bulle centrée) */
  cible?: string;
  titre: string;
  texte: string;
  points?: string[];
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
      'Un site 100 % gratuit pour t’entraîner aux tests de sélection : sans compte, sans pub. Ta progression reste dans ton navigateur. Ce guide dure environ 3 minutes et finit par un petit essai. Tu pourras le revoir à tout moment.',
  },
  {
    type: 'visite',
    cible: 'nav',
    titre: 'Le menu',
    texte: 'Ce menu est toujours en haut de l’écran.',
    points: [
      'Épreuves : l’accueil, pour choisir une épreuve.',
      'Examen blanc : toutes les épreuves à la suite, avec un chrono.',
      'Révision : refaire tes erreurs.',
      'Méthode : astuces et pièges.',
      'Progression : tes scores et ta sauvegarde.',
    ],
  },
  {
    type: 'visite',
    cible: 'nav-theme',
    titre: 'Clair ou sombre',
    texte: 'Ce bouton change l’apparence du site : clair, sombre, ou automatique selon ton appareil.',
  },
  {
    type: 'visite',
    cible: 'nav-guide',
    titre: 'Revoir ce guide',
    texte: 'Un doute plus tard ? Ce bouton relance ce guide à tout moment.',
  },
  {
    type: 'visite',
    cible: 'reglage-mode',
    titre: 'Réglage 1 : le mode',
    texte: 'Deux façons de travailler.',
    points: [
      'Entraînement : tu prends ton temps et chaque erreur est expliquée tout de suite.',
      'Examen blanc : avec un chrono (que tu peux rallonger ou supprimer), correction à la fin.',
    ],
  },
  {
    type: 'visite',
    cible: 'reglage-difficulte',
    titre: 'Réglage 2 : la difficulté',
    texte:
      'Facile pour découvrir, Moyen pour s’entraîner, Difficile quand le moyen devient trop simple. Les questions sont toujours nouvelles. Ce réglage n’existe qu’en mode Entraînement.',
  },
  {
    type: 'visite',
    cible: 'reglage-niveau',
    titre: 'Réglage 3 : l’objectif de score',
    texte:
      'Les questions sont les mêmes pour tout le monde. Ce choix change seulement le score cible affiché à la fin d’un examen blanc. Cet objectif est indicatif et non officiel.',
  },
  {
    type: 'visite',
    cible: 'epreuve',
    titre: 'Choisis une épreuve',
    texte:
      'Chaque carte est une épreuve du test. Clique sur son bouton pour lancer une séance. Tu peux recommencer autant que tu veux : les questions changent à chaque fois.',
  },
  {
    type: 'visite',
    cible: 'personnalite',
    titre: 'La personnalité, c’est à part',
    texte:
      'Ce questionnaire n’a pas de bonne réponse, pas de score et rien n’est enregistré : tu réponds honnêtement, c’est juste pour te familiariser avec le format long.',
  },
  {
    type: 'visite',
    cible: 'raccourci-examen',
    titre: 'L’examen blanc',
    texte:
      'Toutes les épreuves à la suite, avec leur chrono, puis ton score, ta précision et ta vitesse comparés à l’objectif. À faire quand tu te sens prêt.',
  },
  {
    type: 'visite',
    cible: 'raccourci-revision',
    titre: 'Réviser mes erreurs',
    texte:
      'Toutes les questions que tu as ratées reviennent ici. Quand tu les réussis, elles disparaissent de la liste : c’est la méthode la plus efficace pour progresser.',
  },
  {
    type: 'visite',
    cible: 'raccourci-methode',
    titre: 'Les fiches méthode',
    texte: 'Pour chaque épreuve : une fiche courte avec les astuces de calcul, les pièges et la gestion du temps. À lire avant ta première séance.',
  },
  {
    type: 'visite',
    titre: 'À toi de jouer : 3 questions',
    texte: 'On s’entraîne pour de vrai. Ces 3 essais ne comptent pas dans ta progression. Voici ce que tu verras pendant une séance.',
    points: [
      'En haut : la question en cours, une barre de progression et le chrono.',
      'Pour répondre : clique sur une proposition, ou tape 1, 2, 3 ou 4 au clavier.',
      'Touche P : passer une question pour y revenir plus tard.',
      'Une erreur ouvre une fenêtre qui explique pourquoi (ici, l’explication s’affiche sous la question).',
    ],
  },
  {
    type: 'question',
    epreuve: 'attention',
    titre: 'Question 1 sur 3 : attention',
    texte: 'Les deux suites sont-elles identiques ? Compare vite, mais compare bien.',
  },
  {
    type: 'question',
    epreuve: 'codage',
    titre: 'Question 2 sur 3 : codage',
    texte: 'Retrouve l’association dans le tableau. C’est une épreuve de rapidité et de lecture attentive.',
  },
  {
    type: 'question',
    epreuve: 'logique',
    titre: 'Question 3 sur 3 : logique des cubes',
    texte: 'Repère la règle qui fait passer d’un cube au suivant, puis applique-la une fois de plus.',
  },
  {
    type: 'visite',
    titre: 'Pendant une vraie séance',
    texte: 'Quelques réflexes à garder, surtout en examen blanc.',
    points: [
      'Tu bloques ? Passe la question (touche P) : mieux vaut moins de questions mais justes que tout bâcler.',
      'Sur certaines épreuves, il est impossible de tout finir : c’est normal.',
      'On regarde la précision ET la vitesse. Ne sacrifie pas l’une pour l’autre.',
      'Le stress abîme les réponses en fin d’épreuve : la page de résultats compare ton début et ta fin.',
    ],
  },
  {
    type: 'visite',
    titre: 'Tes résultats et ta sauvegarde',
    texte: 'Tout reste sur ton appareil. À la fin de chaque séance, tu vois ton score, ta précision et ta vitesse.',
    points: [
      'Progression : l’historique, les courbes et tes points faibles.',
      'Export : télécharge ta progression en fichier JSON pour la garder ou changer d’appareil.',
      'Import : recharge ce fichier sur un autre appareil.',
    ],
  },
  {
    type: 'visite',
    titre: 'Une question te paraît bizarre ?',
    texte:
      'Chaque question a une référence affichée en petit sous la question (par exemple « codage-v1-d2-s48213 »). Si tu trouves une erreur ou une ambiguïté, écris-la sur le forum en citant cette référence : on retrouve la question exacte et on la corrige.',
  },
  {
    type: 'visite',
    titre: 'Ton plan conseillé',
    texte: 'Tu sais tout. Pour progresser vite :',
    points: [
      '1. Lis la fiche méthode d’une épreuve.',
      '2. Entraîne-toi dessus en Moyen, et lis chaque explication.',
      '3. Fais la Révision de tes erreurs.',
      '4. Quand tu es à l’aise, lance un examen blanc.',
      'Les formats et les durées sont indicatifs : ils peuvent différer des vraies épreuves.',
    ],
  },
];

function itemPourEpreuve(epreuve: EpreuveId): Item {
  const gen = GENERATEURS[epreuve]!;
  const ref = gen.construireRefs({ graineBase: 4242, nb: 1, difficulte: 1, config: EPREUVES[epreuve] })[0];
  return gen.generer(ref);
}

function trouverCible(etape: Etape): HTMLElement | null {
  if (etape.type !== 'visite' || !etape.cible) return null;
  const el = document.querySelector<HTMLElement>(`[data-guide="${etape.cible}"]`);
  // Un élément caché (largeur ou hauteur nulle) ne peut pas être mis en avant
  return el && el.getBoundingClientRect().width > 0 ? el : null;
}

function ecranVisible(): { largeur: number; hauteur: number } {
  const vv = window.visualViewport;
  return { largeur: Math.round(vv?.width ?? window.innerWidth), hauteur: Math.round(vv?.height ?? window.innerHeight) };
}

const PADDING_HALO = 6;

interface Props {
  onFermer(): void;
}

export default function Guide({ onFermer }: Props) {
  const [indice, setIndice] = useState(0);
  const [choix, setChoix] = useState<Record<number, number>>({});
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [halo, setHalo] = useState<Rect | null>(null);
  const carteRef = useRef<HTMLDivElement>(null);
  const boutonRef = useRef<HTMLButtonElement>(null);
  const etape = ETAPES[indice];
  const dernier = indice === ETAPES.length - 1;
  const estQuestion = etape.type === 'question';

  const items = useMemo(() => {
    const m = new Map<number, Item>();
    ETAPES.forEach((e, i) => {
      if (e.type === 'question') m.set(i, itemPourEpreuve(e.epreuve));
    });
    return m;
  }, []);
  const item = items.get(indice);
  const reponse = choix[indice];
  const doitRepondre = estQuestion && reponse === undefined;

  // Bloque le défilement de la page derrière le guide, et rend le focus à la fermeture.
  useEffect(() => {
    const precedent = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = overflow;
      precedent?.focus?.({ preventScroll: true });
    };
  }, []);

  const calculer = useCallback(
    (ajuster: boolean) => {
      const carte = carteRef.current;
      if (!carte) return;
      if (estQuestion) {
        setPlacement(null);
        setHalo(null);
        return;
      }
      const el = trouverCible(etape);
      let cible: Rect | null = null;
      if (el) {
        const r = el.getBoundingClientRect();
        cible = {
          top: r.top - PADDING_HALO,
          left: r.left - PADDING_HALO,
          width: r.width + 2 * PADDING_HALO,
          height: r.height + 2 * PADDING_HALO,
        };
      }
      const p = calculerPlacement(cible, ecranVisible(), carte.scrollHeight + 2);
      if (ajuster && cible && p.mode === 'feuille') {
        // La bulle masque le bas de l'écran : on fait défiler la page pour garder l'élément visible au-dessus.
        const zone = zoneLibreAuDessus(p);
        const libre = zone.bas - zone.haut;
        const delta = cible.height <= libre ? cible.top + cible.height / 2 - (zone.haut + libre / 2) : cible.top - zone.haut;
        if (Math.abs(delta) > 1) {
          window.scrollBy(0, delta);
          calculer(false);
          return;
        }
      }
      setHalo(cible);
      setPlacement(p);
    },
    [estQuestion, etape],
  );

  // À chaque étape : amener la cible à l'écran puis placer la bulle.
  useLayoutEffect(() => {
    trouverCible(etape)?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
    calculer(true);
  }, [etape, calculer, reponse]);

  useEffect(() => {
    const recalcul = () => calculer(false);
    window.addEventListener('resize', recalcul);
    window.visualViewport?.addEventListener('resize', recalcul);
    return () => {
      window.removeEventListener('resize', recalcul);
      window.visualViewport?.removeEventListener('resize', recalcul);
    };
  }, [calculer]);

  useEffect(() => {
    boutonRef.current?.focus({ preventScroll: true });
    carteRef.current?.scrollTo?.({ top: 0 });
  }, [indice]);

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
      } else if (e.key === 'Tab') {
        // Le focus reste dans la bulle.
        const carte = carteRef.current;
        if (!carte) return;
        const focusables = [...carte.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
        if (focusables.length === 0) return;
        const premier = focusables[0];
        const dernierEl = focusables[focusables.length - 1];
        const actif = document.activeElement;
        if (e.shiftKey && (actif === premier || !carte.contains(actif))) {
          e.preventDefault();
          dernierEl.focus();
        } else if (!e.shiftKey && (actif === dernierEl || !carte.contains(actif))) {
          e.preventDefault();
          premier.focus();
        }
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

  const styleCarte = estQuestion
    ? undefined
    : placement
    ? { top: placement.carte.top, left: placement.carte.left, width: placement.carte.width, maxHeight: placement.carte.hauteur }
    : { visibility: 'hidden' as const };

  return (
    <div className="guide" role="dialog" aria-modal="true" aria-labelledby="guide-titre">
      {halo && !estQuestion ? (
        <div className="guide-halo" style={{ top: halo.top, left: halo.left, width: halo.width, height: halo.height }} />
      ) : (
        <div className="guide-fond" />
      )}
      <div ref={carteRef} className={`guide-carte ${estQuestion ? 'guide-carte-large' : ''}`} style={styleCarte}>
        {placement?.fleche && !estQuestion && (
          <span
            className={`guide-fleche guide-fleche-${placement.fleche.cote}`}
            style={placement.fleche.cote === 'haut' || placement.fleche.cote === 'bas' ? { left: placement.fleche.pos } : { top: placement.fleche.pos }}
            aria-hidden="true"
          />
        )}
        <p className="guide-compteur">
          Étape {indice + 1} / {ETAPES.length}
        </p>
        <div className="guide-barre" aria-hidden="true">
          <span style={{ width: `${((indice + 1) / ETAPES.length) * 100}%` }} />
        </div>
        <h2 id="guide-titre" className="guide-titre">
          {etape.titre}
        </h2>
        <p>{etape.texte}</p>
        {etape.type === 'visite' && etape.points && (
          <ul className="guide-points">
            {etape.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}

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
