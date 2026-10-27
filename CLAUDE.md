# BRIEF PROJET : appli gratuite d'entraînement aux tests de sélection de l'armée de Terre

À lire en entier avant de coder. Ce fichier est le point de départ du projet. Tu peux le copier à la racine du dépôt sous le nom `CLAUDE.md` pour qu'il serve de contexte permanent.

---

## 1. Qui, quoi, pourquoi

- Je suis développeur (22 ans, bac+5 data & IA). Je prépare les sélections de l'armée de Terre (officier sous contrat, OSC-E).
- Constat : les outils d'entraînement aux tests d'entrée sont presque tous payants ou très limités (quelques offres freemium existent, avec un nombre de tests gratuits limité et un compte obligatoire).
- Objectif : créer **une appli web 100 % gratuite, sans compte, sans pub, non lucrative**, ouverte à tous les candidats (militaires du rang, sous-officiers, officiers), avec une banque de questions **originale et illimitée**, faite par et pour les candidats.
- Langue de l'appli et de la documentation : **français**.

## 2. Contraintes non négociables

1. **Coût : 0 €.** Hébergement gratuit (Vercel, plan gratuit, projet non commercial, adresse en `.vercel.app`). Aucun nom de domaine payant, aucune API payante.
2. **Pas de backend, pas de base de données au départ.** Site 100 % statique. Firebase (plan gratuit) uniquement plus tard, si on veut des stats anonymes ou un bouton « signaler une erreur », et seulement après validation de ma part.
3. **Aucune IA appelée à l'exécution.** Les questions sont soit générées par du code dans le navigateur, soit écrites à l'avance et stockées en JSON dans le dépôt.
4. **Pas de compte utilisateur.** Progression et scores stockés dans le navigateur (localStorage), avec export/import en JSON pour changer d'appareil.
5. **Aucune copie de vraies questions** de concours ni de contenus de sites de prépa. Interdiction de scraper ces sites ou des forums. Toutes les questions sont **créées de zéro**.
6. **Pas de pub, pas d'abonnement, pas de partie payante, pas de bouton de don** (Vercel réserve son plan gratuit aux usages non commerciaux).
7. **Les réponses du test de personnalité ne quittent jamais l'appareil.** Aucun envoi au serveur.
8. **Mention de non-affiliation obligatoire et visible** : « Application indépendante, non affiliée au ministère des Armées ni à l'armée de Terre. Les formats sont reconstitués à partir d'informations publiques et peuvent différer des épreuves réelles. » Aucun logo, insigne ou charte graphique officiels.
9. Site **responsive** (PC d'abord, car les vrais tests se passent sur ordinateur, mais utilisable sur téléphone).

## 3. Stack technique

- Vite + React + TypeScript
- SVG généré par React pour toutes les images (quadrillages, symboles, cubes, tableaux)
- Générateur de nombres pseudo-aléatoires à graine (seedable PRNG) : une même graine donne toujours la même question
- Tests unitaires (Vitest) sur tous les générateurs
- Déploiement : GitHub → Vercel (déploiement automatique à chaque push)
- Stockage : localStorage (avec try/catch partout, il peut être vide ou bloqué)
- Pas de librairie lourde : si on a besoin d'un routeur, React Router suffit. Pas de framework de composants imposant un gros bundle.
- Three.js / react-three-fiber : **optionnel et plus tard**, uniquement pour un mode « explication » où l'on fait tourner un cube. Les cubes des QCM sont en **projection isométrique SVG**, plus simple à tester et identique sur tous les écrans.

Principe central : **un item = un générateur + une graine + des paramètres de difficulté, sérialisable en JSON.** Cela permet une banque infinie mais reproductible, des tests unitaires, et un signalement d'erreur précis (« épreuve X, graine 48213 »).

## 4. Ce qu'on sait des épreuves (À VÉRIFIER, formats NON officiels)

Aucune source officielle publique ne décrit le format exact. Les infos viennent de témoignages de candidats et de sites de préparation commerciaux, dont les chiffres divergent. **Donc : nombre de questions, durée, nombre de choix et sens de chaque épreuve doivent être PARAMÉTRABLES (fichier de config), jamais figés dans le code.** L'appli affiche que les formats sont indicatifs.

Test psychotechnique, sur PC, en QCM, 6 épreuves enchaînées :

1. **Raisonnement logique** : suites de deux ou trois cubes portant des symboles sur les faces, avec une transformation à comprendre entre eux. Il faut ensuite choisir le cube qui suit la même logique. Chiffres vus : environ 14 à 25 questions, 7 à 14 min.
2. **Raisonnement spatial** : deux variantes décrites selon les témoignages. (a) Quadrillage noir/blanc ayant subi une rotation de 90°, 180° ou 270° : retrouver la bonne grille. (b) Un cube modèle retourné, à retrouver parmi 5 propositions (1 bon, 4 faux). On implémente les deux. Environ 25 questions en 7 min.
3. **Aptitude verbale** : synonymes, intrus, vocabulaire, proverbes, orthographe. Environ 31 questions en 8 min.
4. **Aptitude numérique** : maths niveau 3e : pourcentages, fractions, vitesse/temps, problèmes de type poules et lapins (ex : 28 têtes et 82 pattes). Environ 25 questions en 18 min. Quasi impossible de tout finir.
5. **Codage** : tableau de mots associés à des numéros, retrouver le mot du numéro demandé. Pure rapidité. Environ 45 questions en 2 min 30. Le sens (numéro → mot ou mot → numéro) doit être configurable, les descriptions varient.
6. **Attention / concentration** : comparer des suites de lettres et dire si elles sont identiques (ex : `AQWZSX` vs `AQWSZX` : non identiques). Environ 40 à 45 questions en 3 min 30.

Autres tests :
- **Anglais** : QCM de grammaire et vocabulaire niveau collège-lycée (temps, conjugaison, structure de phrase, vocabulaire de base). 100 à 150 questions selon les sources, environ 55 min. Un témoin indique 50 bonnes réponses pour valider, et ~100 recommandées pour les candidats officiers.
- **Personnalité** : questionnaire de type Big Five, 100 à 250 questions selon les témoignages, échelle de 5 réponses (pas du tout d'accord → tout à fait d'accord). Les mêmes questions sont reformulées plusieurs fois pour vérifier la cohérence. **Il n'y a pas de bonne réponse à entraîner : on ne propose qu'un MODE DÉCOUVERTE, sans score, sans conseil du type « réponds ceci pour passer ».**

Points de stratégie à intégrer dans l'appli :
- Beaucoup de questions, peu de temps : il est **impossible de tout finir** sur certaines épreuves. Mieux vaut moins de questions mais justes que tout bâcler. On affiche donc **précision ET vitesse**, et on rappelle de passer une question quand on bloque.
- Le stress peut dégrader les réponses en fin d'épreuve : prévoir un indicateur de précision dans le temps (début vs fin d'épreuve).
- Les tests sont les mêmes pour tous les niveaux (militaire du rang, sous-officier, officier), mais le **seuil à atteindre diffère selon le niveau visé**. L'appli propose un choix de niveau visé et affiche un objectif adapté. **Les seuils sont indicatifs et clairement marqués « non officiels »**, à ajuster plus tard avec des retours de candidats.
- Les tests ne sont qu'une partie du dossier (entretien, sport, PMS, anglais pèsent aussi). L'appli **ne couvre que tests psychotechniques, anglais et personnalité** : pas de simulateur d'entretien, pas de suivi sportif.

