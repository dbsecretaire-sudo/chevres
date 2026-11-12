-- Les rôles : le modérateur voit et valide tout ; l'utilisateur ne voit que son exploitation, et ses saisies attendent la validation
-- d'un modérateur avant d'entrer dans les données. À exécuter une fois, dans phpMyAdmin, sur la base de l'application
-- (après schema.sql et schema-v2.sql). Les comptes existants deviennent modérateurs.

-- Le rôle de chaque compte, et l'exploitation qui lui est ouverte (un utilisateur n'en a qu'une ; un modérateur n'en a pas besoin).
ALTER TABLE utilisateurs
  ADD COLUMN role VARCHAR(16) NOT NULL DEFAULT 'moderateur',
  ADD COLUMN etablissement VARCHAR(64) NULL;

-- Les saisies d'un utilisateur, en attente de la validation d'un modérateur. Rien n'entre dans les données tant qu'elles ne sont pas validées.
CREATE TABLE IF NOT EXISTS attentes_validation (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  etablissement VARCHAR(64) NOT NULL,
  zone VARCHAR(128) NOT NULL,
  identifiant VARCHAR(191) NOT NULL,
  contenu LONGTEXT NULL,
  auteur VARCHAR(64) NOT NULL,
  cree_le DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_attentes_etablissement (etablissement, id)
) DEFAULT CHARSET = utf8mb4;
