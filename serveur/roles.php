<?php
declare(strict_types=1);

// Les rôles et les exploitations. Trois rôles : l'administrateur voit tout (tous les comptes, toutes les exploitations) ; le modérateur
// valide les saisies de ses exploitations et gère les comptes qui les partagent ; l'utilisateur ne fait que des saisies, qui attendent
// la validation. Un compte est relié à une ou plusieurs exploitations (table acces_exploitations, voir schema-acces.sql).
// Chargé par index.php, après synchro.php (qui fournit motifDeRefus et pousserModifications).

const ROLE_ADMINISTRATEUR = 'administrateur';
const ROLE_MODERATEUR = 'moderateur';
const ROLE_UTILISATEUR = 'utilisateur';
const LIMITE_ATTENTES = 500;
const MOT_DE_PASSE_MINIMUM = 9;

/** Vrai pour l'administrateur. */
function estAdministrateur(array $moi): bool {
  return ($moi['role'] ?? '') === ROLE_ADMINISTRATEUR;
}

/** Vrai pour le modérateur et l'administrateur : ceux qui valident et gèrent. Un rôle inconnu n'a aucun de ces droits. */
function estModerateur(array $moi): bool {
  return estAdministrateur($moi) || ($moi['role'] ?? '') === ROLE_MODERATEUR;
}

/** Les exploitations d'un compte, par son identifiant. */
function exploitationsDe(PDO $db, int $utilisateurId): array {
  $requete = $db->prepare('SELECT etablissement FROM acces_exploitations WHERE utilisateur_id = ? ORDER BY etablissement');
  $requete->execute([$utilisateurId]);
  return array_column($requete->fetchAll(), 'etablissement');
}

/** L'administrateur accède à tout ; les autres seulement aux exploitations qui leur sont ouvertes : sinon, refus (403). */
function autoriseExploitation(PDO $db, array $moi, string $etablissement): void {
  if (estAdministrateur($moi)) return;
  if (!in_array($etablissement, exploitationsDe($db, (int) $moi['id']), true)) {
    repondre(403, ['erreur' => 'Cette exploitation ne t’est pas ouverte.']);
  }
}

/** Les modifications d'un utilisateur ne sont pas enregistrées : elles attendent la validation. Les fiches correctes entrent dans la
 * file, les autres sont signalées dans « refusees ». Lève InvalidArgumentException si l'envoi est mal formé. */
function mettreEnAttente(PDO $db, string $auteur, string $etablissement, array $modifications): array {
  if (count($modifications) > LIMITE_MODIFICATIONS_PAR_ENVOI) {
    throw new InvalidArgumentException('Trop de modifications en un seul envoi.');
  }
  $refusees = [];
  $nombre = 0;
  $db->beginTransaction();
  try {
    foreach ($modifications as $modification) {
      $motif = motifDeRefus($modification);
      if ($motif !== null) {
        $refusees[] = [
          'zone' => is_array($modification) && is_string($modification['zone'] ?? null) ? $modification['zone'] : '',
          'identifiant' => is_array($modification) && is_string($modification['identifiant'] ?? null) ? $modification['identifiant'] : '',
          'motif' => $motif,
        ];
        continue;
      }
      $contenu = $modification['contenu'] === null ? null : json_encode($modification['contenu'], JSON_UNESCAPED_UNICODE);
      $db->prepare('INSERT INTO attentes_validation (etablissement, zone, identifiant, contenu, auteur) VALUES (?, ?, ?, ?, ?)')
        ->execute([$etablissement, $modification['zone'], $modification['identifiant'], $contenu, $auteur]);
      $nombre++;
    }
    $db->commit();
  } catch (Throwable $erreur) {
    $db->rollBack();
    throw $erreur;
  }
  return ['recu' => 0, 'en_attente' => $nombre, 'refusees' => $refusees];
}

