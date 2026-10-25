<?php
declare(strict_types=1);

// Crée un compte (identifiant et mot de passe). À utiliser une fois par personne, puis SUPPRIMER ce fichier du serveur.
// On remplit le formulaire dans le navigateur : le mot de passe n'apparaît ni dans l'adresse ni dans les journaux.

$config = require __DIR__ . '/config.php';

header('Content-Type: text/html; charset=utf-8');

/** Affiche un message simple, puis arrête. */
function message(int $code, string $texte): void {
  http_response_code($code);
  echo '<!doctype html><meta charset="utf-8"><p>' . htmlspecialchars($texte, ENT_QUOTES, 'UTF-8') . '</p>';
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  echo <<<HTML
<!doctype html><meta charset="utf-8"><title>Créer un compte</title>
<form method="post">
  <p><label>Clé d'installation <input type="password" name="cle" required></label></p>
  <p><label>Identifiant <input name="identifiant" required></label></p>
  <p><label>Mot de passe (9 caractères au moins) <input type="password" name="mot_de_passe" minlength="9" required></label></p>
  <p><button type="submit">Créer le compte</button></p>
</form>
HTML;
  exit;
}

if (!hash_equals($config['cle_installation'], (string) ($_POST['cle'] ?? ''))) {
  message(403, 'Clé incorrecte.');
}
$identifiant = trim((string) ($_POST['identifiant'] ?? ''));
$motDePasse = (string) ($_POST['mot_de_passe'] ?? '');
if ($identifiant === '' || strlen($motDePasse) < 9) {
  message(400, 'Identifiant manquant, ou mot de passe de moins de 9 caractères.');
}

$db = new PDO(
  "mysql:host={$config['hote']};dbname={$config['base']};charset=utf8mb4",
  $config['utilisateur'],
  $config['mot_de_passe'],
  [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
);
$db->prepare('INSERT INTO utilisateurs (identifiant, mot_de_passe_hash) VALUES (?, ?)')
  ->execute([$identifiant, password_hash($motDePasse, PASSWORD_DEFAULT)]);
message(200, "Compte « $identifiant » créé. Supprime maintenant creer-utilisateur.php du serveur.");
