# Formats à valider auprès de candidats

Les formats ci-dessous viennent de témoignages et de sites de préparation dont les chiffres divergent.
Tout est paramétrable dans `src/config/epreuves.ts` (et `src/config/niveaux.ts` pour les objectifs).
Quand tu as une info fiable, change la valeur et coche la ligne.

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
- [ ] Liste de mots : 215 mots rédigés à la main, à étendre vers 500-1 000

## Pénalité d'erreur
- [ ] Une mauvaise réponse retire-t-elle des points ? (actuellement : non, `penaliteErreur: 0`)

## Objectifs par niveau visé (INDICATIFS, choisis arbitrairement pour démarrer)
- [ ] Précision et bonnes réponses/min pour militaire du rang / sous-officier / officier
  sur chaque épreuve : à ajuster avec des retours de candidats

## Épreuves non implémentées (valeurs de départ dans la config)
- [ ] Logique : 14 à 25 questions, 7 à 14 min
- [ ] Spatial : ~25 questions en 7 min
- [ ] Verbal : ~31 questions en 8 min
- [ ] Numérique : ~25 questions en 18 min
- [ ] Anglais : 100 à 150 questions, ~55 min
- [ ] Personnalité : 100 à 250 questions