/** Les saisies en attente d'une exploitation, de la plus ancienne à la plus récente. */
function listerAttentes(PDO $db, string $etablissement): array {
  // « actuel » : la fiche telle qu'elle est maintenant sur le serveur, pour dire ce que la saisie change (null : fiche absente ou supprimée).
  $requete = $db->prepare(
    'SELECT a.id, a.zone, a.identifiant, a.contenu, a.auteur, a.cree_le, f.contenu AS actuel
     FROM attentes_validation a
     LEFT JOIN fiches f ON f.etablissement = a.etablissement AND f.zone = a.zone AND f.identifiant = a.identifiant
     WHERE a.etablissement = ? ORDER BY a.id LIMIT ' . LIMITE_ATTENTES
  );
  $requete->execute([$etablissement]);
  return array_map(
    static fn(array $ligne): array => [
      'id' => (int) $ligne['id'],
      'zone' => $ligne['zone'],
      'identifiant' => $ligne['identifiant'],
      'contenu' => $ligne['contenu'] === null ? null : json_decode($ligne['contenu'], true),
      'actuel' => $ligne['actuel'] === null ? null : json_decode($ligne['actuel'], true),
      'auteur' => $ligne['auteur'],
      'cree_le' => $ligne['cree_le'],
    ],
    $requete->fetchAll(),
  );
}

/** Les numéros d'attente (entiers positifs) d'une liste reçue. */
function numerosAttente(array $ids): array {
  return array_values(array_filter(array_map('intval', $ids), static fn(int $id): bool => $id > 0));
}

/** Valide des saisies : chacune entre dans les données, au nom de son auteur, puis sort de la file. Une saisie refusée reste en attente. */
function validerAttentes(PDO $db, string $etablissement, array $ids): array {
  $ids = numerosAttente($ids);
  if ($ids === []) return ['validees' => 0, 'refusees' => []];
  $marques = implode(',', array_fill(0, count($ids), '?'));
  $requete = $db->prepare(
    "SELECT id, zone, identifiant, contenu, auteur FROM attentes_validation WHERE etablissement = ? AND id IN ($marques) ORDER BY id"
  );
  $requete->execute([$etablissement, ...$ids]);
  $validees = 0;
  $refusees = [];
  foreach ($requete->fetchAll() as $ligne) {
    $modification = [
      'zone' => $ligne['zone'],
      'identifiant' => $ligne['identifiant'],
      'contenu' => $ligne['contenu'] === null ? null : json_decode($ligne['contenu'], true),
    ];
    $resultat = pousserModifications($db, $ligne['auteur'], $etablissement, [$modification]);
    if ($resultat['recu'] === 1) {
      $db->prepare('DELETE FROM attentes_validation WHERE id = ?')->execute([(int) $ligne['id']]);
      $validees++;
    } else {
      $refusees = array_merge($refusees, $resultat['refusees']);
    }
  }
  return ['validees' => $validees, 'refusees' => $refusees];
}

/** Refuse des saisies : elles sortent de la file sans entrer dans les données. Rend leur nombre. */
function refuserAttentes(PDO $db, string $etablissement, array $ids): int {
  $ids = numerosAttente($ids);
  if ($ids === []) return 0;
  $marques = implode(',', array_fill(0, count($ids), '?'));
  $db->beginTransaction();
  try {
    $lecture = $db->prepare("SELECT zone, identifiant FROM attentes_validation WHERE etablissement = ? AND id IN ($marques)");
    $lecture->execute([$etablissement, ...$ids]);
    $refusees = $lecture->fetchAll();
    $requete = $db->prepare("DELETE FROM attentes_validation WHERE etablissement = ? AND id IN ($marques)");
    $requete->execute([$etablissement, ...$ids]);
    // Le journal signale la fiche aux appareils : ils reprennent la version du serveur, sans la saisie refusée (qui ne doit pas rester chez eux).
    $journal = $db->prepare('INSERT INTO journal (etablissement, zone, identifiant) VALUES (?, ?, ?)');
    foreach ($refusees as $ligne) {
      $journal->execute([$etablissement, $ligne['zone'], $ligne['identifiant']]);
    }
    $db->commit();
    return count($refusees);
  } catch (Throwable $erreur) {
    $db->rollBack();
    throw $erreur;
  }
}

/** Tous les comptes, avec leur rôle et leurs exploitations. */
function tousLesComptes(PDO $db): array {
  $comptes = $db->query('SELECT id, identifiant, role FROM utilisateurs ORDER BY identifiant')->fetchAll();
  return array_map(static function (array $compte) use ($db): array {
    return [
      'id' => (int) $compte['id'],
      'identifiant' => $compte['identifiant'],
      'role' => $compte['role'],
      'exploitations' => exploitationsDe($db, (int) $compte['id']),
    ];
  }, $comptes);
}

/**
 * Les comptes que ce compte voit : l'administrateur tous ; le modérateur lui-même et les modérateurs et utilisateurs de ses exploitations ;
 * l'utilisateur seulement lui-même. Triés par identifiant.
 */
