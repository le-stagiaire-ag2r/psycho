# Contribuer

Merci de vouloir aider ! Ce projet est gratuit, sans pub et non lucratif.

## Règle d'or : contenu original

Toute question, tout item et tout texte doit être **original**. Il est interdit de :

- copier de vraies questions d'un concours ou d'un test officiel ;
- copier des contenus de sites de préparation (payants ou non) ou de forums ;
- scraper ces sites ;
- demander à une IA de « reproduire » des questions du vrai test.

Si tu as un doute sur une source, dis-le avant de l'utiliser.

## Certificat d'origine (DCO)

En contribuant, tu certifies que :

1. tu es l'auteur de ta contribution, ou tu as le droit de la publier sous les licences du projet ;
2. elle n'est pas copiée d'une source protégée ;
3. tu acceptes qu'elle soit publiée sous MIT (code) et CC BY-SA 4.0 (contenus).

La case correspondante est à cocher dans le modèle de pull request.

## Comment contribuer

- **Signaler une erreur** dans une question : bouton « Signaler une erreur » dans l'appli (il pré-remplit
  une issue avec l'épreuve et la graine).
- **Valider un format** grâce à ton expérience de candidat : voir `TODO-FORMATS.md`.
- **Code** : `npm install`, `npm run dev`, puis `npm test` et `npm run build` avant ta PR.
  Tout nouveau générateur arrive avec ses tests (unicité de la bonne réponse, options sans doublon,
  exécutés sur des milliers de graines).
- Le code métier est commenté en français.
