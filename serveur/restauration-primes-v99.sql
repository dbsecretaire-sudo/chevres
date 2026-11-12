-- Restauration des primes prévisionnelles (zone « troupeau:v1:primes-previsionnelles ») :
-- on remet la version 99 (celle qui contient les taux), et on garde les effectifs déclarés de la version actuelle (100).
-- À exécuter une fois, dans phpMyAdmin, base prontabchevres, dans l'ordre (les quatre requêtes).

-- 1. Sauvegarder la version actuelle dans l'historique, avant de la remplacer.
INSERT INTO historique_fiches (etablissement, zone, identifiant, contenu, version, remplacee_le, remplacee_par)
SELECT etablissement, zone, identifiant, contenu, version, NOW(3), 'restauration-v99'
FROM fiches
WHERE zone = 'troupeau:v1:primes-previsionnelles';

-- 2. Remettre la version 99, en gardant les effectifs déclarés actuels.
UPDATE fiches f
JOIN historique_fiches h
  ON h.etablissement = f.etablissement AND h.zone = f.zone AND h.identifiant = f.identifiant AND h.version = 99
SET f.contenu = JSON_SET(h.contenu, '$.effectifsDeclares', JSON_EXTRACT(f.contenu, '$.effectifsDeclares')),
    f.version = f.version + 1,
    f.modifie_le = NOW(3),
    f.modifie_par = 'restauration-v99'
WHERE f.zone = 'troupeau:v1:primes-previsionnelles';

-- 3. Signaler le changement aux appareils, pour qu'ils reçoivent la version restaurée.
INSERT INTO journal (etablissement, zone, identifiant)
SELECT etablissement, zone, identifiant
FROM fiches
WHERE zone = 'troupeau:v1:primes-previsionnelles';

-- 4. Vérifier : la version doit être la 101, avec les taux (144.52) et l'effectif de 2025.
SELECT version, modifie_par,
       LOCATE('144.52', contenu) AS taux_present,
       JSON_EXTRACT(contenu, '$.effectifsDeclares') AS effectifs_declares
FROM fiches
WHERE zone = 'troupeau:v1:primes-previsionnelles';
