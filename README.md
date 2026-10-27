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
| 2 | Épreuves **attention** et **codage** | fait |
| 3 | Quadrillages tournés + numérique | à venir |
| 4 | Cubes (retournés, puis suites logiques) | à venir |
| 5 | Verbal + anglais | à venir |
| 6 | Personnalité (mode découverte) | à venir |
| 7 | Examen blanc enchaîné, révision des erreurs, fiches méthode | à venir |

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
- `src/config/epreuves.ts` : **formats paramétrables** (questions, durée, choix, sens du codage…). Rien n'est figé dans le code.
- `src/config/niveaux.ts` : objectifs indicatifs par niveau visé (non officiels).
- `src/lib/session.ts` : moteur de passation (fonctions pures, temps injecté), `scoring.ts` : bilan.
- `src/lib/storage.ts` : localStorage protégé par try/catch, export/import JSON validé.

Si l'algorithme d'un générateur change, incrémenter sa `VERSION_*` : les anciennes graines ne redonnent
plus la même question.

## Contribuer

Voir [`CONTRIBUTING.md`](CONTRIBUTING.md). Contenu 100 % original : aucune copie de vraies questions ni de sites de prépa.
Formats à valider : [`TODO-FORMATS.md`](TODO-FORMATS.md).

## Licences

Code : MIT (`LICENSE`). Contenus : CC BY-SA 4.0 (`LICENSE-CONTENU.md`). Sources externes : `ATTRIBUTIONS.md`.
