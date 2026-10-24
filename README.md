# Troupeau Chèvres

Application mobile (iOS + Android, React Native / Expo) pour gérer un troupeau de chèvres : cheptel, naissances, mortalité/abattoir, visites vétérinaires, factures, ventes de lait et de fromage, et contrôles.

## Fonctionnalités

- **Cheptel** : chaque chèvre a un n° de boucle (facultatif tant qu'elle a moins de 6 mois — légalement non obligatoire avant, et le n° peut être ajouté plus tard depuis sa fiche), un sexe, une date de naissance, une mère (facultative), des notes.
- **Statuts** : `vivante`, `morte`, `abattoir`, `vendue`, `auto-consommée`, `mort-née`. Une chèvre qui n'est plus `vivante` disparaît de la liste principale mais **reste enregistrée** (visible dans "Historique").
- **Naissances** : un écran dédié permet de déclarer une mise bas avec plusieurs cabrits d'un coup (sexe, boucle facultative, mort-né). Chaque cabrit né est classé automatiquement dans le fichier de **l'année de sa date de naissance réelle** (utile pour les mises bas à cheval sur deux années, ex: mi-décembre à mi-janvier), indépendamment de "l'année active" affichée à l'écran.
- **Bilan annuel** (`Cheptel > Bilan`) : reconstitue automatiquement, pour une année donnée, le nombre de cabrits nés (renouvellement / vendus / abattoir / auto-consommation / mort-nés), les mouvements du troupeau déjà présent (mortes / abattoir / ventes / mises bas), et l'effectif début/fin d'année — avec un champ pour saisir le nombre **officiellement déclaré** (ex: établissement de l'élevage) et voir l'écart.
- **Comptabilité** : liste unifiée de toutes les écritures (ventes de lait/fromage/cabris + factures reçues/émises), filtrable par période et par montant, avec solde. Chaque écriture est rattachée à un compte du Plan Comptable Général indicatif (menu ⋮ : export du plan comptable). Le menu ⋮ donne aussi accès à deux notices : **Impôts (micro-BA)** et **Déclaration RSA**, qui organisent vos propres montants (recettes annuelles, ventilation mensuelle) sans jamais appliquer de taux d'abattement — ceux-ci changent selon les années et doivent être vérifiés auprès de votre comptable/CGA/CAF/MSA (voir le texte de la notice dans chaque écran).
- **Exploitation** : Visites vétérinaires, Contrôles, et **Alimentation** — les factures reçues catégorisées "Alimentation" peuvent détailler plusieurs aliments (maïs/luzerne/foin) sur une même facture ; l'app additionne et calcule le coût par animal (effectif actuel). Export du rapport (vétérinaire + contrôles + alimentation) depuis le menu ⋮.
- **Ventes** : lait (litrage + date, sans prix), fromage (frais / affiné / crottin / brocciu / autre, quantité, prix) et cabris (nombre, prix) — saisies depuis Comptabilité.
- **Export Excel** : depuis Réglages, génère un classeur .xlsx (un onglet par catégorie) pour l'année active et ouvre le menu de partage du téléphone.
- **Synchronisation Google Drive** (optionnelle) : envoie/récupère des fichiers `.csv` — `cheptel_<année>.csv`, `ventes_<année>.csv`, `factures_<année>.csv`, `visites_veterinaire_<année>.csv`, `controles_<année>.csv` — dans un dossier "Troupeau Chèvres" sur Google Drive, pour que plusieurs personnes/appareils partagent les mêmes données. Sans connexion Drive, l'application fonctionne entièrement hors-ligne (stockage local sur l'appareil).
- **Scan de boucle** : sur chaque champ "N° de boucle", un bouton caméra permet de photographier la boucle plutôt que de taper le numéro à la main. La photo est envoyée à Google Cloud Vision (OCR) qui propose un ou plusieurs numéros détectés, à confirmer ou corriger avant validation.

## Démarrer le projet

```bash
npm install
npx expo start
```

Puis scanner le QR code avec l'app **Expo Go** (Android/iOS), ou lancer :

```bash
npx expo start --android
npx expo start --ios      # nécessite macOS
npx expo start --web      # aperçu navigateur, pratique pour tester vite
```

## Configurer la synchronisation Google Drive (facultatif)

L'app fonctionne très bien sans, en local uniquement. Pour activer le partage entre plusieurs appareils :

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/apis/credentials) et créer un projet.
2. Activer l'**API Google Drive** (menu "API et services" > "Bibliothèque").
3. Configurer l'**écran de consentement OAuth** (type Externe, statut "Test" suffit pour un usage privé), avec le scope `.../auth/drive` (accès complet, nécessaire pour voir les fichiers déposés manuellement dans le dossier Drive) et vos comptes Google comme utilisateurs test.
4. Créer un identifiant OAuth **Android** (package `com.troupeauchevres.app` + empreinte SHA-1 du build, donnée par `npx eas-cli@latest credentials`) — son ID n'est pas utilisé dans le code, seul son existence compte.
5. Créer un second identifiant OAuth de type **Web** — son ID, lui, est utilisé dans le code (`src/drive/googleWebClientId.ts`), c'est ce qui permet à la connexion de fonctionner sur Android.
6. Dans l'app : **Réglages > Google Drive > Se connecter**.
7. Utiliser "Envoyer vers Drive" / "Récupérer depuis Drive" pour synchroniser. En cas de saisie sur deux appareils, le dernier qui synchronise une catégorie/année écrase le contenu distant de cette catégorie/année — penser à récupérer avant de saisir si un autre appareil a pu modifier les données entre-temps.

Les fichiers créés sur Drive sont de simples `.csv` (ouvrables/modifiables aussi depuis Google Sheets si besoin).

## Configurer le scan de boucle par caméra (facultatif)

Sans clé configurée, le bouton caméra affiche une erreur mais la saisie manuelle reste disponible partout.

1. Dans le même projet Google Cloud, activer l'**API Cloud Vision** (bibliothèque d'API).
2. Créer une **clé API** (Identifiants > Créer des identifiants > Clé API).
3. ⚠️ La restreindre immédiatement à la seule **Cloud Vision API** (contrairement aux Client ID OAuth, cette clé permet d'appeler l'API et donc de générer des coûts si elle fuite).
4. Coller la clé dans `src/ocr/googleVisionApiKey.ts` (`GOOGLE_VISION_API_KEY`).
5. La Cloud Vision API nécessite un compte de facturation actif sur le projet, mais reste gratuite jusqu'à 1000 lectures/mois — largement suffisant pour cet usage.

## Compiler l'app pour iOS / Android (EAS)

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform ios --profile preview
```

Voir [docs.expo.dev/eas](https://docs.expo.dev/eas/index.md) pour la configuration complète (signature, soumission aux stores, etc.).

## Structure du projet

```
src/
  app/          routes (Expo Router) : un fichier = une route, qui ré-exporte un écran de features/
  features/     le métier, une fonctionnalité par dossier (cheptel, lots-animaux, sante, comptabilite, stock…)
  shared/       la base : composants, styles, stockage, textes, constantes, utilitaires
  bureau/       adaptation Windows (Electron)
tests/          tests Vitest (règles métier, structure du code)
docs/           ARCHITECTURE.md : où ranger quoi, comment stocker une donnée, avant de livrer
```

Le détail (rôle de chaque fonctionnalité, règles d'import, liste de contrôle pour ajouter une donnée) est dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Toutes les données sont stockées localement sur l'appareil (AsyncStorage), organisées par établissement, par catégorie et par année — la même structure que celle utilisée pour la synchronisation Drive et l'export Excel.