function listerComptes(PDO $db, array $moi): array {
  $visibles = [];
  foreach (tousLesComptes($db) as $compte) {
    if (compteVisible($moi, $compte)) {
      unset($compte['id']);
      $visibles[] = $compte;
    }
  }
  return $visibles;
}

/**
 * Les exploitations (établissements) avec leur nom et leurs animaux : l'administrateur voit toutes celles du serveur ; les autres, les leurs.
 * Elles se créent, se modifient et se suppriment dans Mes établissements, par l'administrateur seul.
 */
function listerExploitations(PDO $db, array $moi): array {
  $visibles = estAdministrateur($moi) ? null : ($moi['exploitations'] ?? []);
  $sortie = [];
  foreach ($db->query('SELECT etablissement, nom, animaux FROM exploitations ORDER BY etablissement')->fetchAll() as $ligne) {
    if ($visibles !== null && !in_array($ligne['etablissement'], $visibles, true)) continue;
    $sortie[] = [
      'etablissement' => $ligne['etablissement'],
      'nom' => $ligne['nom'] ?? $ligne['etablissement'],
      'animaux' => $ligne['animaux'] ? explode(',', $ligne['animaux']) : [],
    ];
  }
  return $sortie;
}

/** Les espèces d'une exploitation, en texte : des mots simples, sans doublon, séparés par des virgules. */
function animauxEnTexte(array $animaux): string {
  $propres = [];
  foreach ($animaux as $animal) {
    $mot = is_string($animal) ? strtolower(trim($animal)) : '';
    if (preg_match('/^[a-z]{1,30}$/', $mot) === 1 && !in_array($mot, $propres, true)) $propres[] = $mot;
  }
  return implode(',', $propres);
}

/** Vrai si l'exploitation existe. */
function exploitationExiste(PDO $db, string $etablissement): bool {
  $requete = $db->prepare('SELECT 1 FROM exploitations WHERE etablissement = ?');
  $requete->execute([$etablissement]);
  return $requete->fetchColumn() !== false;
}

/** Crée une exploitation. Rend false si son identifiant existe déjà ; lève InvalidArgumentException si la demande est mal formée. */
function creerExploitation(PDO $db, string $etablissement, string $nom, array $animaux): bool {
  if (!preg_match('/^[a-z0-9_\-]{1,64}$/', $etablissement)) throw new InvalidArgumentException('Identifiant d’exploitation invalide.');
  $nom = trim($nom);
  if ($nom === '' || strlen($nom) > 128) throw new InvalidArgumentException('Le nom de l’exploitation est obligatoire (128 caractères au plus).');
  if (exploitationExiste($db, $etablissement)) return false;
  $db->prepare('INSERT INTO exploitations (etablissement, nom, animaux) VALUES (?, ?, ?)')
    ->execute([$etablissement, $nom, animauxEnTexte($animaux) ?: null]);
  return true;
}

/** Modifie le nom et les espèces d'une exploitation. Rend false si elle n'existe pas. */
function modifierExploitation(PDO $db, string $etablissement, string $nom, array $animaux): bool {
  $nom = trim($nom);
  if ($nom === '' || strlen($nom) > 128) throw new InvalidArgumentException('Le nom de l’exploitation est obligatoire (128 caractères au plus).');
  if (!exploitationExiste($db, $etablissement)) return false;
  $db->prepare('UPDATE exploitations SET nom = ?, animaux = ? WHERE etablissement = ?')
    ->execute([$nom, animauxEnTexte($animaux) ?: null, $etablissement]);
  return true;
}

/**
 * Supprime une exploitation. Rend 'ok', 'introuvable', ou 'utilisee' quand elle a encore des données ou des comptes (la base le refuse).
 */
function supprimerExploitation(PDO $db, string $etablissement): string {
  if (!exploitationExiste($db, $etablissement)) return 'introuvable';
  try {
    $db->prepare('DELETE FROM exploitations WHERE etablissement = ?')->execute([$etablissement]);
  } catch (PDOException $erreur) {
    if ($erreur->getCode() === '23000') return 'utilisee';
    throw $erreur;
  }
  return 'ok';
}

