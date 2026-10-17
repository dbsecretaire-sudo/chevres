import type { ValeurDe } from '@/shared/constants/valeurDe';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';

/** Format des fichiers CSV synchronisés avec Drive : colonnes, types de champs et séparateurs — à modifier ici uniquement. */

export const EXTENSION_CSV = '.csv';

/** Séparateur des lignes d'une même facture (aliments/carburants) dans une cellule. */
export const SEPARATEUR_LIGNES = '|';
/** Séparateur des champs d'une ligne dans une cellule. */
export const SEPARATEUR_CHAMPS = ':';
export const CSV_OUI = 'oui';
export const CSV_NON = 'non';

export const COLONNES_CSV: Record<ValeurDe<typeof CATEGORIE_STOCKAGE>, string[]> = {
  [CATEGORIE_STOCKAGE.CHEPTEL]: [
    'id',
    'espece',
    'numeroBoucle',
    'dateBouclage',
    'numeroBoucleRouge',
    'dateBoucleRouge',
    'dateRebouclage',
    'nom',
    'sexe',
    'dateNaissance',
    'mereId',
    'mereNumeroBoucle',
    'statut',
    'dateStatut',
    'renouvellement',
    'renouvellementAnnee',
    'poidsKg',
    'notes',
    // Réservé pour un client (le client, son bon de commande, vivants ou morts) : en JSON dans sa cellule.
    'reservation',
  ],
  [CATEGORIE_STOCKAGE.VISITES_VETERINAIRE]: [
    'id',
    'espece',
    'date',
    'chevreId',
    'chevreNumeroBoucle',
    'lotId',
    'motif',
    'description',
    'cout',
    'fichiers',
    'factureId',
    'rapportEssais',
    'numeroRapport',
  ],
  [CATEGORIE_STOCKAGE.TRAITEMENTS]: [
    'id',
    'espece',
    'date',
    'dateFin',
    'produit',
    'motif',
    'chevreNumeroBoucle',
    'lotId',
    'delaiLaitJours',
    'delaiViandeJours',
    'notes',
    'fichiers',
  ],
  [CATEGORIE_STOCKAGE.FACTURES]: [
    'id',
    'date',
    'activite',
    'type',
    'tiers',
    'description',
    'montant',
    'categorieDepense',
    'atelier',
    'payee',
    'echeance',
    'datePaiement',
    'lignesAlimentation',
    'lignesMarchandises',
    'lignesProduction',
    'lignesChambre',
    'elementAgri',
    'stockApplique',
    'stockArticle',
    'stockQuantite',
    'bouclesDebut',
    'motifVisite',
    'visiteVeterinaire',
    'litrage',
    'typeCarburant',
    'lignesCarburant',
    'categorieRecette',
    'imposable',
    'typeAide',
    'typeAideLibre',
    'tauxImposition',
    'compteManuel',
    'natureUrssaf',
    'partVenteUrssaf',
    'partHorsCaUrssaf',
    'tauxTva',
    'sansFacture',
  ],
  [CATEGORIE_STOCKAGE.VENTES]: [
    'id',
    'activite',
    'date',
    'categorie',
    'typeFromage',
    'typeFromageLibre',
    'quantite',
    'unite',
    'prix',
    'tauxTva',
    'client',
    'poidsKg',
    'jeune',
    'animaux',
    'fromages',
    'dateAbattoir',
    'precision',
    'choixFacture',
    'numeroFacture',
    'reajustement',
    'payee',
    'echeance',
    'datePaiement',
    'circuit',
    'commandeId',
    'fraisAbattoir',
    'tauxTvaFrais',
    // Vente de viande : vivants ou morts à la remise ; vente offerte au client.
    'etatAnimaux',
    'offert',
  ],
  [CATEGORIE_STOCKAGE.CONTROLES]: [
    'id',
    'famille',
    'espece',
    'date',
    'chevreId',
    'chevreNumeroBoucle',
    'type',
    'typeDocument',
    'resultat',
    'notes',
    'fichiers',
    'surfaceGraphique',
    'surfaceAdmissible',
    'surfaceFourragere',
    'surfaceIrriguee',
    'codeCulture',
    'zoneIchn',
    'matiereGrasse',
    'matiereProteique',
    'antibiotique',
    'floreTotale',
    'floreTotaleGrade',
    'cellules',
    'butyriques',
    'cryoscopie',
    'cryoscopieGrade',
    'lipolyse',
    'staphylocoques',
    'coliformes',
    'coliformesGrade',
    'ecoli',
    'pseudomonas',
    'uree',
    'igg',
    'contenus',
  ],
};

export const CHAMPS_NOMBRE = new Set([
  'fraisAbattoir',
  'tauxTvaFrais',
  'cout',
  'delaiLaitJours',
  'delaiViandeJours',
  'montant',
  'quantite',
  'prix',
  'litrage',
  'tauxImposition',
  'tauxTva',
  'renouvellementAnnee',
  'poidsKg',
  'partVenteUrssaf',
  'partHorsCaUrssaf',
  'stockQuantite',
  'surfaceGraphique',
  'surfaceAdmissible',
  'surfaceFourragere',
  'surfaceIrriguee',
  'matiereGrasse',
  'matiereProteique',
  'floreTotale',
  'cellules',
  'butyriques',
  'cryoscopie',
  'lipolyse',
  'staphylocoques',
  'coliformes',
  'ecoli',
  'pseudomonas',
  'uree',
  'igg',
]);

/** Booléens simples où "absent" et "faux" sont équivalents (pas besoin de distinguer). */
export const CHAMPS_BOOLEEN = new Set([
  'renouvellement',
  'stockApplique',
  'jeune',
  'visiteVeterinaire',
  'reajustement',
  'rapportEssais',
  'offert',
]);

/** Booléens tri-état où "faux" doit être distingué de "non renseigné" (ex: imposable par défaut). */
export const CHAMPS_BOOLEEN_TROIS_ETATS = new Set(['imposable', 'payee']);

/** Le genre d'une ligne d'alimentation qui n'est pas un aliment, dans le fichier (7e champ de la ligne). */
export const GENRE_MATERIEL = 'm';
export const GENRE_EQUIPEMENT = 'e';

export const CHAMPS_LIGNES_ALIMENTATION = new Set(['lignesAlimentation']);

export const CHAMPS_LIGNES_CARBURANT = new Set(['lignesCarburant']);

/** Les fichiers joints d'un contrôle : id, nom, extension, type et date d'ajout de chacun. */
export const CHAMPS_FICHIERS = new Set(['fichiers']);

/** Les champs écrits tels quels en JSON dans leur cellule (les contenus d'un groupement, avec leurs fichiers). */
export const CHAMPS_JSON = new Set(['contenus', 'lignesProduction', 'lignesChambre', 'reservation']);

export const CHAMPS_LIGNES_MARCHANDISES = new Set(['lignesMarchandises']);

export const CATEGORIES_STOCKAGE: ValeurDe<typeof CATEGORIE_STOCKAGE>[] = [
  CATEGORIE_STOCKAGE.CHEPTEL,
  CATEGORIE_STOCKAGE.VENTES,
  CATEGORIE_STOCKAGE.FACTURES,
  CATEGORIE_STOCKAGE.VISITES_VETERINAIRE,
  CATEGORIE_STOCKAGE.TRAITEMENTS,
  CATEGORIE_STOCKAGE.CONTROLES,
];
