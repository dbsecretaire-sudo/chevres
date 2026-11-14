<?php
declare(strict_types=1);

// L'API de synchronisation : connexion, puis lecture et écriture de la sauvegarde d'une exploitation.
// Appelée par l'application en « api/index.php?r=... ».

$config = require __DIR__ . '/config.php';
require __DIR__ . '/synchro.php';
require __DIR__ . '/roles.php';

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
  // Trop d'échecs pour cet identifiant (5 en 15 minutes) : on refuse avant même de vérifier le mot de passe, contre les essais en série.
  $requete = $db->prepare('SELECT COUNT(*) FROM connexions_echouees WHERE identifiant = ? AND quand > (NOW() - INTERVAL 15 MINUTE)');
  $requete->execute([$identifiant]);
  if ((int) $requete->fetchColumn() >= 5) {
    repondre(429, ['erreur' => 'Trop de tentatives. Réessaie dans 15 minutes.']);
  }
  $requete = $db->prepare('SELECT id, mot_de_passe_hash, role FROM utilisateurs WHERE identifiant = ?');
  $requete->execute([$identifiant]);
  $utilisateur = $requete->fetch();
  if (!$utilisateur || !password_verify($motDePasse, $utilisateur['mot_de_passe_hash'])) {
    $db->prepare('INSERT INTO connexions_echouees (identifiant) VALUES (?)')->execute([$identifiant]);
    repondre(401, ['erreur' => 'Identifiant ou mot de passe incorrect.']);
  }
  $db->prepare('DELETE FROM connexions_echouees WHERE identifiant = ?')->execute([$identifiant]);
  // Le jeton part vers l'appareil ; le serveur ne garde que son empreinte : une lecture de la base ne donne pas de session utilisable.
  $jeton = bin2hex(random_bytes(32));
  $db->prepare('INSERT INTO sessions (jeton, utilisateur_id, expire_le) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 3650 DAY))')
    ->execute([hash('sha256', $jeton), $utilisateur['id']]);
  // Le rôle et les exploitations du compte : l'application s'en sert pour ce qu'elle montre (un utilisateur n'a pas le choix de l'exploitation).
  $exploitations = estAdministrateur($utilisateur) ? [] : exploitationsDe($db, (int) $utilisateur['id']);
  repondre(200, [
    'jeton' => $jeton,
    'identifiant' => $identifiant,
    'role' => $utilisateur['role'],
    'exploitations' => $exploitations,
    // Pour les anciennes versions de l'application : la première exploitation du compte.
    'etablissement' => $exploitations[0] ?? null,
  ]);
}

// Toutes les autres actions demandent le jeton de connexion.
$entete = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
$jeton = str_starts_with($entete, 'Bearer ') ? substr($entete, 7) : '';
$empreinte = hash('sha256', $jeton);
$requete = $db->prepare(
  'SELECT u.id, u.identifiant, u.role FROM sessions s JOIN utilisateurs u ON u.id = s.utilisateur_id WHERE s.jeton = ? AND s.expire_le > NOW()'
);
$requete->execute([$empreinte]);
$moi = $requete->fetch();
if (!$moi) repondre(401, ['erreur' => 'Connexion expirée : reconnecte-toi.']);
$moi['id'] = (int) $moi['id'];
$moi['exploitations'] = exploitationsDe($db, $moi['id']);

// Se déconnecter : la session est supprimée du serveur, le jeton ne sert plus nulle part.
if ($action === 'deconnexion' && $methode === 'POST') {
  $db->prepare('DELETE FROM sessions WHERE jeton = ?')->execute([$empreinte]);
  repondre(200, ['ok' => true]);
}

// Les comptes que l'on voit, avec leur rôle et leurs exploitations (voir listerComptes dans roles.php). Chacun voit au moins son propre compte.
if ($action === 'utilisateurs' && $methode === 'GET') {
  repondre(200, ['utilisateurs' => listerComptes($db, $moi)]);
}

// Les exploitations que l'on peut ouvrir (l'administrateur voit toutes celles du serveur).
if ($action === 'exploitations' && $methode === 'GET') {
  repondre(200, ['exploitations' => listerExploitations($db, $moi)]);
}