## 5. Fonctionnalités de l'appli

- Page d'accueil claire : choix de l'épreuve, du mode, du niveau visé, avec la mention de non-affiliation
- **Mode entraînement par épreuve** : sans chrono ou chrono souple, correction détaillée immédiate (explication de la règle, de la bonne réponse et du piège des distracteurs)
- **Mode examen blanc** : chrono strict paramétrable, enchaînement des épreuves, score final, précision, vitesse, comparaison à l'objectif du niveau visé
- Possibilité de **passer une question** et d'y revenir (selon la config de l'épreuve)
- **Suivi de progression local** : historique par épreuve, courbes simples, points faibles
- **Révision des erreurs** : refaire les questions ratées (via leur graine)
- **Fiches méthode** par épreuve : astuces de calcul mental, techniques pour les suites de cubes, gestion du temps. Courtes et simples.
- Bouton **« signaler une erreur »** sur chaque question (v1 : génère un lien GitHub Issues pré-rempli avec épreuve + graine, sans backend)
- Export / import de la progression en JSON
- Mode sombre/clair, accessible au clavier, lisible

## 6. Recettes de génération épreuve par épreuve

**Attention (suites de lettres)**
- Chaîne de 5 à 8 caractères. Une chance sur deux que la seconde soit identique. Sinon, perturbation : transposition de deux lettres adjacentes, substitution par une lettre visuellement proche (O/Q, E/F, M/N, P/R, I/L), doublement ou omission d'une lettre.
- Difficulté : longueur, position de la différence (au milieu c'est plus dur), proximité visuelle des lettres.
- Contrôle : une perturbation ne doit pas recréer la chaîne d'origine (cas de deux lettres identiques échangées).

**Codage**
- 10 à 12 mots courants tirés d'une liste de fréquence (500 à 1 000 mots), associés à des numéros aléatoires. En facile : éviter les paires trop proches (même initiale, même longueur, anagrammes). En difficile : les rechercher.
- Distracteurs : les autres mots du tableau, de préférence ceux dont le numéro est voisin ou la position adjacente.

**Spatial, quadrillages tournés**
- Grille booléenne N×N (souvent 5×5). La bonne réponse est une rotation de 90°, 180° ou 270°.
- Distracteurs : miroir (horizontal, vertical, transposition), miroir d'une rotation, rotation correcte avec une case inversée.
- **Contrôle d'unicité obligatoire** : calculer les 8 transformations du groupe diédral de la grille cible et rejeter toute grille où deux d'entre elles coïncident (grille symétrique).

**Spatial, cubes retournés (1 bon + 4 faux)**
- Un cube = 6 faces, chacune avec un symbole et une orientation (0/90/180/270°). 24 orientations propres. On affiche 3 faces visibles.
- Faux cubes : cube miroir (piège classique), deux faces adjacentes échangées, symbole mal orienté.
- **Vérification** : chaque distracteur ne doit correspondre à aucune des 24 orientations du cube de référence (comparaison de vues canoniques).
- Utiliser uniquement des symboles **sans symétrie** (flèche, lettre F, demi-disque décentré).

**Logique, suites de cubes**
- Grammaire de règles : rotation du cube d'un quart de tour autour d'un axe, rotation d'un symbole sur une face, cycle de symboles, déplacement d'un symbole d'une face à l'autre, combinaison de deux règles pour le niveau difficile.
- Générer 3 ou 4 cubes puis la réponse.
- **Solveur d'unicité (le plus important)** : énumérer toutes les règles de la grammaire (profondeur ≤ 2) compatibles avec la suite affichée. Si elles ne prédisent pas toutes le même cube suivant, rejeter l'item.
- Distracteurs : règle appliquée une fois de trop ou pas du tout (répétition du dernier cube), mauvais axe, bon axe mais mauvais sens, règle appliquée à une seule face, version miroir.
- Chantier le plus risqué : valider à la main un échantillon de 100 items par famille de règles.

**Numérique (niveau 3e)**
- Environ 30 à 50 **gabarits paramétrés**, chacun avec : énoncé à trous, contraintes sur les paramètres (résultats entiers ou « ronds »), fonction de calcul de la solution, fonctions de distracteurs basées sur les erreurs classiques.
- Exemples : poules et lapins (on tire d'abord p et l, puis têtes = p + l, pattes = 2p + 4l ; distracteurs : valeurs inversées, pattes/2, têtes/2) ; pourcentages successifs (+20 % puis −20 % ; distracteur : « ça s'annule ») ; vitesse/temps (distracteur : erreur de base 100 au lieu de 60) ; fractions (distracteur : addition sans dénominateur commun) ; prix après remise ; consommation de carburant par fractions successives.
- Arithmétique **exacte** (rationnels) pour éviter les erreurs de virgule flottante.

**Verbal**
- Synonymes : candidats tirés du Wiktionnaire, filtrés par fréquence. Distracteurs : mots de même catégorie grammaticale et fréquence comparable, idéalement des paronymes ou des antonymes.
- Intrus : 4 mots d'une même catégorie et 1 mot d'une catégorie voisine.
- Orthographe : partir d'un mot correct, générer des fautes par règles (consonne doublée ou simplifiée, accent, terminaisons é/er/ez), et vérifier que la forme fautive n'existe pas dans le dictionnaire.
- Proverbes : « complétez le proverbe » depuis un corpus du domaine public (recueil Cahier, 1856, sur Wikisource).
- **Relecture humaine obligatoire** de 100 % des items verbaux avant publication (la synonymie est ambiguë, une liste automatique donne souvent deux réponses acceptables). Stocker en JSON versionné.

**Anglais**
- Gabarits grammaticaux : temps, irréguliers, comparatifs, prépositions, pronoms relatifs, quantifieurs, modaux. Vocabulaire limité aux mots fréquents (NGSL).
- Piège principal : une phrase à trous où deux réponses sont acceptables. Chaque item doit contenir un marqueur qui force la réponse (since, yesterday, already…).
- Banque JSON de départ : 300 items relus.

**Personnalité (mode découverte)**
- Items de l'IPIP (International Personality Item Pool), domaine public, version française. Échelle de 5 réponses, aucun score, aucun profil. Explication simple des 5 dimensions, rappel qu'il n'y a pas de « bonne » réponse. Ne jamais présenter ce questionnaire comme une reproduction du test réel. Réponses uniquement en local.

## 7. Sources de contenu : utilisables / à éviter

Utilisables :
- IPIP (domaine public) et sa traduction française hébergée sur le site officiel ipip.ori.org
- Wiktionnaire (CC BY-SA), dumps téléchargeables
- WOLF, Wordnet libre du français (CeCILL-C), pour les intrus : à relire, il contient du bruit
- NGSL, liste de 2 809 mots anglais fréquents (CC BY-SA 4.0)
- Tatoeba, phrases anglais-français (CC BY 2.0 FR) : attribution obligatoire
- Proverbes du recueil Cahier (1856), domaine public, sur Wikisource
- Lexique 3 pour les fréquences : **usage interne uniquement** (sélection des mots), sans redistribuer les données (licences contradictoires selon les sources)
- Idées de règles et de distracteurs inspirées des générateurs de matrices type Raven (Sandia SGMT en BSD-3, Corvus en GPL-3.0, matRiks) : s'inspirer de la taxonomie de règles et d'erreurs, ne pas copier le code GPL

À éviter :
- **CRISCO / DÉS** (Université de Caen) : toute collecte automatique est interdite
- **ICAR** : réservé à l'usage académique, aucun item
- **Tout scraping** de sites de prépa ou de forums (droit d'auteur, droit sui generis des bases de données, CGU, RGPD)
- Dépôts GitHub sans fichier LICENSE : idées seulement, pas de copie de code
- Ne **jamais** demander à un LLM de « reproduire des questions » du test réel

Attributions : tenir un fichier `ATTRIBUTIONS.md` à jour (Tatoeba, WOLF, NGSL, IPIP, Wiktionnaire).

## 8. Licences et gouvernance du dépôt

- Contenu (questions, textes, images générées) : **CC BY-SA 4.0**
- Code : **MIT** (ou AGPL-3.0, à décider ensemble avant le premier commit public)
- Fichiers à créer dès le départ : `README.md`, `LICENSE`, `ATTRIBUTIONS.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` léger
- `CONTRIBUTING.md` : le contributeur atteste que son item est **original et non copié** d'une source protégée (modèle de pull request avec case à cocher, Developer Certificate of Origin)
- Confidentialité : page « Confidentialité » courte : aucune donnée collectée, tout reste dans le navigateur

## 9. Qualité

- **Tests unitaires** sur les générateurs, exécutés sur des milliers de graines à chaque build : unicité de la bonne réponse (solveur de règles, groupe diédral, 24 orientations, dictionnaire de formes), absence d'options dupliquées, résultats entiers, aucune erreur de calcul.
- Chaque item a un identifiant stable (épreuve + version du générateur + graine).
- Relecture humaine des items textuels (verbal, anglais, habillages d'énoncés de maths), avec traçabilité du relecteur et de la date dans le JSON.
- Si on utilise un LLM pour **rédiger** des items à l'avance (jamais à l'exécution) : sortie en JSON strict (énoncé, réponse, distracteurs, justification, niveau), vérification croisée (un second passage résout l'item à l'aveugle et doit retrouver la clé), recalcul par le code de tout ce qui est numérique, longueur des options homogène, puis relecture humaine. Risques connus : distracteurs peu plausibles, faux synonymes, erreurs de calcul en chaîne, proverbes déformés, plusieurs réponses valides en anglais.
- Calibrage de la difficulté : paramétrique d'abord (nombre de règles, taille de grille, longueur des chaînes), puis ajustement avec une bêta de 20 à 50 testeurs (viser environ 60 à 75 % de réussite en mode standard).
- Un entraînement sur des items générés améliore la familiarité avec les formats et la vitesse, mais ne garantit pas la correspondance exacte avec la difficulté des vraies épreuves. Le dire dans l'appli.

## 10. Plan de construction (ordre à respecter)

1. **Socle** : dépôt, licences, mention de non-affiliation, PRNG à graine, schéma JSON d'item, moteur de passation chronométrée paramétrable (config par épreuve), sauvegarde locale, export/import, lien de signalement d'erreur, déploiement Vercel
2. **Attention + codage** (100 % code, les plus rapides, un premier test jouable)
3. **Quadrillages tournés + numérique** (contrôle diédral + 30 gabarits de maths)
4. **Cubes** : d'abord les cubes retournés, puis les suites logiques avec solveur d'unicité
5. **Verbal + anglais** : pipeline de relecture, banque JSON (300 items verbaux et 300 d'anglais relus au départ), proverbes du recueil Cahier
6. **Personnalité** en mode découverte (IPIP, local uniquement, sans score)
7. **Examen blanc complet**, niveaux visés avec objectifs indicatifs, stats, révision des erreurs, fiches méthode
8. **Bêta** (20 à 50 testeurs : forums, amis, anciens candidats), analyse des taux de réussite, des distracteurs et des temps, ajustement des chronos
9. **Ouverture publique** et appel à contributions (nouvelles règles de cubes, items relus)

## 11. Comment je veux que tu travailles

- **Commence par me poser les questions bloquantes** s'il y en a (peu, ciblées), puis démarre l'étape 1.
- Avance **étape par étape**, en petits commits clairs, et montre-moi un résultat jouable à la fin de chaque étape avant de passer à la suivante.
- Avant tout choix structurant (licence du code, librairie, architecture d'un générateur), **propose-moi 2 options avec ta recommandation** et attends mon avis.
- Ne copie aucun contenu protégé et ne scrape rien. Si une source te semble douteuse, **dis-le avant de l'utiliser**.
- Ne rajoute aucune dépendance payante, aucun service externe, aucun backend sans mon accord explicite.
- Si une info sur le format des épreuves te manque ou est contradictoire, **mets-la en configuration** et note-la dans un fichier `TODO-FORMATS.md` pour que je la valide auprès de candidats.
- Code propre, typé, commenté en français pour les parties métier. Tout nouveau générateur arrive avec ses tests.
- Mets-moi à jour dans le `README.md` : comment lancer en local, comment déployer sur Vercel, comment contribuer.

## 12. Première tâche

Réaliser l'**étape 1 (socle)** puis l'**étape 2 (attention + codage)**, avec :
- le menu d'accueil et la mention de non-affiliation
- le choix de l'épreuve, du mode (entraînement ou examen blanc) et du niveau visé
- le chrono paramétrable, le score, la précision et la vitesse
- la sauvegarde locale de la progression
- les tests unitaires des deux générateurs
- le déploiement sur Vercel (je te dirai ce dont j'ai besoin de mon côté)

Montre-moi le résultat, puis on enchaîne avec l'étape 3.
