-- Version 2 : les fiches, une à une. À exécuter une fois, dans phpMyAdmin, sur la base prontabchevres (après schema.sql).

-- Chaque fiche (une entrée d'une liste, un réglage…) : sa zone, son identifiant et son contenu.
-- contenu vide (NULL) = fiche supprimée. La dernière modification gagne sur la fiche touchée.
CREATE TABLE IF NOT EXISTS fiches (
  etablissement VARCHAR(64) NOT NULL,
  zone VARCHAR(128) NOT NULL,
  identifiant VARCHAR(191) NOT NULL,
  contenu LONGTEXT NULL,
  version INT NOT NULL,
  modifie_le DATETIME(3) NOT NULL,
  modifie_par VARCHAR(64) NOT NULL,
  PRIMARY KEY (etablissement, zone, identifiant)
);

-- Chaque ancienne version d'une fiche, gardée quand elle est remplacée : rien n'est perdu sans retour possible.
CREATE TABLE IF NOT EXISTS historique_fiches (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  etablissement VARCHAR(64) NOT NULL,
  zone VARCHAR(128) NOT NULL,
  identifiant VARCHAR(191) NOT NULL,
  contenu LONGTEXT NULL,
  version INT NOT NULL,
  remplacee_le DATETIME(3) NOT NULL,
  remplacee_par VARCHAR(64) NOT NULL,
  INDEX idx_historique_fiche (etablissement, zone, identifiant)
);

-- Le journal des changements, dans l'ordre : chaque appareil demande « tout ce qui a changé après le numéro N ».
CREATE TABLE IF NOT EXISTS journal (
  rang BIGINT AUTO_INCREMENT PRIMARY KEY,
  etablissement VARCHAR(64) NOT NULL,
  zone VARCHAR(128) NOT NULL,
  identifiant VARCHAR(191) NOT NULL,
  INDEX idx_journal_etablissement (etablissement, rang)
);