// Déconnecter toutes les sessions (tous les comptes, tous les appareils, le sien compris) : réservé à l'administrateur.
if ($action === 'deconnecter-toutes-sessions' && $methode === 'POST') {
  if (!estAdministrateur($moi)) repondre(403, ['erreur' => 'Réservé à l’administrateur.']);
  $db->exec('DELETE FROM sessions');
  repondre(200, ['ok' => true]);
}

// Les établissements (exploitations) : l'administrateur seul les crée, les modifie et les supprime, depuis Mes établissements.
if ($action === 'creer-exploitation' && $methode === 'POST') {
  if (!estAdministrateur($moi)) repondre(403, ['erreur' => 'Réservé à l’administrateur.']);
  try {
    $cree = creerExploitation($db, (string) ($corps['etablissement'] ?? ''), (string) ($corps['nom'] ?? ''), is_array($corps['animaux'] ?? null) ? $corps['animaux'] : []);
  } catch (InvalidArgumentException $erreur) {
    repondre(400, ['erreur' => $erreur->getMessage()]);
  }
  if (!$cree) repondre(409, ['erreur' => 'Cet identifiant d’exploitation existe déjà.']);
  repondre(200, ['ok' => true]);
}

if ($action === 'modifier-exploitation' && $methode === 'POST') {
  if (!estAdministrateur($moi)) repondre(403, ['erreur' => 'Réservé à l’administrateur.']);
  try {
    $modifiee = modifierExploitation($db, (string) ($corps['etablissement'] ?? ''), (string) ($corps['nom'] ?? ''), is_array($corps['animaux'] ?? null) ? $corps['animaux'] : []);
  } catch (InvalidArgumentException $erreur) {
    repondre(400, ['erreur' => $erreur->getMessage()]);
  }
  if (!$modifiee) repondre(404, ['erreur' => 'Établissement inconnu.']);
  repondre(200, ['ok' => true]);
}

if ($action === 'supprimer-exploitation' && $methode === 'POST') {
  if (!estAdministrateur($moi)) repondre(403, ['erreur' => 'Réservé à l’administrateur.']);
  $resultat = supprimerExploitation($db, (string) ($corps['etablissement'] ?? ''));
  if ($resultat === 'introuvable') repondre(404, ['erreur' => 'Établissement inconnu.']);
  if ($resultat === 'utilisee') repondre(409, ['erreur' => 'Cet établissement contient des données ou des comptes : il ne peut pas être supprimé.']);
  repondre(200, ['ok' => true]);
}

// Donner un rôle et des exploitations à un compte (voir affecterCompte dans roles.php). L'administrateur règle tout ;
// le modérateur ne donne que « utilisateur » ou « modérateur » aux comptes qu'il voit, sans toucher aux exploitations.
if ($action === 'affecter' && $methode === 'POST') {
  $exploitations = is_array($corps['exploitations'] ?? null) ? $corps['exploitations'] : [];
  try {
    $resultat = affecterCompte($db, $moi, trim((string) ($corps['identifiant'] ?? '')), (string) ($corps['role'] ?? ''), $exploitations);
  } catch (InvalidArgumentException $erreur) {
    repondre(400, ['erreur' => $erreur->getMessage()]);
  }
  if ($resultat === 'introuvable') repondre(404, ['erreur' => 'Compte inconnu.']);
  if ($resultat === 'interdit') repondre(403, ['erreur' => 'Tu ne peux pas faire ce changement sur ce compte.']);
  repondre(200, ['ok' => true]);
}

// Changer son propre mot de passe : réservé au modérateur et à l'administrateur.
if ($action === 'mot_de_passe' && $methode === 'POST') {
  if (!estModerateur($moi)) repondre(403, ['erreur' => 'Réservé au modérateur et à l’administrateur.']);
  $resultat = changerMotDePasse($db, $moi, (string) ($corps['ancien'] ?? ''), (string) ($corps['nouveau'] ?? ''));
  if ($resultat === 'ancien_faux') repondre(403, ['erreur' => 'L’ancien mot de passe est incorrect.']);
  if ($resultat === 'trop_court') repondre(400, ['erreur' => 'Le nouveau mot de passe doit faire 9 caractères au moins.']);
  repondre(200, ['ok' => true]);
}

