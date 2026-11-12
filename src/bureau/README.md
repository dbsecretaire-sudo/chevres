# src/bureau — la version Windows dans le code de l'application

Ce dossier contient ce que l'application utilise **à la place** des modules du téléphone quand elle tourne dans la fenêtre Windows (Electron).

Le remplacement est fait par `metro.config.js` lorsque la variable `EXPO_PUBLIC_BUREAU=1` est posée (c'est le cas de `npm run bureau:export`). Par exemple, `@react-native-async-storage/async-storage` est remplacé par `asyncStorage.ts`, `expo-file-system/legacy` par `fileSystem.ts`, `expo-print` par `print.ts`, et ainsi de suite (la liste exacte est dans `metro.config.js`).

Le téléphone et la PWA ne chargent jamais ces fichiers.

## Contenu

- **Modules de remplacement** (`asyncStorage.ts`, `fileSystem.ts`, `documentPicker.ts`, `sharing.ts`, `print.ts`, `crypto.ts`) : même interface que le module du téléphone, mais qui parle au processus principal d'Electron (`bureau/main.js`) via le pont `pont.ts`.
- **Pont et retour** (`pont.ts`, `retour.ts`) : appels vers le processus principal, et le suivi des retours arrière de la fenêtre.
- **Mise en page Windows** (`EnDeuxColonnes.tsx`, `colonnes.tsx`, `MenuBureau.tsx`, `MenuDeLaFenetre.tsx`, `FlecheRetourBureau.tsx`, `changerAffichage.ts`) : le menu de gauche, les deux colonnes, la flèche de retour, et le changement de mode d'affichage (bureau, mobile, sobre — voir `src/shared/utils/affichage.ts`).

## Règle

Ce dossier ne contient pas de règle métier : il ne fait qu'adapter l'accès à l'ordinateur. Une règle de calcul ou d'affichage commune reste dans `src/features/` ou `src/shared/`.
