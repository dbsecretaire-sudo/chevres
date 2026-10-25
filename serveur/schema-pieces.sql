-- Les fichiers joints synchronisés (PDF et images, 5 Mo au plus chacun). À exécuter une fois dans phpMyAdmin, sur la base de l'application.
CREATE TABLE IF NOT EXISTS pieces_jointes (
  etablissement VARCHAR(64) NOT NULL,
  id VARCHAR(64) NOT NULL,
  extension VARCHAR(16) NOT NULL,
  mime VARCHAR(128) NOT NULL,
  taille INT UNSIGNED NOT NULL,
  contenu LONGBLOB NOT NULL,
  envoye_par VARCHAR(64) NOT NULL,
  envoye_le DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (etablissement, id)
) DEFAULT CHARSET = utf8mb4;
