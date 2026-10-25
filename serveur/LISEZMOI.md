# Serveur de synchronisation (hébergé chez OVH)

Ce dossier n'est pas publié avec l'appli : il est copié à la main sur l'hébergement, dans `/www/pronta/chevres/api/`.

## Fichiers

- `index.php` : le point d'entrée de l'API (`api/index.php?r=...`).
- `synchro.php` : l'envoi et la réception des fiches (version 2).
- `config.php` : le mot de passe de la base et la clé de création des comptes. **Jamais dans le dépôt** (il est ignoré par git).
- `.htaccess` : empêche de lire `config.php` depuis le web.
- `schema.sql` : tables de la version 1 (comptes, connexions, sauvegarde complète).
- `schema-v2.sql` : tables de la version 2 (fiches, historique, journal). À exécuter une fois, après `schema.sql`.
- `creer-utilisateur.php` : crée un compte. À supprimer du serveur après usage.
- `tester-synchro.ps1` : test depuis ton PC (connexion, envoi, réception).

## Mise en route de la version 2

1. Dans phpMyAdmin, ouvre la base `prontabchevres`, onglet SQL, colle `schema-v2.sql` et exécute.
2. Envoie `index.php` et `synchro.php` dans `/www/pronta/chevres/api/`, en remplaçant l'ancien `index.php`.
3. Lance `tester-synchro.ps1` avec ton identifiant, et saisis ton mot de passe à l'invite. Tu dois voir la fiche de test revenir dans la réception.

## Règles

- Une modification remplace la fiche, et l'ancienne version part dans `historique_fiches`.
- Le serveur date les modifications lui-même (l'heure des téléphones n'entre pas en jeu).
- Un envoi est refusé en entier s'il contient une fiche invalide.
- Une fiche fait au plus 2 Mo, un envoi au plus 200 fiches.
