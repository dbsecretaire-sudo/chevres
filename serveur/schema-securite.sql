-- La sécurité des connexions. À exécuter une fois dans phpMyAdmin, sur la base de l'application.

-- Les échecs de connexion, pour refuser les essais en série (5 échecs en 15 minutes pour un identifiant).
CREATE TABLE IF NOT EXISTS connexions_echouees (
  identifiant VARCHAR(64) NOT NULL,
  quand DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_identifiant_quand (identifiant, quand)
) DEFAULT CHARSET = utf8mb4;

-- Les sessions ouvertes avant cette mise à jour gardent leur jeton en clair : on les supprime.
-- Chacun se reconnecte une fois (identifiant et mot de passe), et le serveur ne garde ensuite que l'empreinte du jeton.
DELETE FROM sessions;
