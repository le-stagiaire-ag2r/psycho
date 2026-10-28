# Attributions

Ce fichier liste les sources externes utilisées dans le projet. Il doit être tenu à jour
à chaque ajout de contenu externe.

## Contenus actuellement dans le dépôt

- **Attention, codage, quadrillages, cubes, suites logiques, numérique, raisonnement général** : générés par du code, aucune source externe. Les types de questions du raisonnement général (suites de nombres, de lettres, logique de comparaison) s'inspirent de types d'exercices courants ; aucune question n'a été copiée.
  La liste de mots du codage (`src/data/mots.ts`) a été rédigée à la main pour ce projet.
- **Verbal et anglais** (`src/data/verbal.json`, `src/data/anglais.json`) : items rédigés pour ce projet, avec l'aide
  d'une IA, **à l'avance** (jamais à l'exécution) ; aucun contenu copié d'un test réel ni d'un site de préparation.
  Les proverbes sont des proverbes traditionnels du domaine public. Statut de relecture : voir le champ `relecture` de chaque item.
- **Personnalité** (`src/data/personnalite.json`) : 250 affirmations (50 par dimension), toutes tirées de la liste des
  3 320 items de l'IPIP (International Personality Item Pool, domaine public, <https://ipip.ori.org>). Chacune porte le
  code de l'item d'origine dans son champ `source` (par exemple `IPIP H1131`). Les items ont été sélectionnés à la main
  dans la liste, traduits ou repris de la traduction automatique de la page, puis reformulés à la première personne.
  Le rattachement à une dimension (extraversion, agréabilité, conscience, stabilité émotionnelle, ouverture) est fait
  d'après le sens de l'item : ce n'est pas la clé de cotation officielle de l'IPIP et rien n'a été validé
  psychométriquement. Le tout n'est utilisé qu'en mode découverte, sans score.

## Sources envisagées (pas encore utilisées)

| Source | Usage prévu | Licence |
| --- | --- | --- |
| Wiktionnaire | Synonymes, vocabulaire (extension des banques) | CC BY-SA |
| WOLF (Wordnet libre du français) | Intrus | CeCILL-C |
| NGSL | Vocabulaire anglais fréquent | CC BY-SA 4.0 |
| Tatoeba | Phrases anglais-français | CC BY 2.0 FR (attribution obligatoire) |
| Recueil Cahier (1856), Wikisource | Proverbes | Domaine public |

Lexique 3 : usage interne uniquement (sélection de mots), aucune donnée redistribuée.
