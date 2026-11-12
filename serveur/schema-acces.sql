-- Plusieurs exploitations par compte. À exécuter une fois dans phpMyAdmin, après schema-roles.sql.
-- Un compte administrateur n'a pas besoin de ligne ici : il voit toutes les exploitations.

CREATE TABLE IF NOT EXISTS acces_exploitations (
  utilisateur_id INT NOT NULL,
  etablissement VARCHAR(64) NOT NULL,
  PRIMARY KEY (utilisateur_id, etablissement),
  CONSTRAINT fk_acces_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reprise des comptes existants : leur exploitation actuelle (« exploitation » si elle était vide) devient leur accès.
INSERT IGNORE INTO acces_exploitations (utilisateur_id, etablissement)
SELECT id, COALESCE(NULLIF(etablissement, ''), 'exploitation')
FROM utilisateurs
WHERE role <> 'administrateur';