/** Vrai si le compte « cible » (avec ses exploitations) est visible par « moi ». */
function compteVisible(array $moi, array $cible): bool {
  if ($cible['identifiant'] === $moi['identifiant']) return true;
  if (estAdministrateur($moi)) return true;
  if (($moi['role'] ?? '') !== ROLE_MODERATEUR) return false;
  if (!in_array($cible['role'], [ROLE_MODERATEUR, ROLE_UTILISATEUR], true)) return false;
  return count(array_intersect($cible['exploitations'], $moi['exploitations'] ?? [])) > 0;
}

/**
 * Donne un rôle et des exploitations à un compte. L'administrateur règle tout. Le modérateur ne gère que les comptes visibles pour lui,
 * ne leur donne que « utilisateur » ou « modérateur », et ne touche pas à leurs exploitations.
 * Rend 'ok', 'introuvable' ou 'interdit' ; lève InvalidArgumentException si la demande est mal formée.
 */
function affecterCompte(PDO $db, array $moi, string $identifiant, string $role, array $exploitations): string {
  if (!in_array($role, [ROLE_ADMINISTRATEUR, ROLE_MODERATEUR, ROLE_UTILISATEUR], true)) {
    throw new InvalidArgumentException('Rôle inconnu.');
  }
  $cible = null;
  foreach (tousLesComptes($db) as $compte) {
    if ($compte['identifiant'] === $identifiant) $cible = $compte;
  }
  if ($cible === null) return 'introuvable';
  if (!compteVisible($moi, $cible)) return 'interdit';

  if (!estAdministrateur($moi)) {
    // Personne ne s'accorde un rôle plus élevé que le sien : l'utilisateur ne donne que « utilisateur » (à lui-même).
    $permis = estModerateur($moi) ? [ROLE_UTILISATEUR, ROLE_MODERATEUR] : [ROLE_UTILISATEUR];
    if (!in_array($role, $permis, true)) return 'interdit';
    $db->prepare('UPDATE utilisateurs SET role = ? WHERE id = ?')->execute([$role, $cible['id']]);
    return 'ok';
  }

  // L'administrateur voit tout : il n'a pas d'exploitation à lui. Les autres ont au moins une exploitation.
  $exploitations = array_values(array_unique(array_filter($exploitations, static fn($e): bool => is_string($e) && $e !== '')));
  foreach ($exploitations as $etablissement) {
    if (!preg_match('/^[a-z0-9_\-]{1,64}$/', $etablissement)) throw new InvalidArgumentException('Exploitation invalide.');
  }
  if ($role !== ROLE_ADMINISTRATEUR && $exploitations === []) {
    throw new InvalidArgumentException('Un compte qui n’est pas administrateur a besoin d’une exploitation.');
  }
  // Une exploitation doit déjà exister (elle se crée d'abord dans Mes établissements) : on vérifie avant de toucher aux accès.
  if ($role !== ROLE_ADMINISTRATEUR) {
    foreach ($exploitations as $etablissement) {
      if (!exploitationExiste($db, $etablissement)) {
        throw new InvalidArgumentException('L’exploitation « ' . $etablissement . ' » n’existe pas : crée-la d’abord dans Mes établissements.');
      }
    }
  }
  $db->prepare('UPDATE utilisateurs SET role = ? WHERE id = ?')->execute([$role, $cible['id']]);
  $db->prepare('DELETE FROM acces_exploitations WHERE utilisateur_id = ?')->execute([$cible['id']]);
  if ($role !== ROLE_ADMINISTRATEUR) {
    $ajout = $db->prepare('INSERT INTO acces_exploitations (utilisateur_id, etablissement) VALUES (?, ?)');
    foreach ($exploitations as $etablissement) $ajout->execute([$cible['id'], $etablissement]);
  }
  return 'ok';
}

/** Change le mot de passe de son propre compte, après vérification de l'ancien. Rend 'ok', 'ancien_faux' ou 'trop_court'. */
function changerMotDePasse(PDO $db, array $moi, string $ancien, string $nouveau): string {
  if (strlen($nouveau) < MOT_DE_PASSE_MINIMUM) return 'trop_court';
  $requete = $db->prepare('SELECT mot_de_passe_hash FROM utilisateurs WHERE id = ?');
  $requete->execute([(int) $moi['id']]);
  $ligne = $requete->fetch();
  if (!$ligne || !password_verify($ancien, $ligne['mot_de_passe_hash'])) return 'ancien_faux';
  $db->prepare('UPDATE utilisateurs SET mot_de_passe_hash = ? WHERE id = ?')
    ->execute([password_hash($nouveau, PASSWORD_DEFAULT), (int) $moi['id']]);
  return 'ok';
}
