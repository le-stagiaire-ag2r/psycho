# Psycho : entraînement gratuit aux tests de sélection

Appli web **100 % gratuite, sans compte, sans pub, non lucrative** pour s'entraîner aux tests
psychotechniques de sélection (armée de Terre), avec une banque de questions **originale et illimitée**.

> Application indépendante, non affiliée au ministère des Armées ni à l'armée de Terre.
> Les formats sont reconstitués à partir d'informations publiques et peuvent différer des épreuves réelles.

Le brief complet du projet est dans [`CLAUDE.md`](CLAUDE.md).

## État d'avancement

| Étape | Contenu | État |
| --- | --- | --- |
| 1 | Socle : PRNG à graine, schéma d'item, moteur chronométré, sauvegarde locale, export/import, signalement d'erreur | fait |
| 2 | Attention, codage | fait |
| 3 | Quadrillages tournés (contrôle des 8 symétries), numérique (44 gabarits, arithmétique exacte) | fait |
| 4 | Cubes à plier / retournés (24 orientations), suites logiques (solveur d'unicité) | fait |
| 5 | Verbal (159 items) et anglais (158 items), banques JSON avec champ de relecture | fait, **relecture humaine à faire** |
| 6 | Personnalité en mode découverte (sans score, rien d'enregistré) | fait |
| 7 | Examen blanc enchaîné, révision des erreurs, fiches méthode, statistiques | fait |
| 8 | Bêta (20 à 50 testeurs), ajustement des chronos et de la difficulté | à faire |
| 9 | Ouverture publique et appel à contributions | à faire |

## Ce que fait l'appli

- 9 épreuves : logique, spatial, verbal, numérique, codage, attention, anglais, personnalité (découverte) et **raisonnement général** (épreuve complémentaire : suites de nombres, de lettres et de mots, logique de comparaison ; proposée en option dans l'examen blanc).
- Mode **entraînement** (chrono souple, correction détaillée) et **examen blanc** (chrono strict, enchaînement des épreuves).
- **Révision des erreurs** : les questions ratées sont régénérées à l'identique à partir de leur graine.
- **Fiches méthode**, objectifs indicatifs par niveau visé (non officiels), progression locale, export/import JSON.
- Aucune donnée collectée : tout reste dans le navigateur (un test vérifie l'absence d'appel réseau dans le code).

## Lancer en local

Prérequis : Node.js 20 ou plus.

```bash
npm install
npm run dev        # serveur de développement
npm test           # tests unitaires (Vitest), générateurs testés sur des milliers de graines
npm run build      # vérification des types + build de production dans dist/
npm run preview    # prévisualiser le build
```

## Déployer sur Vercel (gratuit)

1. Pousser le dépôt sur GitHub.
2. Sur [vercel.com](https://vercel.com), plan **Hobby** (usage non commercial), « Add New Project » puis importer le dépôt.
3. Vercel détecte Vite (`vercel.json` fourni : framework Vite + réécriture vers `index.html`). Laisser les réglages par défaut.
4. Chaque push déclenche un déploiement automatique. L'adresse est en `.vercel.app` (aucun domaine payant).

Aucune variable d'environnement n'est nécessaire.

## Architecture

- `src/lib/prng.ts` : PRNG à graine. Même graine, même question.
- `src/lib/types.ts` : un **item = générateur + version + graine + difficulté** (`ItemRef`), sérialisable en JSON.
  Identifiant stable : `épreuve-vVERSION-dDIFF-sGRAINE`.
- `src/generateurs/` : un fichier par épreuve + `index.ts` (registre). Un nouveau générateur arrive avec ses tests.
  Les épreuves générées par code : attention, codage, grille/cube/suiteCubes (spatial, logique), numérique, raisonnement général (`raisonnement/`, chaque famille a son solveur d'unicité).
  Les épreuves à banque JSON (`src/data/verbal.json`, `anglais.json`) passent par `banque.ts`.
- `src/config/epreuves.ts` : **formats paramétrables** (questions, durée, choix, sens du codage…). Rien n'est figé dans le code.
- `src/config/niveaux.ts` : objectifs indicatifs par niveau visé (non officiels).
- `src/lib/session.ts` : moteur de passation (fonctions pures, temps injecté), `scoring.ts` : bilan.
- `src/lib/storage.ts` : localStorage protégé par try/catch, export/import JSON validé.
- `src/pages/` : accueil, séance (réutilisée par l'examen enchaîné et la révision), examen, révision, méthode, progression, personnalité.

### Ajouter ou corriger des questions

- **Banques JSON** : ajoute un objet dans `src/data/verbal.json` ou `anglais.json` (`bonne`, au moins 3 `fausses`, `explication`, `niveau` 1 à 3, `relecture: null`). Les tests vérifient le schéma et l'absence de doublon.
- **Relecture** : une fois un item relu par un humain, renseigne `"relecture": {"par": "pseudo", "date": "AAAA-MM-JJ"}`. Avec `seulementRelus: 1` dans `src/config/epreuves.ts`, l'appli ne propose plus que ces items.
- **Chaque item anglais** doit contenir un marqueur qui impose une seule réponse (since, yesterday, already…).

Si l'algorithme d'un générateur change, incrémenter sa `VERSION_*` : les anciennes graines ne redonnent
plus la même question.

## Contribuer

Voir [`CONTRIBUTING.md`](CONTRIBUTING.md). Contenu 100 % original : aucune copie de vraies questions ni de sites de prépa.
Formats à valider : [`TODO-FORMATS.md`](TODO-FORMATS.md).

## Licences

Code : MIT (`LICENSE`). Contenus : CC BY-SA 4.0 (`LICENSE-CONTENU.md`). Sources externes : `ATTRIBUTIONS.md`.
