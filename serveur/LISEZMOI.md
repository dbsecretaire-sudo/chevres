# Serveur de synchronisation (hébergé chez OVH)

Ce dossier n'est pas publié avec l'appli : ses fichiers PHP sont copiés à la main sur l'hébergement, dans `/www/pronta/chevres/api/`. La base de données (prontabchevres) est déjà en place : aucun script SQL n'est à relancer.

## Fichiers

- `index.php` : le point d'entrée de l'API (`api/index.php?r=...`) : connexion, comptes, exploitations, envoi et réception des fiches, pièces jointes, validation des saisies.
- `synchro.php` : l'envoi et la réception des fiches (motifs de refus, historique, journal).
- `roles.php` : les rôles (administrateur, modérateur, utilisateur), les accès aux exploitations et la file de validation des saisies.
- `creer-utilisateur.php` : crée un compte. **À supprimer du serveur après usage.**
- `config.php` : le mot de passe de la base et la clé de création des comptes. **Jamais dans le dépôt** (il est ignoré par git). Modèle : `config.exemple.php`.
- `.htaccess` : empêche de lire `config.php` depuis le web.
- `tester-synchro.ps1` : test depuis ton PC (connexion, envoi, réception).

## Mettre à jour le serveur

1. Envoie `index.php`, `synchro.php` et `roles.php` dans `/www/pronta/chevres/api/`, en remplaçant les anciens.
2. Lance `tester-synchro.ps1` avec ton identifiant, et saisis ton mot de passe à l'invite. Tu dois voir la fiche de test revenir dans la réception.

## Règles

- Une modification remplace la fiche, et l'ancienne version part dans `historique_fiches`.
- Le serveur date les modifications lui-même (l'heure des téléphones n'entre pas en jeu).
- Une saisie d'un utilisateur, ou faite en mode normal par un modérateur ou un administrateur, attend dans la file de validation (`attentes_validation`) : elle n'entre dans les données qu'une fois validée.
- Un refus supprime la saisie de la file et la signale aux appareils (journal).
- Un envoi est refusé en entier s'il contient une fiche invalide.
- Une fiche fait au plus 4 Mo, un envoi au plus 200 fiches.
