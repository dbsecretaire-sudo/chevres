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
    'nom',
    'sexe',
    'dateNaissance',
    'mereId',
    'mereNumeroBoucle',
    'statut',
    'dateStatut',
    'renouvellement',
    'renouvellementAnnee',
    'notes',
  ],
  [CATEGORIE_STOCKAGE.VISITES_VETERINAIRE]: [
    'id',
    'espece',
    'date',
    'chevreId',
    'chevreNumeroBoucle',
    'motif',
    'description',
    'cout',
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
    'lignesAlimentation',
    'lignesMarchandises',
    'stockApplique',
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
    'sacs',
    'jeune',
    'animaux',
    'precision',
    'choixFacture',
    'numeroFacture',
  ],
  [CATEGORIE_STOCKAGE.CONTROLES]: [
    'id',
    'espece',
    'date',
    'chevreId',
    'chevreNumeroBoucle',
    'type',
    'resultat',
    'notes',
  ],
};

export const CHAMPS_NOMBRE = new Set([
  'cout',
  'montant',
  'quantite',
  'prix',
  'litrage',
  'tauxImposition',
  'tauxTva',
  'renouvellementAnnee',
  'poidsKg',
  'sacs',
  'partVenteUrssaf',
  'partHorsCaUrssaf',
]);

/** Booléens simples où "absent" et "faux" sont équivalents (pas besoin de distinguer). */
export const CHAMPS_BOOLEEN = new Set(['renouvellement', 'stockApplique', 'jeune']);

/** Booléens tri-état où "faux" doit être distingué de "non renseigné" (ex: imposable par défaut). */
export const CHAMPS_BOOLEEN_TROIS_ETATS = new Set(['imposable']);

/** Le genre d'une ligne d'alimentation qui n'est pas un aliment, dans le fichier (7e champ de la ligne). */
export const GENRE_MATERIEL = 'm';
export const GENRE_EQUIPEMENT = 'e';

export const CHAMPS_LIGNES_ALIMENTATION = new Set(['lignesAlimentation']);

export const CHAMPS_LIGNES_CARBURANT = new Set(['lignesCarburant']);

export const CHAMPS_LIGNES_MARCHANDISES = new Set(['lignesMarchandises']);

export const CATEGORIES_STOCKAGE: ValeurDe<typeof CATEGORIE_STOCKAGE>[] = [
  CATEGORIE_STOCKAGE.CHEPTEL,
  CATEGORIE_STOCKAGE.VENTES,
  CATEGORIE_STOCKAGE.FACTURES,
  CATEGORIE_STOCKAGE.VISITES_VETERINAIRE,
  CATEGORIE_STOCKAGE.CONTROLES,
];
