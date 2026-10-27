# Formats à valider auprès de candidats

Les formats ci-dessous viennent de témoignages et de sites de préparation dont les chiffres divergent.
Tout est paramétrable dans `src/config/epreuves.ts` (et `src/config/niveaux.ts` pour les objectifs).
Quand tu as une info fiable, change la valeur et coche la ligne.

## Constat de recherche
Une recherche web n'a trouvé **aucune source officielle publique** décrivant le format exact du test psychotechnique de
l'armée de Terre (seulement des supports de préparation et des documents génériques). Les chiffres ci-dessous viennent de
témoignages de candidats. Pour l'officiel : sengager.fr ou un CIRFA.

## Attention / concentration
- [ ] Nombre de questions : 45 (témoignages : 40 à 45)
- [ ] Durée : 3 min 30
- [ ] Peut-on passer une question ? (actuellement : non)
- [ ] Longueur des suites : 5 à 8 caractères selon la difficulté
- [ ] Types de différences réellement rencontrés (transposition, substitution, doublement, omission)

## Codage
- [ ] Nombre de questions : 45 en 2 min 30
- [ ] **Sens** : numéro → mot (actuel) ou mot → numéro (`parametres.sens`)
- [ ] Taille du tableau : 12 mots (`tailleTableau`)
- [ ] Combien de questions partagent le même tableau ? Actuellement 15 (`questionsParTableau`) : choix arbitraire, à valider
- [ ] Nombre de propositions : 5 (actuel) ou autre mécanisme de réponse
- [ ] Numéros à 2 chiffres (facile/moyen) ou 3 chiffres (difficile) : à valider
- [ ] Liste de mots : 215 mots rédigés à la main, à étendre vers 500-1 000 (le tableau n'est pas dépendant du nombre de mots)

## Raisonnement spatial
- [ ] Variantes réellement rencontrées : quadrillages tournés, cubes retournés, patron de cube ? (config `variantes`, répartition actuelle `grille,vues,grille,patron`)
- [ ] Sens des rotations de quadrillage : horaire, anti-horaire ou mixte (`sensRotation`, actuellement mixte, précisé dans la consigne)
- [ ] Taille des grilles : 4×4 / 5×5 / 6×6 selon la difficulté (le brief indique souvent 5×5)
- [ ] Les cubes du vrai test montrent-ils un patron ? deux vues ? Les symboles sont ici des motifs 3×3 asymétriques (choix de conception)

## Raisonnement logique
- [ ] Types de règles réellement rencontrés (ici : rotation d'un symbole, échange, décalage circulaire, symbole suivant, tiers de tour du cube autour de l'axe de vue, combinaisons de deux règles)
- [ ] Nombre de cubes affichés : 3 (facile, moyen) ou 4 (difficile) ici

## Verbal et anglais
- [ ] **Relecture humaine obligatoire** des 153 items verbaux et des 158 items d'anglais (rédigés pour ce projet avec l'aide d'une IA, donc `relecture: null`)
- [ ] Types d'items verbaux réellement rencontrés (synonymes, intrus, vocabulaire, proverbes, orthographe : confirmés par le brief ; analogies et grammaire : ajoutés)
- [ ] Nombre de propositions : 4 (config `nbChoix`)

## Personnalité
- [ ] Nombre d'affirmations réel (100 à 250) ; ici 50 affirmations adaptées des « Big-Five Factor Markers » de l'IPIP, **traduction faite pour ce projet, non validée** (le site ipip.ori.org n'était pas joignable pour récupérer la version française officielle)

## Pénalité d'erreur
- [ ] Une mauvaise réponse retire-t-elle des points ? (actuellement : non, `penaliteErreur: 0`)

## Objectifs par niveau visé (INDICATIFS, choisis arbitrairement pour démarrer)
- [ ] Précision et bonnes réponses/min pour militaire du rang / sous-officier / officier
  sur chaque épreuve : à ajuster avec des retours de candidats

## Autres épreuves (valeurs de départ dans la config)
- [ ] Logique : 14 à 25 questions, 7 à 14 min (ici 20 en 10 min)
- [ ] Spatial : ~25 questions en 7 min
- [ ] Verbal : ~31 questions en 8 min
- [ ] Numérique : ~25 questions en 18 min
- [ ] Anglais : 100 à 150 questions, ~55 min (ici 100 en 55 min)
- [ ] Ordre de l'examen blanc : logique, spatial, verbal, numérique, codage, attention (`src/config/examen.ts`)
