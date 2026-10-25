<?php
declare(strict_types=1);

// L'API de synchronisation : connexion, puis lecture et écriture de la sauvegarde d'un établissement.
// Appelée par l'application en « api/index.php?r=... ».

$config = require __DIR__ . '/config.php';
require __DIR__ . '/synchro.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

/** Répond en JSON avec le code HTTP donné, puis arrête. */
function repondre(int $code, array $corps): void {
  http_response_code($code);
  echo json_encode($corps, JSON_UNESCAPED_UNICODE);
  exit;
}

$db = new PDO(
  "mysql:host={$config['hote']};dbname={$config['base']};charset=utf8mb4",
  $config['utilisateur'],
  $config['mot_de_passe'],
  [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC],
);

$action = $_GET['r'] ?? '';
$methode = $_SERVER['REQUEST_METHOD'];
$brut = file_get_contents('php://input') ?: '{}';
if (strlen($brut) > 8388608) repondre(413, ['erreur' => 'Envoi trop lourd.']);
$corps = json_decode($brut, true);
if (!is_array($corps)) $corps = [];

// Connexion : identifiant et mot de passe contre un jeton.
if ($action === 'connexion' && $methode === 'POST') {
  $identifiant = trim((string) ($corps['identifiant'] ?? ''));
  $motDePasse = (string) ($corps['mot_de_passe'] ?? '');
  $requete = $db->prepare('SELECT id, mot_de_passe_hash FROM utilisateurs WHERE identifiant = ?');
  $requete->execute([$identifiant]);
  $utilisateur = $requete->fetch();
  if (!$utilisateur || !password_verify($motDePasse, $utilisateur['mot_de_passe_hash'])) {
    repondre(401, ['erreur' => 'Identifiant ou mot de passe incorrect.']);
  }
  $jeton = bin2hex(random_bytes(32));
  $db->prepare('INSERT INTO sessions (jeton, utilisateur_id, expire_le) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))')
    ->execute([$jeton, $utilisateur['id']]);
  repondre(200, ['jeton' => $jeton, 'identifiant' => $identifiant]);
}

// Toutes les autres actions demandent le jeton de connexion.
$entete = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
$jeton = str_starts_with($entete, 'Bearer ') ? substr($entete, 7) : '';
$requete = $db->prepare(
  'SELECT u.identifiant FROM sessions s JOIN utilisateurs u ON u.id = s.utilisateur_id WHERE s.jeton = ? AND s.expire_le > NOW()'
);
$requete->execute([$jeton]);
$moi = $requete->fetch();
if (!$moi) repondre(401, ['erreur' => 'Connexion expirée : reconnecte-toi.']);

// Lire la sauvegarde d'un établissement.
if ($action === 'lire' && $methode === 'GET') {
  $etablissement = (string) ($_GET['etablissement'] ?? '');
  $requete = $db->prepare('SELECT donnees, version, modifie_le, modifie_par FROM sauvegardes WHERE etablissement = ?');
  $requete->execute([$etablissement]);
  $ligne = $requete->fetch();
  if (!$ligne) repondre(200, ['version' => 0, 'donnees' => null]);
  repondre(200, [
    'version' => (int) $ligne['version'],
    'donnees' => json_decode($ligne['donnees'], true),
    'modifie_le' => $ligne['modifie_le'],
    'modifie_par' => $ligne['modifie_par'],
  ]);
}

// Écrire la sauvegarde. La version attendue doit être celle du serveur, sinon quelqu'un a écrit entre-temps : conflit (409).
if ($action === 'ecrire' && $methode === 'PUT') {
  $etablissement = (string) ($corps['etablissement'] ?? '');
  $versionAttendue = (int) ($corps['version_attendue'] ?? 0);
  $donnees = $corps['donnees'] ?? null;
  if ($etablissement === '' || !is_array($donnees)) repondre(400, ['erreur' => 'Sauvegarde incomplète.']);

  $db->beginTransaction();
  $requete = $db->prepare('SELECT version FROM sauvegardes WHERE etablissement = ? FOR UPDATE');
  $requete->execute([$etablissement]);
  $actuelle = (int) ($requete->fetchColumn() ?: 0);
  if ($actuelle !== $versionAttendue) {
    $db->rollBack();
    repondre(409, ['erreur' => 'Conflit : la sauvegarde a changé depuis ta dernière lecture.', 'version' => $actuelle]);
  }
  $nouvelle = $actuelle + 1;
  $db->prepare(
    'INSERT INTO sauvegardes (etablissement, donnees, version, modifie_le, modifie_par) VALUES (?, ?, ?, NOW(), ?)
     ON DUPLICATE KEY UPDATE donnees = VALUES(donnees), version = VALUES(version), modifie_le = NOW(), modifie_par = VALUES(modifie_par)'
  )->execute([$etablissement, json_encode($donnees, JSON_UNESCAPED_UNICODE), $nouvelle, $moi['identifiant']]);
  $db->commit();
  repondre(200, ['version' => $nouvelle]);
}

// Les fiches, une à une (voir synchro.php et schema-v2.sql) : envoi des modifications, puis réception de ce qui a changé.
$etablissement = (string) ($_GET['etablissement'] ?? $corps['etablissement'] ?? '');
if (!preg_match('/^[a-z0-9_\-]{1,64}$/', $etablissement)) repondre(400, ['erreur' => 'Établissement invalide.']);

if ($action === 'pousser' && $methode === 'POST') {
  $modifications = $corps['modifications'] ?? null;
  if (!is_array($modifications)) repondre(400, ['erreur' => 'Modifications manquantes.']);
  try {
    repondre(200, pousserModifications($db, $moi['identifiant'], $etablissement, $modifications));
  } catch (InvalidArgumentException $erreur) {
    repondre(400, ['erreur' => $erreur->getMessage()]);
  }
}

if ($action === 'tirer' && $methode === 'GET') {
  $depuis = max(0, (int) ($_GET['depuis'] ?? 0));
  repondre(200, tirerModifications($db, $etablissement, $depuis));
}

repondre(404, ['erreur' => 'Action inconnue.']);
