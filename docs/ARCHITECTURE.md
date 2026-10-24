# Architecture du code

Ce document dit **où ranger quoi** et **dans quel sens les dossiers se parlent**. Les règles de dépendance sont vérifiées par `tests/architecture.test.ts` : si un fichier importe dans le mauvais sens, `npm test` échoue.

## Les couches

```
src/app/        routes (Expo Router)            ← n'importe que des fonctionnalités
src/features/   le métier, une fonctionnalité par dossier
src/shared/     la base : composants, styles, stockage, textes, constantes, utilitaires
src/bureau/     adaptation Windows (Electron) : remplace les modules natifs, menus du poste
```

Une couche n'importe que celles **du dessous** : `app` → `features` → `shared`.

- `shared` n'importe **aucune fonctionnalité** (seule exception : les *types* du catalogue de stockage, `shared/storage/types.ts` et `csv.ts`, par `import type`).
- Une fonctionnalité n'importe jamais `app`.
- `src/app/` ne contient que des routes : chaque fichier est un `export { default } from '@/features/<fonction>/screens/<Ecran>'`, plus les `_layout.tsx` (navigateurs).

## Dans une fonctionnalité

```
features/<fonction>/
  screens/      les écrans (un écran = une route, ou une fiche)
  components/   les morceaux d'écran réutilisables dans la fonctionnalité
  hooks/        l'état et les actions d'un écran (lecture, enregistrement, autosave)
  services/     les règles métier et les calculs : fonctions pures, sans écran (c'est ici qu'on teste)
  repository/   l'accès au stockage (ou repository.ts quand il est petit)
  utils/        petits outils sans règle métier
  types.ts      les types de la fonctionnalité
```

Le sens est toujours **écran → hook → service → repository**. Un service ne connaît pas React ; un repository ne connaît pas les règles.

## Les fonctionnalités

| Dossier | Contenu |
|---|---|
| `cheptel` | les animaux : fiches, naissances, mouvements, bilan annuel, registre |
| `lots-animaux` | les lots d'animaux (reproduction, avortements, renouvellement), **bons de livraison** à l'abattoir, **enlèvements** d'équarrissage, **ventes d'animaux vivants** |
| `sante` | traitements et délais d'attente, visites vétérinaires, rapports d'essais, documents du GDS, carnet sanitaire |
| `exploitation` | la ferme : terrains, contrôles (laitier, ASP), alimentation, flotte, partenaires et groupements, analyses de lait |
| `comptabilite` | écritures (ventes, factures), TVA, trésorerie, rentabilité, fiscalité, plan d'économies, documents de circulation |
| `stock` | fromagerie et charcuterie : articles, lots de fabrication, mouvements, boucles |
| `production` | les pages de l'onglet Production (fabrication, viande vendue, lieux : abattoir, équarrissage, associations) |
| `commercial` | commandes, circuits de vente, agritourisme et accueil du public |
| `contacts`, `clients`, `fournisseurs` | les contacts (fiche commune) et leurs deux familles |
| `dossiers` | les dossiers rattachés à un contact (les anciennes activités secrétariat, gîte, bar et trading ont été retirées : l'application ne gère plus que des exploitations) |
| `accueil` | l'accueil « ferme » et la **coque de l'application** (`accueil/shell` : menus, en-tête, barre du bas) |
| `rappels`, `a-traiter` | les rappels de l'accueil et ce qui reste à traiter par établissement |
| `etablissements`, `especes` | les établissements (données séparées) et les espèces élevées |
| `settings` | les réglages, rangés dans `settings.exploitation` (lots, enlèvements, ventes d'animaux vivants, GDS…) |
| `drive`, `sauvegarde`, `export`, `fichiers`, `bibliotheque` | Google Drive (fusion à 3 voies), sauvegarde locale, PDF et Excel (`export/documents`), pièces jointes, bibliothèque de documents |
| `didacticiel` | la visite guidée |

## Où est stockée une donnée

- **Par année et par catégorie** (cheptel, ventes, factures, visites, traitements, contrôles) : `shared/storage/localStore.ts`, une clé par établissement (`shared/storage/etablissementActif.ts`).
- **Dans les réglages** (`settings.exploitation`) : tout ce qui est peu nombreux et sans année — lots, enlèvements, ventes d'animaux vivants, documents du GDS, cadre réglementaire…
- Les **pièces jointes** (scans, PDF) sont des fichiers sur l'appareil, référencés par une `PieceJointe`.

### Ajouter une donnée stockée : la liste de contrôle

1. Le type, dans `settings.ts` (réglages) ou dans le `types.ts` de la fonctionnalité.
2. **Sauvegarde et Drive** : les réglages sont repris en entier, et la fusion Drive additionne les listes **par identifiant** (`id`) ; ne pas oublier d'avoir un `id`.
3. **Pièces jointes** : si l'objet porte un fichier, l'ajouter dans `fichiers/services/inventaire.ts` (`toutesLesPieces`), sinon il ne sera ni sauvegardé ni envoyé sur Drive. Le test `tests/piecesSauvegardees.test.ts` montre comment.
4. **CSV** : une catégorie stockée par année a ses colonnes dans `shared/storage/csv.ts` ; `tests/csvColonnes.test.ts` échoue si un champ n'a pas de colonne.
5. **Migration** quand un format change : une fonction pure dans le `services/` de la fonctionnalité (ex. `ventesVivantesDepuisLesLots`, `enlevementsDepuisLesLots`), lancée **une fois par séance** dans `lots-animaux/hooks/useLots.ts`, avec son test. Elle doit être **idempotente** (la relancer ne change rien).

## Les écritures et les départs d'animaux

Un départ d'animaux porte son **document de circulation avant toute écriture**. Il y a deux sortes :

- le **bon de livraison** (animaux livrés à l'abattoir) : un `LotAnimaux` avec `abattoir` (date) et `depart: true` ;
- la **vente d'animaux vivants** : un enregistrement à part, `VenteDAnimauxVivants` (`settings.exploitation.ventesVivants`).

La facture (dépense de l'abattoir ou vente au détenteur d'arrivée) porte l'identifiant du départ dans son `lotId`. Les documents à déposer sont réunis par `comptabilite/services/documentsCirculation.ts` (types d'écriture `vente`, `facture`, `lot`, `vivants`).

## Textes, constantes, couleurs

- Tout texte affiché : `shared/textes/` (`TEXTES.<domaine>.<écran>.<clé>`).
- Toute valeur énumérée ou tout seuil : `shared/constants/`.
- Toute couleur : `shared/theme/colors.ts`. Tout style partagé : `shared/styles/`.
- Aucun texte, nombre de règle ou couleur en dur dans un écran ou un service.

## Tests

`npm test` lance Vitest (`tests/`). Les règles métier sont testées sur les **services** (fonctions pures) ; les écrans ne le sont pas. Deux tests gardent la structure : `architecture.test.ts` (sens des imports) et `csvColonnes.test.ts` (aucun champ sans colonne).

## Avant de livrer

```bash
npx tsc --noEmit        # types
npx eslint src tests    # 0 erreur (les avertissements existants sont connus)
npm test                # Vitest
```

Puis monter le numéro de version (`package.json`), commiter, et construire l'installateur Windows (`npm run bureau:installateur`, dans le dépôt miroir `chevre_pc`).

## Déplacer des fichiers

Un déplacement d'une fonctionnalité à l'autre se fait avec `git mv` et se vérifie avec `npx tsc --noEmit` : tous les imports passent par l'alias `@/`, une erreur de chemin est donc toujours détectée à la compilation.
