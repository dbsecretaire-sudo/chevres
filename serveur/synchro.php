<?php
declare(strict_types=1);

// Les fiches synchronisées, une à une : envoi des modifications, et réception de ce qui a changé depuis un numéro du journal.
// La dernière modification gagne sur la fiche touchée ; l'ancienne version reste dans l'historique. Le serveur date les modifications lui-même.

const LIMITE_MODIFICATIONS_PAR_ENVOI = 200;
const TAILLE_MAX_FICHE = 4194304; // 4 Mo par fiche
const LIMITE_LECTURE = 500;

/** Le motif du refus d'une modification, ou null si elle est correcte. */
function motifDeRefus(mixed $modification): ?string {
  if (!is_array($modification)) return 'Modification mal formée.';
  $zone = $modification['zone'] ?? null;
  $identifiant = $modification['identifiant'] ?? null;
  if (!is_string($zone) || !preg_match('/^[A-Za-z0-9_.:\-]{1,128}$/', $zone)) return 'Zone invalide.';
  if (!is_string($identifiant) || $identifiant === '' || strlen($identifiant) > 191) return 'Identifiant invalide.';
  if (!array_key_exists('contenu', $modification)) return 'Contenu manquant.';
  if ($modification['contenu'] !== null) {
    $json = json_encode($modification['contenu'], JSON_UNESCAPED_UNICODE);
    if ($json === false) return 'Contenu illisible.';
    if (strlen($json) > TAILLE_MAX_FICHE) return 'Fiche trop lourde.';
  }
  return null;
}

/**
 * Enregistre les modifications de fiches correctes. Chaque remplacement garde l'ancienne version dans l'historique.
 * Une fiche refusée (trop lourde, mal formée) n'empêche pas les autres : elle est signalée dans « refusees ».
 * Lève InvalidArgumentException seulement si l'envoi lui-même est mal formé.
 */
function pousserModifications(PDO $db, string $auteur, string $etablissement, array $modifications): array {
  if (count($modifications) > LIMITE_MODIFICATIONS_PAR_ENVOI) {
    throw new InvalidArgumentException('Trop de modifications en un seul envoi.');
  }
  $acceptees = [];
  $refusees = [];
  foreach ($modifications as $modification) {
    $motif = motifDeRefus($modification);
    if ($motif === null) {
      $acceptees[] = $modification;
    } else {
      $refusees[] = [
        'zone' => is_array($modification) && is_string($modification['zone'] ?? null) ? $modification['zone'] : '',
        'identifiant' => is_array($modification) && is_string($modification['identifiant'] ?? null) ? $modification['identifiant'] : '',
        'motif' => $motif,
      ];
    }
  }

  $db->beginTransaction();
  try {
    foreach ($acceptees as $modification) {
      $zone = $modification['zone'];
      $identifiant = $modification['identifiant'];
      $contenu = $modification['contenu'] === null ? null : json_encode($modification['contenu'], JSON_UNESCAPED_UNICODE);

      $lecture = $db->prepare('SELECT contenu, version FROM fiches WHERE etablissement = ? AND zone = ? AND identifiant = ? FOR UPDATE');
      $lecture->execute([$etablissement, $zone, $identifiant]);
      $actuelle = $lecture->fetch();

      if ($actuelle) {
        $db->prepare(
          'INSERT INTO historique_fiches (etablissement, zone, identifiant, contenu, version, remplacee_le, remplacee_par)
           VALUES (?, ?, ?, ?, ?, NOW(3), ?)'
        )->execute([$etablissement, $zone, $identifiant, $actuelle['contenu'], $actuelle['version'], $auteur]);
        $db->prepare(
          'UPDATE fiches SET contenu = ?, version = ?, modifie_le = NOW(3), modifie_par = ?
           WHERE etablissement = ? AND zone = ? AND identifiant = ?'
        )->execute([$contenu, (int) $actuelle['version'] + 1, $auteur, $etablissement, $zone, $identifiant]);
      } else {
        $db->prepare(
          'INSERT INTO fiches (etablissement, zone, identifiant, contenu, version, modifie_le, modifie_par)
           VALUES (?, ?, ?, ?, 1, NOW(3), ?)'
        )->execute([$etablissement, $zone, $identifiant, $contenu, $auteur]);
      }

      $db->prepare('INSERT INTO journal (etablissement, zone, identifiant) VALUES (?, ?, ?)')
        ->execute([$etablissement, $zone, $identifiant]);
    }
    $db->commit();
  } catch (Throwable $erreur) {
    $db->rollBack();
    throw $erreur;
  }
  return ['recu' => count($acceptees), 'refusees' => $refusees];
}

/**
 * Rend les changements survenus après le numéro « depuis » du journal, dans l'ordre, avec la version actuelle de chaque fiche.
 * « curseur » est le numéro à demander la fois suivante ; « encore » dit s'il reste des changements à récupérer.
 */
function tirerModifications(PDO $db, string $etablissement, int $depuis): array {
  $requete = $db->prepare(
    'SELECT j.rang, j.zone, j.identifiant, f.contenu, f.version, f.modifie_le, f.modifie_par
     FROM journal j
     LEFT JOIN fiches f ON f.etablissement = j.etablissement AND f.zone = j.zone AND f.identifiant = j.identifiant
     WHERE j.etablissement = ? AND j.rang > ?
     ORDER BY j.rang
     LIMIT ' . LIMITE_LECTURE
  );
  $requete->execute([$etablissement, $depuis]);

  $modifications = [];
  $curseur = $depuis;
  foreach ($requete->fetchAll() as $ligne) {
    $curseur = (int) $ligne['rang'];
    $modifications[] = [
      'rang' => $curseur,
      'zone' => $ligne['zone'],
      'identifiant' => $ligne['identifiant'],
      'contenu' => $ligne['contenu'] === null ? null : json_decode($ligne['contenu'], true),
      'version' => (int) $ligne['version'],
      'modifie_le' => $ligne['modifie_le'],
      'modifie_par' => $ligne['modifie_par'],
    ];
  }
  return [
    'modifications' => $modifications,
    'curseur' => $curseur,
    'encore' => count($modifications) === LIMITE_LECTURE,
  ];
}
