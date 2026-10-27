import type { EpreuveId } from '../lib/types';

/**
 * Fiches méthode : courtes et simples. Contenu original rédigé pour ce projet.
 * Les épreuves étant reconstituées à partir de témoignages, ces conseils portent sur la
 * démarche de résolution, pas sur des « recettes » liées à un format officiel.
 */
export interface Section {
  titre: string;
  points: string[];
}

export interface FicheMethode {
  id: EpreuveId | 'general';
  titre: string;
  resume: string;
  sections: Section[];
}

export const FICHES: FicheMethode[] = [
  {
    id: 'general',
    titre: 'Gestion du temps et du stress',
    resume: 'Valable pour toutes les épreuves chronométrées.',
    sections: [
      {
        titre: 'Le principe : régularité, pas exhaustivité',
        points: [
          'Sur plusieurs épreuves, le temps est volontairement trop court : on ne cherche pas à tout finir.',
          'Une réponse juste et rapide vaut mieux que dix réponses bâclées : regarde toujours ta précision ET ta vitesse après une séance.',
          'On ne sait pas si une mauvaise réponse est pénalisée (point à valider). En cas de doute, ne réponds pas au hasard systématiquement : réponds quand tu as une raison de préférer une proposition.',
        ],
      },
      {
        titre: 'La règle des deux passes',
        points: [
          'Première lecture : 10 à 15 secondes. Si tu n’as pas d’idée, passe (touche P quand l’épreuve le permet) et reviens-y à la fin.',
          'Ne te laisse pas bloquer sur une seule question : elle ne vaut pas plus qu’une autre.',
          'Chaque épreuve a son propre rythme : dans l’appli, la vitesse cible est affichée en bonnes réponses par minute.',
        ],
      },
      {
        titre: 'Le stress et la fatigue',
        points: [
          'Observe l’indicateur « précision début → fin » : si tu t’effondres en fin d’épreuve, ralentis légèrement dès le début.',
          'Entraîne-toi sur ordinateur, au clavier, à l’heure où tu passeras le test, avec des séances courtes et régulières (15 à 20 minutes) plutôt qu’un marathon.',
          'Dors bien la veille, bois de l’eau, arrive en avance. Une respiration lente de 30 secondes entre deux épreuves aide à relâcher la tension.',
        ],
      },
      {
        titre: 'Garder le recul',
        points: [
          'Les tests ne sont qu’une partie du dossier (entretien, sport, anglais, etc.).',
          'S’entraîner améliore la familiarité avec les formats et la vitesse, mais ne garantit pas la correspondance exacte avec le test réel.',
        ],
      },
    ],
  },
  {
    id: 'attention',
    titre: 'Attention / concentration',
    resume: 'Deux suites de lettres : identiques ou non ? Pure vitesse de comparaison.',
    sections: [
      {
        titre: 'Méthode',
        points: [
          'Compare par petits blocs de 2 ou 3 lettres, de gauche à droite, plutôt que lettre par lettre ou « globalement ».',
          'Si tu trouves une différence, arrête-toi : inutile de relire la suite entière.',
          'Garde les yeux et les mains en rythme : utilise les touches du clavier (← identiques, → différentes) plutôt que la souris.',
        ],
      },
      {
        titre: 'Les pièges classiques',
        points: [
          'Deux lettres inversées (AQWZSX / AQWSZX) : la bonne composition de lettres masque la différence.',
          'Une lettre proche visuellement : O/Q, E/F, M/N, P/R, I/L, C/G, U/V.',
          'Une lettre doublée ou oubliée : regarde la longueur des deux suites avant tout.',
        ],
      },
      {
        titre: 'S’entraîner',
        points: [
          'Commence en difficulté facile pour installer le geste, puis monte.',
          'Vise d’abord 90 % de précision, puis augmente la vitesse sans descendre sous ce seuil.',
        ],
      },
    ],
  },
  {
    id: 'codage',
    titre: 'Codage',
    resume: 'Retrouver vite l’association entre un mot et un numéro.',
    sections: [
      {
        titre: 'Méthode',
        points: [
          'Le tableau reste affiché : ne mémorise pas tout, mais repère les mots par leur initiale et par leur position.',
          'Balaye le tableau d’un seul regard, de gauche à droite, jusqu’au numéro (ou au mot) demandé, puis vérifie dans les propositions.',
          'Ne lis pas toutes les propositions avant de chercher : trouve d’abord la réponse dans le tableau.',
        ],
      },
      {
        titre: 'Les pièges classiques',
        points: [
          'Les mauvaises propositions sont des couples voisins du bon : mêmes initiales, numéros proches ou cases adjacentes.',
          'Des numéros dont les chiffres sont inversés (43 / 34) : vérifie les deux chiffres.',
          'Les tableaux changent après un certain nombre de questions : relis le nouveau tableau avant de reprendre le rythme.',
        ],
      },
      {
        titre: 'S’entraîner',
        points: [
          'Répétition courte et rapide : le but est un réflexe, pas de la réflexion.',
          'Le sens de la question (numéro → mot ou mot → numéro) peut varier : entraîne-toi aux deux.',
        ],
      },
    ],
  },
  {
    id: 'logique',
    titre: 'Raisonnement logique (suites de cubes)',
    resume: 'Comprendre la règle qui fait passer d’un cube au suivant, puis l’appliquer une fois de plus.',
    sections: [
      {
        titre: 'Méthode',
        points: [
          'Compare deux cubes consécutifs face par face (dessus, devant, droite) : qu’est-ce qui change exactement ?',
          'Formule la règle avec des mots (« le symbole du dessus tourne d’un quart de tour horaire »), puis vérifie-la sur TOUTE la suite, pas seulement sur le premier passage.',
          'Applique ensuite la règle au dernier cube, face par face, puis élimine les propositions dont une face est fausse.',
        ],
      },
      {
        titre: 'Les familles de règles',
        points: [
          'Un symbole qui tourne : quart de tour (horaire ou anti-horaire) ou demi-tour.',
          'Des symboles qui changent de face : échange de deux faces, ou décalage circulaire des trois faces.',
          'Un symbole remplacé par un autre dans un ordre fixe (le « suivant » dans la série).',
          'Le cube qui pivote sur lui-même : les trois symboles visibles se remplacent circulairement et tournent avec leur face.',
          'Deux règles combinées : cherche d’abord ce qui bouge, puis comment.',
        ],
      },
      {
        titre: 'Les pièges classiques',
        points: [
          'La règle appliquée une fois de trop, ou pas du tout (le dernier cube recopié).',
          'Le bon changement dans le mauvais sens (horaire / anti-horaire).',
          'Le cube miroir : tous les symboles sont inversés gauche-droite. Repère un symbole asymétrique pour le détecter.',
        ],
      },
    ],
  },
  {
    id: 'spatial',
    titre: 'Raisonnement spatial',
    resume: 'Quadrillages tournés, patrons de cubes et cubes retournés.',
    sections: [
      {
        titre: 'Quadrillages tournés',
        points: [
          'Choisis une case repère (un coin, une case isolée) et suis-la pendant la rotation.',
          'Un quart de tour horaire : la première ligne devient la dernière colonne. Un demi-tour : la grille est lue à l’envers, de bas en haut et de droite à gauche.',
          'Les miroirs ressemblent à une rotation mais échangent la gauche et la droite (ou le haut et le bas) : vérifie avec ton repère.',
          'Élimine vite : compte les cases noires de la première ligne dans la grille attendue.',
        ],
      },
      {
        titre: 'Patron de cube et cube retourné',
        points: [
          'Dans un patron en croix, deux carrés séparés par exactement un carré, en ligne, sont des faces opposées.',
          'Choisis deux faces voisines visibles dans une proposition et retrouve leur position relative dans le patron ou dans le modèle : si l’une est à gauche de l’autre, elle doit l’être aussi dans la réponse, avec le même sens de rotation du symbole.',
          'Les faux cubes sont souvent des miroirs, des symboles pivotés ou échangés : vérifie l’orientation du symbole, pas seulement sa nature.',
        ],
      },
      {
        titre: 'S’entraîner',
        points: [
          'Les symboles ne sont jamais symétriques : une rotation et un miroir donnent toujours des images différentes.',
          'Prends l’habitude de décrire à voix basse : « face du dessus : le symbole pointe vers la droite ».',
        ],
      },
    ],
  },
  {
    id: 'numerique',
    titre: 'Aptitude numérique',
    resume: 'Calcul niveau 3e, sous pression de temps.',
    sections: [
      {
        titre: 'Méthode',
        points: [
          'Estime d’abord l’ordre de grandeur : cela élimine souvent deux ou trois propositions.',
          'Pour un pourcentage : 10 % = diviser par 10 ; 5 % = la moitié de 10 % ; 1 % = diviser par 100. Combine-les (15 % = 10 % + 5 %).',
          'Convertis les durées en minutes avant de calculer : 1 h 30 = 90 min, jamais 1,30 h ni 130 min.',
          'Vérifie l’unité demandée à la fin (minutes ou heures, euros ou pourcentage).',
        ],
      },
      {
        titre: 'Les problèmes types',
        points: [
          'Poules et lapins : suppose que tous les animaux sont des poules, calcule les pattes manquantes, divise par 2 pour trouver le nombre de lapins.',
          'Hausse puis baisse de même taux : elles ne s’annulent pas. Multiplie les coefficients (×1,2 puis ×0,8 = ×0,96).',
          'Fractions successives : multiplie les restes (si on consomme 1/4 puis 1/3 du reste, il reste 3/4 × 2/3).',
          'Vitesse moyenne d’un aller-retour : ce n’est pas la moyenne des deux vitesses ; calcule la distance totale divisée par le temps total.',
          'Moyenne manquante : total visé − total obtenu.',
        ],
      },
      {
        titre: 'Les pièges classiques',
        points: [
          'Base 100 au lieu de base 60 pour les durées.',
          'Pourcentage appliqué au mauvais prix (départ ou arrivée).',
          'Fraction inversée, ou addition de fractions sans dénominateur commun.',
          'Il est quasi impossible de tout finir : passe les énoncés longs et reviens-y à la fin.',
        ],
      },
    ],
  },
  {
    id: 'verbal',
    titre: 'Aptitude verbale',
    resume: 'Synonymes, contraires, intrus, vocabulaire, proverbes, orthographe, analogies.',
    sections: [
      {
        titre: 'Méthode',
        points: [
          'Écarte d’abord les propositions que tu sais fausses : la bonne réponse apparaît souvent par élimination.',
          'Synonymes : remplace le mot dans une phrase simple et vérifie que le sens est conservé.',
          'Intrus : cherche la catégorie commune aux autres mots avant de regarder le mot isolé ; attention aux catégories voisines (planète / satellite).',
          'Analogies : exprime la relation en une phrase (« un marin navigue sur un bateau ») puis applique-la à l’autre couple.',
        ],
      },
      {
        titre: 'Orthographe et vocabulaire',
        points: [
          'Pense à la famille du mot : « accueillir » s’écrit comme « cueillir » ; « développer » prend deux « p » mais un seul « l ».',
          'Préfixes et racines aident à deviner un mot inconnu : in- (contraire), dé-, omni- (tout), phil- (aimer), -phobe (craindre).',
          'Proverbes : lis la phrase à haute voix dans ta tête, la bonne fin sonne juste.',
        ],
      },
      {
        titre: 'Les pièges classiques',
        points: [
          'Les mauvaises réponses d’un synonyme sont souvent des contraires.',
          'Deux réponses semblent possibles : choisis celle dont le sens est le plus courant et passe à la suite.',
        ],
      },
    ],
  },
  {
    id: 'raisonnement',
    titre: 'Raisonnement général (complémentaire)',
    resume: 'Suites de nombres, de lettres et de mots, logique de comparaison.',
    sections: [
      {
        titre: 'Suites de nombres',
        points: [
          'Calcule d’abord les écarts entre termes consécutifs. Constants : suite arithmétique. Qui changent régulièrement (+2, +3, +4…) : regarde les écarts des écarts.',
          'Teste ensuite les rapports (×2, ×3), puis « × a + b » (1, 3, 7, 15 : on double et on ajoute 1).',
          'Reconnais les suites classiques : carrés (1, 4, 9, 16, 25), cubes (1, 8, 27, 64), nombres triangulaires (1, 3, 6, 10, 15), somme des deux termes précédents (1, 1, 2, 3, 5, 8).',
          'Si les termes pairs et impairs semblent suivre deux logiques différentes, sépare-les en deux suites.',
        ],
      },
      {
        titre: 'Suites de lettres et de mots',
        points: [
          'Convertis les lettres en rangs (A = 1 … Z = 26) et traite-les comme des nombres. Après Z, on revient à A.',
          'A – C – F – J – O : les écarts sont +2, +3, +4, +5, donc le suivant est O + 6 = U.',
          'Suites de mots (jours, mois, saisons) : repère le pas (de 1 en 1, de 2 en 2…) et le sens (avant ou arrière). La liste est circulaire : après dimanche, on revient à lundi.',
        ],
      },
      {
        titre: 'Logique de comparaison',
        points: [
          'Remets toutes les phrases dans le même sens avant de les assembler : « B est plus petit que A » équivaut à « A est plus grand que B ».',
          'Construis une chaîne : Pierre > Paul > Jean. Lis alors la réponse au bout de la chaîne.',
          'Attention au piège du « plus petit » quand toutes les phrases parlent du « plus grand » (et inversement).',
        ],
      },
      {
        titre: 'Gestion du temps',
        points: [
          'Ces questions sont rapides si on trouve la règle, et longues sinon : au bout de quelques secondes sans idée, passe et reviens-y.',
          'Vérifie ta règle sur TOUS les termes affichés avant de répondre, pas seulement sur les deux premiers.',
        ],
      },
    ],
  },
  {
    id: 'anglais',
    titre: 'Anglais',
    resume: 'Grammaire et vocabulaire, niveau collège-lycée.',
    sections: [
      {
        titre: 'Méthode',
        points: [
          'Cherche le marqueur de temps (yesterday, since, already, every day, last week…) : il impose presque toujours la bonne forme.',
          'Lis la phrase entière avant de choisir : la fin donne souvent la structure attendue (to, -ing, participe passé).',
          'Environ 30 secondes par question : si tu hésites, élimine ce qui est faux et passe.',
        ],
      },
      {
        titre: 'Les points qui reviennent',
        points: [
          'since + date / for + durée / ago : « since 2010 », « for five years », « two hours ago ».',
          'Present perfect : have/has + participe passé (written, been, gone) ; passé simple avec les marqueurs de passé révolu.',
          'Comparatifs : -er than (adjectif court), more … than (adjectif long), the -est / the most.',
          'Conditionnels : if + présent → will ; if + prétérit → would ; if + past perfect → would have + participe passé.',
          'Modaux : must (obligation), mustn’t (interdiction), don’t have to (absence d’obligation), can’t be (déduction négative).',
          'Prépositions fixes : interested in, afraid of, good at, depend on, look for / after.',
          '-ed ou -ing : un adjectif en -ed décrit ce que l’on ressent (bored), en -ing ce qui provoque le sentiment (boring).',
        ],
      },
      {
        titre: 'S’entraîner',
        points: [
          'Apprends une dizaine de mots par jour, en phrase complète.',
          'Mémorise la liste des verbes irréguliers les plus courants (go, see, buy, write, eat, lose…).',
        ],
      },
    ],
  },
  {
    id: 'personnalite',
    titre: 'Questionnaire de personnalité',
    resume: 'Il n’y a pas de « bonne réponse » à entraîner : seulement un format à connaître.',
    sections: [
      {
        titre: 'Ce qu’il faut savoir',
        points: [
          'Les questionnaires de type « Big Five » décrivent cinq dimensions : extraversion, agréabilité, conscience, stabilité émotionnelle, ouverture. Aucune n’est « meilleure » dans l’absolu.',
          'Le format est long (100 à 250 affirmations selon les témoignages) : la difficulté est surtout de rester attentif jusqu’au bout.',
          'Il est courant que les mêmes idées soient reformulées plusieurs fois.',
        ],
      },
      {
        titre: 'Conseils de format',
        points: [
          'Réponds spontanément, en pensant à ta manière d’être habituelle plutôt qu’à une situation précise.',
          'Utilise toute l’échelle, y compris les extrémités quand elles te correspondent.',
          'Garde la même concentration en fin de questionnaire qu’au début.',
          'Cette appli ne propose qu’un mode découverte, sans score ni conseil de réponse : c’est volontaire.',
        ],
      },
    ],
  },
];

export const FICHES_PAR_ID = new Map(FICHES.map((f) => [f.id, f]));
