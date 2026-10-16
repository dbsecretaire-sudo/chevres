# Troupeau Chèvres pour Windows

La même application que sur le téléphone, dans une fenêtre de bureau. Elle **fonctionne sans internet** : les données et les
pièces jointes sont rangées dans des fichiers de l'ordinateur. Internet ne sert qu'à **Google Drive**.

Les menus (Accueil, Cheptel, Production, Comptabilité, Organisation, Affichage) sont en haut à gauche de la fenêtre, à la place de
la barre d'icônes du téléphone. `Ctrl +` / `Ctrl -` changent la taille, `F11` met en plein écran.

## Où sont les données ?

`%APPDATA%\Troupeau Chèvres\` :

- `donnees.json` : toutes les données (et `donnees.json.bak`, la copie de la fois d'avant) ;
- `documents\pieces\…` : les fichiers joints (Word, Excel, PDF, images) ;
- `google-session.bin` : la connexion Google, chiffrée par Windows.

Pour sauvegarder : copier ce dossier, ou utiliser Organisation › Mes données › Sauvegarde locale (comme sur le téléphone).
Les données de l'ordinateur et celles du téléphone sont séparées : elles se rejoignent par Google Drive ou par une sauvegarde.

## Copies automatiques des données

À chaque jour d'utilisation, l'application garde une copie de ses données (`donnees_AAAA-MM-JJ.json`) pendant trente jours, dans le
dossier `sauvegardes-auto` des données de l'application (`%APPDATA%\Troupeau Chèvres`). Pour revenir à un jour : fermer l'application,
remplacer `donnees.json` par la copie voulue (renommée `donnees.json`), puis rouvrir. Ces copies sont sur le même disque : elles
protègent d'une fausse manœuvre, pas d'une panne ; la sauvegarde en fichier ou sur Google Drive (rappelée sur l'accueil) reste
nécessaire.

## Fabriquer le programme d'installation

```bash
npm run bureau:installateur
```

Le programme est créé dans `bureau-dist\Troupeau Chèvres Setup 1.0.0.exe` (environ 110 Mo). Pour seulement essayer l'application,
sans l'installer :

```bash
npm run bureau:lancer
```

## Google Drive sur l'ordinateur (réglage à faire une fois, gratuit)

Sur le téléphone, la connexion passe par Android. Sur l'ordinateur, elle passe par le navigateur et demande un identifiant de
type « Application de bureau » :

1. Ouvrir <https://console.cloud.google.com> avec le projet qui sert déjà à Google Drive (l'API Drive y est déjà activée).
2. API et services › Identifiants › Créer des identifiants › **ID client OAuth** › type **Application de bureau**.
3. Copier l'identifiant client (et le code secret donné avec) dans un fichier `google.json` :

   ```json
   { "clientId": "xxxx.apps.googleusercontent.com", "clientSecret": "xxxx" }
   ```

4. Poser ce fichier dans `%APPDATA%\Troupeau Chèvres\google.json` (ou dans `bureau\google.json` avant de fabriquer
   l'installateur). Ne pas le publier : il est ignoré par git.

Ensuite, Organisation › Mes données › Google Drive › Se connecter ouvre le navigateur ; une fois la connexion acceptée, on
revient à l'application. Sans ce fichier, tout le reste fonctionne, seule la connexion à Drive est refusée.

## Ce qui change par rapport au téléphone

- Le scan des boucles utilise la caméra de l'ordinateur (si elle existe).
- « Partager » un export ou une sauvegarde ouvre « Enregistrer sous ».
- Les fichiers joints s'ouvrent avec le programme de Windows qui convient (Word, Excel, lecteur PDF…).

## Pour les développeurs

`metro.config.js` remplace, quand `EXPO_PUBLIC_BUREAU=1`, les modules du téléphone (stockage, fichiers, impression, partage,
sélecteur de fichiers, connexion Google) par ceux de `src/bureau/`, qui parlent au processus principal (`bureau/main.js`) par le pont
`bureau/preload.js`. Le téléphone et la version web ordinaire ne changent pas.

## Un seul dépôt pour le téléphone et Windows

Le code du téléphone et celui de Windows sont **le même dépôt** (`chèvre`) : les écrans sont communs, et ce qui est propre à Windows
est isolé — `bureau/`, `src/bureau/`, `metro.config.js` — ou protégé par `estBureau()` (vrai seulement dans la fenêtre Windows).
Le téléphone n'exécute donc rien de Windows.

```bash
npm test                    # les tests automatiques de la logique (boucles, courrier, comptabilité…)
npx tsc --noEmit && npx expo lint
npm run bureau:installateur # fabrique le programme d'installation Windows (dossier bureau-dist)
```

Le dossier `chevre_pc` n'est plus qu'une copie de ce dépôt qui sert à fabriquer l'installateur : on n'y modifie rien. Pour le mettre à
jour : `git pull ..\chèvre master`.
