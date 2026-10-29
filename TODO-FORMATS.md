# Formats à valider auprès de candidats

Les formats ci-dessous viennent de témoignages et de sites de préparation dont les chiffres divergent.
Tout est paramétrable dans `src/config/epreuves.ts` (et `src/config/niveaux.ts` pour les objectifs).
Quand tu as une info fiable, change la valeur et coche la ligne.

## Constat de recherche
Une recherche web n'a trouvé **aucune source officielle publique** décrivant le format exact du test psychotechnique de
l'armée de Terre (seulement des supports de préparation et des documents génériques). Les chiffres ci-dessous viennent de
témoignages de candidats. Pour l'officiel : sengager.fr ou un CIRFA.

## Attention / concentration (refaite le 29 octobre 2026, voir `RECHERCHE-FORMATS.md`)
- [x] Format : plusieurs séries de caractères, trouver l'intrus ou « Pas d'intrus » (retex 2017 à 2026)
- [ ] Nombre de séries : 5 d'après les retex 2025 ; ici **3 séries + « Pas d'intrus » = 4 propositions** (règle des 4 propositions maximum, `nbChoix`)
- [ ] Nombre de questions : 40 (3 min 30), d'après les sites et les retex
- [ ] Proportion de questions sans intrus : 25 % ici (`PROBA_SANS_INTRUS`), non confirmée
- [ ] Types de séries réellement rencontrés : chiffres, lettres, mélange (ici) ; noms propres cités une fois (2017), non implémentés
- [ ] Peut-on passer une question ? (actuellement : non)

## Codage (refait le 29 octobre 2026)
- [x] Format : tableau de 12 mots avec un code à 4 chiffres, affiché en permanence ; on donne un mot, on retrouve son code parmi 4 codes très proches (retex 2017 à 2026)
- [ ] Nombre de questions : 40 en 2 min 30 (retex 2025 et 2026) ; 45 selon des sites
- [ ] Le tableau reste le même pendant toute la séance (`questionsParTableau: 1000`)
- [ ] Les faux codes diffèrent d'un à trois chiffres du bon (selon la difficulté) : proportion non confirmée
- [ ] Liste de mots : 215 mots rédigés à la main, à étendre ; les retex citent des mots longs (« Submersible », « Motocyclette »)

## Raisonnement spatial
- [x] Variante : rotation de grille uniquement (retex 2013 à 2026) ; cubes retournés et patrons non cités, désactivés par défaut (`variantes: 'grille'`)
- [ ] Les distracteurs miroir existent (un retex de 2013 : deux candidats ont choisi une grille « inversée »), alors que la bonne réponse est toujours une rotation de 90°, 180° ou 270°
- [ ] Sens des rotations : horaire, anti-horaire ou mixte (`sensRotation`, actuellement mixte, précisé dans la consigne)
- [ ] Taille des grilles : 5×5 d'après les sources (ici 4×4 à 6×6 selon la difficulté)
- [ ] 4 ou 5 propositions : 4 ici (règle du testeur), 5 d'après les sites

## Raisonnement logique
- [ ] Types de règles réellement rencontrés (ici : rotation d'un symbole, échange, décalage circulaire, symbole suivant, tiers de tour du cube autour de l'axe de vue, combinaisons de deux règles)
- [ ] Nombre de cubes affichés : 3 (facile, moyen) ou 4 (difficile) ici

## Raisonnement général (épreuve complémentaire)
- [ ] **Existe-t-elle au test Terre, et sous quelle forme ?** Les types (suites de nombres, de lettres, de mots, logique de comparaison) ont été ajoutés à partir d'une fiche d'exemples trouvée en ligne (Armée de l'air) et d'un témoignage de candidat : présence exacte non confirmée
- [ ] Rattachement : épreuve à part (actuel, option de l'examen blanc) ou intégrée à « logique » / « numérique » ?
- [ ] Format : 20 questions en 8 min (valeur de départ arbitraire), 4 propositions
- [ ] Épreuve de **mémoire / observation** (« quels objets étaient affichés ? ») : non implémentée, à décider

## Verbal et anglais
- [ ] **Relecture humaine obligatoire** (une passe IA a déjà eu lieu, voir `RELECTURE.md` avec la liste des questions encore discutables) des items verbaux (179 actifs) et des 327 items d’anglais (rédigés pour ce projet avec l'aide d'une IA, donc `relecture: null`)
- [x] Types d'items verbaux réellement rencontrés : synonymes, antonymes, définitions, intrus (retex) ; **proverbes et orthographe retirés** (aucun témoin n'en parle, items conservés avec `actif: false`) ; analogies et grammaire gardées, non confirmées
- [ ] Nombre de propositions : 4 (config `nbChoix`)

## Personnalité
- [ ] Nombre d'affirmations réel (100 à 250 ; une source de préparation parle de 251 affirmations en 50 minutes) ; ici 250 affirmations (50 par dimension), toutes issues de l'IPIP (code d'origine dans le champ `source`), traduites et reformulées, **non validées psychométriquement**

## Pénalité d'erreur
- [ ] Une mauvaise réponse retire-t-elle des points ? (actuellement : non, `penaliteErreur: 0`)

## Objectifs par niveau visé (INDICATIFS, choisis arbitrairement pour démarrer)
- [ ] Précision et bonnes réponses/min pour militaire du rang / sous-officier / officier
  sur chaque épreuve : à ajuster avec des retours de candidats

## Autres épreuves (valeurs de départ dans la config)
- [ ] Logique : 14 à 25 questions, 7 à 14 min selon les sources (ici 25 en 14 min, valeurs de l’oct. 2026 d’un site de préparation, non officielles)
- [ ] Spatial : ~25 questions en 7 min
- [ ] Verbal : ~31 questions en 8 min
- [ ] Numérique : ~25 questions en 18 min
- [x] Anglais : 150 questions, 55 min, 5 propositions d'après les retex (ici 4 propositions)
- [ ] Ordre de l'examen blanc : logique, spatial, verbal, numérique, codage, attention (`src/config/examen.ts`)

- [x] Nombre de propositions : 4 maximum pour tous les QCM (retour d'un testeur : « 5 propositions aux cubes, c'est trop »). Réglable par épreuve dans `src/config/epreuves.ts` (`nbChoix`). À confirmer auprès de candidats.
