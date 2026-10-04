This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Code organisation

- `src/app/` holds **routes only**: each file is a one-line re-export (`export { default } from '@/features/<feature>/screens/<Screen>'`) plus the `_layout.tsx` navigators.
- `src/features/<feature>/` is organised by domain (`cheptel`, `comptabilite`, `exploitation`, `clients`, `fournisseurs`, `comptes-pcg`, `etablissements`, `settings`, `drive`, `export`, `sauvegarde`, `accueil`) with sub-folders as needed: `screens/`, `components/`, `repository/` (storage access), `services/` (calculations), `forms/`, `utils/`, `types.ts`.
- `src/shared/` is cross-feature code: `components/`, `styles/`, `storage/`, `theme/`, `hooks/`, `utils/`.
- All styles live in `src/shared/styles/` (never inside a feature): `shared/styles/<feature>/<Name>.styles.ts` (`export const styles`), `shared/styles/components/` for shared components. A style used by several files is defined once in `src/shared/styles/commonStyles.ts` (`commonStyles`) — reuse it instead of redefining it locally.
- Format with `npx prettier --write "src/**/*.{ts,tsx}"` (config in `.prettierrc`).

## No hard-coded data in application files

- **Enumerated values** (statuts, catégories, types, unités…) live in `src/shared/constants/` as `as const` objects (`STATUT_CHEVRE.VIVANTE`, `TYPE_FACTURE.RECUE`…); the TypeScript union types are derived from them (`ValeurDe<typeof …>`). Never compare to a raw string like `'vivante'`.
- **Business thresholds and settings** (âge d'un cabri, taux de TVA, poids d'un matelas, comptes PCG, formats d'export, clés de stockage, noms de fichiers/dossiers Drive, URL et MIME Google, CSV, routes…) are also in `src/shared/constants/` (`cheptel`, `comptabilite`, `planComptable`, `stockage`, `drive`, `google`, `csv`, `export`, `routes`, `temps`, `format`).
- **All user-visible text** lives in `src/shared/textes/` (`TEXTES.<domaine>.<écran>.<clé>`, a function when the text has parameters); enum → label maps are in `src/shared/textes/libelles.ts`.
- **Colors** come from `src/shared/theme/colors.ts` (no raw `#fff` / `rgba(...)`).
- To change a value, change it in one of those folders only — screens and services must reference them.

## Vocabulary by animal species (dictionnaire)

- The words for the animals (female / male / young: chèvre-bouc-cabri, brebis-bélier-agneau, vache-taureau-veau, truie-verrat-porcelet) depend on the **current species** (`especeCourante()`). They live in `src/shared/dictionnaire/animaux.ts` only (`DICTIONNAIRE_ANIMAUX`). An établissement can raise several species: each animal carries its own `espece` (read it with `especeDe()`), the user switches the current species with `SelecteurEspece`, and every herd screen/repository works on the current species only (`deEspeceCourante()`). No species selected → goats.
- Species-dependent thresholds (age limit of the young, weaning age, max young per birth) are in `PARAMETRES_ESPECE` (`src/shared/constants/cheptel.ts`); feed types per species are in `TYPES_ALIMENT_PAR_ESPECE` (`src/shared/constants/comptabilite.ts`).
- Sales and invoices carry an `activite` (a species, or `commun`); use `activiteFacture()` / `activiteVente()`, which give old records (no `activite`) the default species. Taxes/RSA start on « Tout » (everything added together, as the declaration requires); `PucesActivite` can narrow them to one cheptel or « Commun », and the « par activité » screen splits the accounts.
- Texts that contain one of these words read `vocabulaire()` through a **getter** in `src/shared/textes/` (`get uneChevre() { … }`), so they are evaluated at display time, after the établissement is chosen. Never copy such a text into a module-level constant (`const X = TEXTES…chevres`): use a getter or a function instead.
- Internal identifiers keep their original names (`Chevre`, `CATEGORIE_ANIMAL.BOUC`, `ficheChevre`…); only the displayed wording changes.
