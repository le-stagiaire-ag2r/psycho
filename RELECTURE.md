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
- **Numérique (44 gabarits)** : 2 exemples par gabarit relus à la main (énoncé, réponse, pièges, explication), mathématiques recoupées.
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

## Comment relire à votre tour
1. Ouvrez `src/data/verbal.json` ou `src/data/anglais.json`.
2. Pour chaque item, vérifiez qu'**une seule** proposition est juste.
3. Si c'est le cas, remplacez `"relecture": null` par `"relecture": {"par": "votre pseudo", "date": "AAAA-MM-JJ"}`.
4. Pour n'afficher que les questions relues, mettez `seulementRelus: 1` dans `src/config/epreuves.ts`.
5. Si une question est fautive, ouvrez une issue avec le bouton « Signaler une erreur » (il pré-remplit l'identifiant et la graine).