// Lire la sauvegarde d'une exploitation. Un utilisateur ne lit que ses exploitations.
if ($action === 'lire' && $methode === 'GET') {
  $etablissement = (string) ($_GET['etablissement'] ?? '');
  autoriseExploitation($db, $moi, $etablissement);
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
// Réservé au modérateur : un utilisateur passe par les saisies à valider (pousser).
if ($action === 'ecrire' && $methode === 'PUT') {
  if (!estModerateur($moi)) repondre(403, ['erreur' => 'Réservé au modérateur.']);
  $etablissement = (string) ($corps['etablissement'] ?? '');
  $versionAttendue = (int) ($corps['version_attendue'] ?? 0);
  $donnees = $corps['donnees'] ?? null;
  if ($etablissement === '' || !is_array($donnees)) repondre(400, ['erreur' => 'Sauvegarde incomplète.']);
  autoriseExploitation($db, $moi, $etablissement);

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

// Les fiches, une à une (voir synchro.php) : envoi des modifications, puis réception de ce qui a changé.
$etablissement = (string) ($_GET['etablissement'] ?? $corps['etablissement'] ?? '');
if (!preg_match('/^[a-z0-9_\-]{1,64}$/', $etablissement)) repondre(400, ['erreur' => 'Établissement invalide.']);
// Un utilisateur ne touche qu'à ses exploitations.
autoriseExploitation($db, $moi, $etablissement);

// Le modérateur voit et valide les saisies des utilisateurs (voir roles.php).
if ($action === 'attentes' && $methode === 'GET') {
  if (!estModerateur($moi)) repondre(403, ['erreur' => 'Réservé au modérateur.']);
  repondre(200, ['attentes' => listerAttentes($db, $etablissement)]);
}

// L'historique des décisions (validées ou refusées), pour le modérateur.
if ($action === 'attentes-historique' && $methode === 'GET') {
  if (!estModerateur($moi)) repondre(403, ['erreur' => 'Réservé au modérateur.']);
  repondre(200, ['decisions' => listerDecisions($db, $etablissement)]);
}

if ($action === 'valider' && $methode === 'POST') {
  if (!estModerateur($moi)) repondre(403, ['erreur' => 'Réservé au modérateur.']);
  repondre(200, validerAttentes($db, $etablissement, (array) ($corps['ids'] ?? []), $moi['identifiant']));
}

if ($action === 'refuser' && $methode === 'POST') {
  if (!estModerateur($moi)) repondre(403, ['erreur' => 'Réservé au modérateur.']);
  repondre(200, ['refusees' => refuserAttentes($db, $etablissement, (array) ($corps['ids'] ?? []), $moi['identifiant'])]);
}

// Les fichiers joints : envoi d'un fichier, en base64, 5 Mo au plus ; réception par son identifiant.
// Réservé au modérateur pour l'instant : les pièces d'un utilisateur attendront la validation comme les autres saisies.
if ($action === 'piece_envoyer' && $methode === 'POST') {
  if (!estModerateur($moi)) repondre(403, ['erreur' => 'Les pièces jointes ne sont pas encore ouvertes aux utilisateurs.']);
  $id = (string) ($corps['id'] ?? '');
  $extension = preg_replace('/[^a-z0-9]/', '', strtolower((string) ($corps['extension'] ?? '')));
  $mime = substr((string) ($corps['mime'] ?? 'application/octet-stream'), 0, 128);
  $contenu = base64_decode((string) ($corps['contenu'] ?? ''), true);
  if (!preg_match('/^[a-z0-9\-]{1,64}$/i', $id) || $contenu === false) repondre(400, ['erreur' => 'Fichier incomplet.']);
  if (strlen($contenu) > 5242880) repondre(413, ['erreur' => 'Fichier trop lourd (5 Mo au plus).']);
  $db->prepare(
    'INSERT INTO pieces_jointes (etablissement, id, extension, mime, taille, contenu, envoye_par) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE extension = VALUES(extension), mime = VALUES(mime), taille = VALUES(taille), contenu = VALUES(contenu), envoye_par = VALUES(envoye_par)'
  )->execute([$etablissement, $id, $extension, $mime, strlen($contenu), $contenu, $moi['identifiant']]);
  repondre(200, ['ok' => true]);
}

if ($action === 'piece_recevoir' && $methode === 'GET') {
  $id = (string) ($_GET['id'] ?? '');
  if (!preg_match('/^[a-z0-9\-]{1,64}$/i', $id)) repondre(400, ['erreur' => 'Identifiant invalide.']);
  $requete = $db->prepare('SELECT extension, mime, contenu FROM pieces_jointes WHERE etablissement = ? AND id = ?');
  $requete->execute([$etablissement, $id]);
  $ligne = $requete->fetch();
  if (!$ligne) repondre(404, ['erreur' => 'Fichier pas encore envoyé.']);
  repondre(200, ['extension' => $ligne['extension'], 'mime' => $ligne['mime'], 'contenu' => base64_encode($ligne['contenu'])]);
}

if ($action === 'pousser' && $methode === 'POST') {
  $modifications = $corps['modifications'] ?? null;
  if (!is_array($modifications)) repondre(400, ['erreur' => 'Modifications manquantes.']);
  try {
    // Un utilisateur : ses saisies attendent la validation du modérateur.
    if (!estModerateur($moi)) repondre(200, mettreEnAttente($db, $moi['identifiant'], $etablissement, $modifications));
    // Le modérateur ou l'administrateur : ses saisies en mode normal (marquées enAttente) attendent aussi une validation ; les autres entrent tout de suite.
    $enValidation = [];
    $directes = [];
    foreach ($modifications as $modification) {
      if (is_array($modification) && ($modification['enAttente'] ?? false) === true) $enValidation[] = $modification;
      else $directes[] = $modification;
    }
    $resultat = ['recu' => 0, 'en_attente' => 0, 'refusees' => []];
    if ($directes !== []) {
      $partie = pousserModifications($db, $moi['identifiant'], $etablissement, $directes);
      $resultat['recu'] += $partie['recu'];
      $resultat['refusees'] = array_merge($resultat['refusees'], $partie['refusees']);
    }
    if ($enValidation !== []) {
      $partie = mettreEnAttente($db, $moi['identifiant'], $etablissement, $enValidation);
      $resultat['en_attente'] += $partie['en_attente'];
      $resultat['refusees'] = array_merge($resultat['refusees'], $partie['refusees']);
    }
    repondre(200, $resultat);
  } catch (InvalidArgumentException $erreur) {
    repondre(400, ['erreur' => $erreur->getMessage()]);
  }
}

if ($action === 'tirer' && $methode === 'GET') {
  $depuis = max(0, (int) ($_GET['depuis'] ?? 0));
  repondre(200, tirerModifications($db, $etablissement, $depuis));
}

// L'attente : la connexion reste ouverte jusqu'à une modification de l'exploitation après le numéro « depuis » du journal, ou 25 secondes.
// L'application relance aussitôt : une modification se reçoit en une seconde environ, sans minuteur côté appareil.
if ($action === 'attendre' && $methode === 'GET') {
  $depuis = max(0, (int) ($_GET['depuis'] ?? 0));
  set_time_limit(60);
  $requete = $db->prepare('SELECT COALESCE(MAX(rang), 0) FROM journal WHERE etablissement = ?');
  $fin = time() + 25;
  do {
    $requete->execute([$etablissement]);
    $dernier = (int) $requete->fetchColumn();
    if ($dernier > $depuis) repondre(200, ['changement' => true, 'curseur' => $dernier]);
    sleep(1);
  } while (time() < $fin);
  repondre(200, ['changement' => false, 'curseur' => $depuis]);
}

repondre(404, ['erreur' => 'Action inconnue.']);
