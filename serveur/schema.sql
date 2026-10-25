-- À exécuter une fois, dans phpMyAdmin (espace OVH > Bases de données > prontabchevres).

-- Les personnes qui ont un accès (ton compagnon et toi).
CREATE TABLE IF NOT EXISTS utilisateurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identifiant VARCHAR(64) NOT NULL UNIQUE,
  mot_de_passe_hash VARCHAR(255) NOT NULL
);

-- Les connexions ouvertes : un jeton par appareil, valable 30 jours.
CREATE TABLE IF NOT EXISTS sessions (
  jeton CHAR(64) PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  expire_le DATETIME NOT NULL,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- La sauvegarde complète de chaque établissement, avec son numéro de version (pour repérer les conflits).
CREATE TABLE IF NOT EXISTS sauvegardes (
  etablissement VARCHAR(64) PRIMARY KEY,
  donnees LONGTEXT NOT NULL,
  version INT NOT NULL,
  modifie_le DATETIME NOT NULL,
  modifie_par VARCHAR(64) NOT NULL
);
