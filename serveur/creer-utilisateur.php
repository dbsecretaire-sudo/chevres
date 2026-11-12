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
  <p><label>Rôle <select name="role"><option value="administrateur">Administrateur (tout)</option><option value="moderateur">Modérateur (son exploitation)</option><option value="utilisateur">Utilisateur (saisies à valider)</option></select></label></p>
  <p><label>Exploitation (pour un utilisateur seulement) <input name="etablissement" pattern="[a-z0-9_\-]{1,64}"></label></p>
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
// Le rôle : « administrateur » (tout voir, toutes les exploitations), « moderateur » ou « utilisateur » (saisies à valider).
$role = (string) ($_POST['role'] ?? 'moderateur');
$etablissement = trim((string) ($_POST['etablissement'] ?? ''));
if (!in_array($role, ['administrateur', 'moderateur', 'utilisateur'], true)) message(400, 'Rôle inconnu.');
// L'administrateur voit tout : pas d'exploitation à donner. Les autres ont au moins une exploitation (par défaut : « exploitation »).
// Plusieurs exploitations se règlent ensuite dans l'écran Administration de l'application.
if ($role !== 'administrateur') {
  // La liaison à l'établissement est obligatoire : il doit exister (il se crée d'abord dans Mes établissements, dans l'application).
  if ($etablissement === '') message(400, 'Indique l’établissement de l’utilisateur (il doit déjà exister).');
  if (!preg_match('/^[a-z0-9_\-]{1,64}$/', $etablissement)) message(400, 'Établissement invalide (lettres minuscules, chiffres, tirets ou soulignés).');
  $existe = $db->prepare('SELECT 1 FROM exploitations WHERE etablissement = ?');
  $existe->execute([$etablissement]);
  if ($existe->fetchColumn() === false) message(400, 'Cet établissement n’existe pas : crée-le d’abord dans Mes établissements, dans l’application.');
}

$db->beginTransaction();
// L'exploitation du compte ne s'écrit plus dans utilisateurs : elle est dans acces_exploitations (ci-dessous).
$db->prepare('INSERT INTO utilisateurs (identifiant, mot_de_passe_hash, role) VALUES (?, ?, ?)')
  ->execute([$identifiant, password_hash($motDePasse, PASSWORD_DEFAULT), $role]);
if ($role !== 'administrateur') {
  $db->prepare('INSERT INTO acces_exploitations (utilisateur_id, etablissement) VALUES (?, ?)')
    ->execute([(int) $db->lastInsertId(), $etablissement]);
}
$db->commit();
message(200, "Compte « $identifiant » créé. Supprime maintenant creer-utilisateur.php du serveur.");
