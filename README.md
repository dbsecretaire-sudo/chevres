# Troupeau Chèvres

Application de gestion d'une exploitation d'élevage : cheptel, naissances et mouvements, production fromagère (lots), stock, ventes, comptabilité, santé, documents PAC et administratifs, contacts et rappels.

Une seule base de code (Expo / React Native, TypeScript) produit **quatre versions** :

| Version | Où elle tourne | Code qui la distingue | Fabrication |
|---|---|---|---|
| **Android** (téléphone) | Téléphone Android | le code Expo d'origine ; le stockage garde les données en mémoire (`src/shared/stockage-en-memoire/`) | EAS (`eas.json`) ou `npx expo run:android` |
| **PWA** (web) | Navigateur, téléphone ou ordinateur | fichiers `*.web.ts(x)` et le réglage `Platform.OS === 'web'` | `npx expo export --platform web --output-dir dist-pwa` puis mise en ligne |
| **Windows** (bureau, Electron) | Fenêtre Windows | `bureau/` (la fenêtre) et `src/bureau/` (les modules de l'ordinateur) ; `EXPO_PUBLIC_BUREAU=1` | `npm run bureau:installateur` (voir [bureau/LISEZMOI.md](bureau/LISEZMOI.md)) |
| **Serveur** (synchronisation) | Hébergement PHP/MySQL (OVH) | dossier `serveur/` | voir [serveur/LISEZMOI.md](serveur/LISEZMOI.md) |

Dans la version Windows, l'affichage a trois modes (`src/shared/utils/affichage.ts`) : **bureau** (l'écran complet), **mobile** (la mise en page du téléphone, dite « tablette ») et **sobre** (le poste de comptabilité, en nuances de gris et en tableaux).

## Démarrer

```bash
npm install
npx expo start              # serveur de développement (QR code, navigateur avec « w »)
npx expo start --web        # aperçu dans le navigateur
npm test                    # tests Vitest (règles métier et règles d'architecture)
npx tsc --noEmit            # vérification des types
npx expo lint               # analyse statique
```

Les modules natifs (lecture du texte des images, miniatures PDF) ne fonctionnent pas dans Expo Go : il faut un *development build* (`eas build --profile development`, ou `npx expo run:android` en local).

**Secrets** : aucune clé ne doit figurer dans le code, qui est publié sur GitHub. La clé Google Vision (lecture des numéros de boucle) se met dans un fichier `.env.local` à la racine, que git ignore :

```bash
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=ta_cle_ici
```

Les mots de passe et secrets du serveur sont dans `serveur/config.php`, lui aussi ignoré par git (modèle : `serveur/config.exemple.php`).

## Organisation du code

```
src/
  app/                 les routes (Expo Router) : un fichier = un écran, il ré-exporte un écran de features/
  features/            le métier, un dossier par domaine (cheptel, stock, comptabilite, sante…)
  shared/              la base, sans aucune règle métier : composants, styles, stockage, textes, constantes
    stockage-en-memoire/  le stockage du téléphone (AsyncStorage gardé en mémoire)
  bureau/              l'équivalent Windows des modules du téléphone (stockage, fichiers, impression…)
bureau/                la fenêtre Windows (Electron) : processus principal, pont, menus, textes de la fenêtre
serveur/               le serveur PHP : synchronisation, comptes, validation des saisies, pièces jointes
tests/                 tests Vitest (services métier, stockage, règles d'architecture)
docs/                  ARCHITECTURE.md (où ranger quoi), a-valider-avec-le-comptable.md
assets/, public/       icônes, images, fichiers statiques de la PWA
```

Les règles de rangement détaillées (dépendances autorisées, styles, textes, constantes, dictionnaire des espèces) sont dans [AGENTS.md](AGENTS.md) et [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Les points essentiels :

- Les couches ne dépendent que vers le bas : `app` → `features` → `shared`. `shared` n'importe jamais une fonctionnalité (contrôlé par `tests/architecture.test.ts`).
- Une fonctionnalité se range en `screens/`, `components/`, `hooks/`, `repository/` (accès au stockage), `services/` (règles pures, testées), `forms/`, `utils/`, `types.ts`.
- Une valeur fixe (statut, catégorie, seuil, clé de stockage, route) vit dans `shared/constants/` ; un texte affiché vit dans `shared/textes/` ; une couleur dans `shared/theme/colors.ts`.
- Une différence de plateforme s'écrit dans un fichier séparé (`*.web.ts`, `src/bureau/*.ts` pour Windows) plutôt que par des tests dispersés dans les écrans.

## Synchronisation entre appareils

Les données restent sur chaque appareil (stockage local), et sont synchronisées avec le serveur par la file d'attente de `src/shared/storage/depot.ts` et le moteur `src/features/sync/moteur.ts`. Une saisie faite par un utilisateur, ou en mode normal, attend la validation d'un modérateur ou d'un administrateur (écran Administration). Le serveur tient le journal des changements ; chaque appareil reçoit ce qui a changé depuis son dernier numéro.

## Maintenir le code propre

- Chercher le code inutilisé : `npx knip@5` (les fichiers chargés selon la plateforme, comme `src/bureau/*` et `*.web.ts`, sont signalés à tort : à vérifier à la main).
- Ne pas committer les fichiers de signature Android (`*.jks`) : ils sont ignorés par git, mais ne doivent pas être partagés.
- Les dossiers `dist/`, `dist-pwa/`, `bureau-dist/`, `.expo/` sont générés : on les reconstruit, on ne les modifie pas.
