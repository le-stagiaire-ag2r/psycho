# Journal de relecture des questions

Ce fichier trace ce qui a été vérifié sur les questions, ce qui a été corrigé, et ce qu'un **relecteur humain**
doit encore trancher. Il ne remplace pas la relecture humaine exigée par le brief : le champ `relecture` des items
JSON reste à `null` tant qu'un humain ne les a pas validés.

## Relecture assistée par IA (octobre 2026)

Tout le contenu a été relu question par question, en cherchant : deux réponses défendables, énoncé ambigu,
faute de langue, explication fausse, distracteur absurde, règle impossible à déduire.

### Ce qui a été vérifié
- **Verbal (159 items)** et **anglais (158 items)** : chaque énoncé, chaque proposition, chaque explication.
- **Personnalité (50 affirmations)** : formulation et contresens possibles.
- **Numérique (45 gabarits)** : 2 exemples par gabarit relus à la main (énoncé, réponse, pièges, explication), mathématiques recoupées.
- **Raisonnement général, cubes, grilles, attention, codage** : explications générées relues sur des échantillons de chaque difficulté.
- **Liste de mots du codage** (215 mots).

### Défauts trouvés et corrigés
| Zone | Défaut | Correction |
| --- | --- | --- |
| Suites de cubes | Règle « symbole suivant dans une série » impossible à déduire (la série n'est jamais affichée) : le solveur la jugeait « unique » parce qu'il connaissait l'ordre caché | Règles retirées de la grammaire (19 règles élémentaires, toutes déductibles de l'écran) |
| Anglais | « He cooked dinner when the phone rang » et « While I watched TV… » : deux réponses défendables | Réécrits avec un marqueur de temps précis (« Yesterday at 7 pm… », « At nine o'clock last night… ») |
| Anglais | « a very hot weather » (weather est indénombrable) | « a very hot day » |
| Anglais | « scissors » parmi des propositions avec article | « a pair of scissors » |
| Anglais | espace avant le point (« ___ . ») | supprimée |
| Verbal | « véridique → exact » approximatif | « sincère » |
| Verbal | « un échec → un revers » peu courant | « échec → fiasco » ; synonymes posés sans article |
| Verbal | « que j'aie jamais vue » : l'indicatif est toléré par certains grammairiens | remplacé par « Je veux que tu … avec moi » → viennes |
| Verbal | explications de proverbes avec espace parasite (« rien d' impossible ») | corrigées |
| Verbal | analogies avec élision bancale (« ce que oie est à… ») | formulation « comme » |
| Personnalité | « Je suis un emploi du temps » (être / suivre) | « Je respecte un emploi du temps » |
| Numérique | « 25 % des livres portent des lunettes » | sujets humains uniquement |
| Numérique | « 15 pièces de 2 € et billets de 5 € » ambigu (15 de chaque ?) | « 15 éléments : des pièces de 2 € et des billets de 5 € » |
| Numérique | « 1 jours », « 7/4 » ou « 3 » comme probabilité, « 199,9 € » comme faux prix | accord singulier/pluriel ; fractions bornées à 1 ; pas de dixièmes quand la réponse est entière |
| Numérique | explication des horaires fausse (« de 10 h 40 à 14 h 00 : 20 min ») | explication recalculée et testée |
| Numérique | étiquettes de pièges absurdes (« proche, mais faux », « symétrie approximative », « calcul approximatif ») | supprimées |
| Numérique | vitesse à 60 km/h : la réponse égale la distance | 60 km/h exclu |
| Numérique | grands nombres sans séparateur (« 22400 ») | espace fine des milliers |
| Raisonnement | « plus rapide que Adam » | « qu'Adam » |
| Raisonnement | « On avance de -2 » | « On recule de 2 rangs » |

Ces corrections sont verrouillées par des tests (`src/qualite.test.ts` et tests des générateurs).

## Passe 2 : vérification logique indépendante (octobre 2026)

Objectif : ne plus se fier aux générateurs eux-mêmes, mais **recalculer chaque réponse à partir de ce que le candidat voit**.

### Vérifications automatiques (dans `npm test`)
| Épreuve | Méthode indépendante | Volume |
| --- | --- | --- |
| Numérique | Pour chacun des 45 gabarits, on lit l'énoncé AFFICHÉ, on en extrait les nombres, on recalcule la réponse avec un solveur écrit à part (force brute quand c'est possible) et on exige que la bonne proposition soit la SEULE égale au résultat | 45 × 400 graines |
| Suites de nombres | Énumération « en avant » de milliers de règles plausibles (arithmétiques, géométriques, carrés, cubes, triangulaires, écarts évolutifs, affines, Fibonacci, entrelacées) : toutes celles compatibles avec les termes affichés doivent prédire la réponse | 750 suites |
| Suites de lettres et de mots | Même principe, modulo 26 / listes circulaires, tous pas et tous sens | 750 suites + 750 suites |
| Comparaisons | Lecture des phrases affichées, énumération de tous les classements, un seul doit rester | 750 énoncés |
| Codage | La consigne affichée est relue dans le tableau affiché | 3 × 2 × 600 |
| Attention | Distance d'édition entre les deux suites affichées (une perturbation = 1 opération) | 3 × 3 000 |
| Grilles | Rotation recalculée en coordonnées depuis la consigne (« 270° anti-horaire »…) | 3 × 1 000 |
| Cubes | (a) aucune des 3 faces n'est dessinée en miroir et ce sont bien les faces tournées vers l'observateur ; (b) la règle « tiers de tour du cube » (états visibles) est recoupée avec la vraie rotation 3D des 6 faces ; (c) le modèle « deux vues » montre exactement les 6 faces | 400 cubes × 24 rotations |
| Tous | Tests « golden » : si un générateur change sans que sa `VERSION_…` soit incrémentée, un test échoue (les identifiants d'items restent stables) | 6 générateurs |

Ces vérifications n'ont trouvé **aucune erreur de calcul ni de logique** dans les générateurs. Leur seule alerte (« 2, 4, 8, 16 → 14 ») venait d'un artefact du test (deux suites entrelacées ajustent n'importe quoi à 4 termes) : le test a été corrigé sur le principe « une règle ne compte que si elle est confirmée par une redondance », le générateur appliquait déjà ce principe.

### Vérification dans un navigateur réel (horloge simulée)
Chrono strict d'examen (3:30 → coupure automatique, durée plafonnée, seules les réponses données comptées), absence/présence du bouton « Passer » selon la config, enchaînement automatique de l'épreuve 1 à l'épreuve 2 avec chrono remis à 7:00, enregistrement unique dans l'historique.

### Relecture item par item des 158 questions d'anglais
Chaque phrase a été reconstituée avec chacune de ses 4 propositions pour juger si les mauvaises réponses sont vraiment fausses. Corrigés (mauvaise réponse défendable) :
- « You like football, do you? » (tag positif-positif valide) ; « Might you help me » (grammatical, très formel) ; « I play some guitar » (courant) ; « She is going to school every day » ; « There is a lot of people » (usage oral) ; « the day where we met » (usage oral) ; « arrived at Paris » ; « He has gone to Paris twice » ; « I call you tomorrow » ; « You can see a doctor » (valable comme suggestion) ; « She should be at home » (valable comme attente) ; « look for my cat » ; « the engineer / some engineer » ; « I will wait here by the… ».
- Indices involontaires : « a electrician », « a shorts » (l'article trahissait la réponse) → test automatique ajouté.

Les 159 questions de verbal ont subi le même contrôle (chaque proposition testée) sans nouvelle correction.

### Passe 3 : critère strict sur les mauvaises réponses d'anglais
Règle appliquée à chacune des 158 questions (4 propositions = 1 bonne + 3 fausses) : **chaque mauvaise réponse doit être impossible pour un anglophone**, soit parce que la forme n'existe pas (« she go », « more tall », « I do the guitar »), soit parce qu'un marqueur explicite la contredit (« yesterday », « right now », « since 2010 », « by the president »). Une réponse « grammaticale mais à un autre sens » est remplacée, ou l'énoncé est renforcé par un marqueur sans appel (« right now », « without umbrellas »).

17 questions supplémentaires ont été retouchées dans ce sens (ex. : « Look! The children ___ right now », « He was tired, ___ he went to bed » sans « but » plausible, plus de « good in maths », « arrived in the airport », « Neither… or »).

Limite : aucun outil ne peut prouver qu'une phrase est impossible en anglais. Ce critère a été appliqué à la main, et seul un anglophone peut le confirmer.

### Points que je juge encore discutables (à trancher par un humain)
Aucun n'est faux à mon avis, mais un relecteur pourrait légitimement hésiter :

- **VER-SYN-015** « ancien → antique » : « vieux » serait plus courant ; « antique » est plus fort.
- **VER-SYN-028** « perplexe → indécis » : proche, mais « hésitant » serait plus exact.
- **VER-SYN-029** « mitiger → atténuer » : mot rare (niveau 3).
- **VER-INT-016** « portrait » intrus parmi porteur / portable / transporter / support : « support » (de « supporter ») est dans la famille de « porter », mais ce n'est pas évident.
- **VER-GRA-003** « Elle s'est coupé la main » : invariable car le COD suit ; beaucoup de candidats écriraient « coupée ».
- **VER-CON-012** « abondance → pénurie » avec « richesse » parmi les faux : « richesse » n'est pas un synonyme d'abondance au sens strict.
- **ANG-GRA-028** « He has been to Paris twice » : « gone » est faux ici mais certains l'accepteraient.
- **ANG-GRA-070** « arrived in Paris » : « at Paris » est parfois toléré.
- **ANG-GRA-110** « You won't pass unless… » : « if » est grammatical mais contredit le sens.
- **ANG-GRA-123** « fill in this form » : « fill out » (non proposé) est aussi correct, surtout en anglais américain.
- **Numérique / vitesse moyenne aller-retour** : énoncé de niveau « difficile » classique, mais peut surprendre.

### Limites de cette relecture
- Elle a été faite par la même IA que celle qui a rédigé les questions : un second regard **humain** reste nécessaire.
- Le brief recommande une vérification croisée à l'aveugle (une autre passe qui résout les questions sans voir la clé) : elle n'a pas été faite.
- Les formats des épreuves eux-mêmes (nombre de questions, durées, types) restent à valider auprès de candidats (voir `TODO-FORMATS.md`).

## Passe 4 : chaque question est expliquée (octobre 2026)

Objectif : apprendre de ses erreurs. Après chaque réponse (entraînement, bilan d'examen, révision), l'appli affiche :
1. **pourquoi ta réponse est fausse** (propre à la proposition choisie) ;
2. **pourquoi la bonne réponse est juste** ;
3. **« À retenir »** : la règle ou le sens du mot ;
4. **toutes les propositions** (✓ / ✗) avec une raison pour chacune.

| Épreuve | Contenu des explications |
| --- | --- |
| Attention | la différence exacte entre les deux suites (lettres inversées, substituée, doublée, omise) |
| Codage | à quel numéro / mot est réellement associée chaque proposition |
| Quadrillages | quelle transformation (autre rotation, miroir, case inversée) représente chaque grille |
| Cubes | défaut précis de chaque faux cube (miroir, face échangée, symbole tourné ou inversé, symbole caché) |
| Suites de cubes | règle de la suite + nature de l'erreur de chaque faux cube |
| Numérique | calcul détaillé + erreur classique derrière chaque mauvaise valeur |
| Raisonnement | règle + erreur de chaque mauvaise suite / classement |
| Verbal | sens du mot concerné pour chaque proposition, groupe de l'intrus, sens du proverbe, écart de graphie, règle de grammaire |
| Anglais | phrase complète avec la proposition, règle enfreinte, sens français des mots de vocabulaire |

Les empreintes « golden » ne portent plus que sur la question (énoncé, propositions, bonne réponse) : améliorer une explication ne change donc pas l'identifiant d'une question. Le test `src/documentation.test.ts` exige une explication non vide pour chaque proposition de chaque question générée.

Le questionnaire de personnalité n'a volontairement ni bonne réponse ni explication.

## Passe 5 : test à l'aveugle puis relecture complète (octobre 2026)

**Test à l'aveugle** : 4 correcteurs indépendants (des sous-agents IA qui n'avaient accès qu'à un fichier contenant les énoncés et les propositions mélangées, sans la clé ni les explications) ont résolu les 159 questions de verbal et les 158 d'anglais.

Résultat : **316 réponses sur 317** identiques à la clé. Seul écart : ANG-GRA-082 (« You ___ to see a doctor » : le correcteur a répondu « should », ce qu'un candidat pouvait faire aussi). Questions signalées comme fragiles et corrigées :

| Question | Problème signalé | Correction |
| --- | --- | --- |
| ANG-GRA-082 | « should » / « ought » défendables à cause du « to » | phrase sans « to » : should (propositions : ought, have, need, toutes impossibles sans « to ») |
| ANG-GRA-057 | « which » pour une personne, courant à l'oral | remplacé par « where » |
| VER-SYN-010 | fréquent → habituel (nuance) | fréquent → courant |
| VER-SYN-015 | ancien → antique (plus fort) | ancien → vieux |
| VER-SYN-019 | véridique → sincère (proche, pas identique) | véridique → vrai |
| VER-INT-011 | « Danemark » : seul mot à majuscule, indice trop visible | intrus « grammaire » |
| VER-INT-016 | « portrait » : étymologie trop pointue | intrus « portail » (famille de « porte ») |

**Relecture complète, avec la clé et les explications sous les yeux** (317 questions, ~950 explications). Corrections supplémentaires :
- Anglais : un second sens possible retiré dans « What time did the film start tonight? » (→ « tomorrow evening »), « The meeting is by Monday », « I get up by 7 o'clock », « Must you help me, please? », « Hardly did he arrive… », « You like football, didn't you? », « I'm looking after my keys », « The train was empty / fast », « so hard-working that he forgot his birthday », « company was famous… », « He lay », « speak slower… ». Pour la ceinture de sécurité : ajout de « and it is not optional ».
- Verbal : explications d'orthographe réécrites à la main (le calcul automatique des différences donnait parfois des phrases absurdes comme « h en trop, il manque h »), proverbes sans répétition du sens sur chaque mauvaise réponse, « victoire » signalé comme contraire d'« échec ».
- Raisonnement : un distracteur qui est le dernier terme affiché est expliqué comme « règle non appliquée ».

**Limites qui demeurent** : les correcteurs « à l'aveugle » sont des IA de la même famille que l'auteur : ils partagent probablement certains angles morts. Pour les questions dont la mauvaise réponse n'est pas *grammaticalement impossible* mais *incohérente avec le contexte* (conjonctions, vocabulaire avec indice, modaux), l'unicité repose sur le sens de la phrase. Seul un relecteur humain, idéalement anglophone pour l'anglais, peut le garantir.

## Comment relire à votre tour
1. Ouvrez `src/data/verbal.json` ou `src/data/anglais.json`.
2. Pour chaque item, vérifiez qu'**une seule** proposition est juste.
3. Si c'est le cas, remplacez `"relecture": null` par `"relecture": {"par": "votre pseudo", "date": "AAAA-MM-JJ"}`.
4. Pour n'afficher que les questions relues, mettez `seulementRelus: 1` dans `src/config/epreuves.ts`.
5. Si une question est fautive, ouvrez une issue avec le bouton « Signaler une erreur » (il pré-remplit l'identifiant et la graine).
