import { CATEGORIE_CLIENT } from '@/shared/constants/clients';
import { CATEGORIE_DEPENSE, CATEGORIE_RECETTE, CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';
import { ROUTES } from '@/shared/constants/routes';
import { SECTION_STOCK } from '@/shared/constants/stock';

/**
 * Les lieux de la carte de la ferme qui ont un tiers (un fournisseur, un client ou un organisme) : chacun a sa page — les contacts du
 * lieu, les factures qui le concernent, et les rubriques de l'application qui s'y rattachent. Ici la configuration, sans rien d'affichage ;
 * les textes sont dans `TEXTES.production.lieux`.
 */
export type CleLieuTiers = 'aliments' | 'carburant' | 'veterinaire' | 'organismes' | 'equarrissage' | 'abattoir' | 'boucherie';

export interface LienDuLieu {
  /** La clé de ses textes (`TEXTES.production.lieux[lieu].liens[cle]`). */
  cle: string;
  icone: 'cube' | 'nutrition' | 'medkit' | 'document-text' | 'time' | 'business' | 'receipt' | 'flask' | 'restaurant' | 'notifications' | 'list';
  route: string;
}

export interface ConfigLieuTiers {
  cle: CleLieuTiers;
  /** Son dessin sur la carte (un emoji). */
  emoji: string;
  /** Les identifiants de catégories de contact dont les fiches sont les tiers du lieu. */
  categoriesContact: readonly string[];
  /** Les écritures du lieu : les factures de ces catégories (dépense ou recette), les ventes de ces catégories, et celles de ses tiers. */
  categoriesFacture: readonly string[];
  categoriesVente: readonly string[];
  /** Où ouvrir « Nouvelle facture » : une facture reçue (achat) ou émise (vente), déjà dans la bonne catégorie. */
  nouvelle: string;
  liens: readonly LienDuLieu[];
}

const NOUVELLE = ROUTES.COMPTABILITE_NOUVELLE;
const stock = (section: string) => `${ROUTES.COMPTABILITE_STOCKS}?onglet=${section}`;

export const LIEUX_TIERS: Record<CleLieuTiers, ConfigLieuTiers> = {
  aliments: {
    cle: 'aliments',
    emoji: '🌾🌽',
    categoriesContact: [CATEGORIE_FOURNISSEUR.ALIMENTS],
    categoriesFacture: [CATEGORIE_DEPENSE.ALIMENTATION],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.ALIMENTATION}`,
    liens: [
      { cle: 'stock', icone: 'cube', route: stock(SECTION_STOCK.ALIMENTS) },
      { cle: 'alimentation', icone: 'nutrition', route: ROUTES.SANTE_ALIMENTATION },
    ],
  },
  carburant: {
    cle: 'carburant',
    emoji: '⛽',
    categoriesContact: [CATEGORIE_FOURNISSEUR.CARBURANT],
    categoriesFacture: [CATEGORIE_DEPENSE.CARBURANT],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.CARBURANT}`,
    liens: [],
  },
  veterinaire: {
    cle: 'veterinaire',
    emoji: '🩺',
    categoriesContact: [CATEGORIE_FOURNISSEUR.VETERINAIRE],
    categoriesFacture: [CATEGORIE_DEPENSE.VETERINAIRE],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.VETERINAIRE}`,
    liens: [{ cle: 'traitements', icone: 'medkit', route: ROUTES.CHEPTEL_TRAITEMENTS }],
  },
  organismes: {
    cle: 'organismes',
    emoji: '🏛️',
    categoriesContact: [
      CATEGORIE_FOURNISSEUR.ORGANISME,
      CATEGORIE_FOURNISSEUR.CHAMBRE_AGRICULTURE,
      CATEGORIE_FOURNISSEUR.GROUPEMENT,
      CATEGORIE_FOURNISSEUR.GROUPEMENT_SANITAIRE,
      CATEGORIE_CLIENT.ORGANISME,
    ],
    categoriesFacture: [CATEGORIE_RECETTE.AIDE],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=emise&categorie=${CATEGORIE_RECETTE.AIDE}`,
    liens: [{ cle: 'dossierPac', icone: 'document-text', route: ROUTES.CHEPTEL_DOSSIER_PAC }],
  },
  equarrissage: {
    cle: 'equarrissage',
    emoji: '🚛',
    categoriesContact: [CATEGORIE_FOURNISSEUR.EQUARRISSAGE],
    categoriesFacture: [],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.AUTRE}`,
    liens: [
      { cle: 'bordereaux', icone: 'document-text', route: ROUTES.CHEPTEL_DOSSIER_PAC },
      { cle: 'historique', icone: 'time', route: ROUTES.CHEPTEL_HISTORIQUE },
    ],
  },
  abattoir: {
    cle: 'abattoir',
    emoji: '🏭',
    categoriesContact: [CATEGORIE_FOURNISSEUR.ABATTOIR],
    categoriesFacture: [CATEGORIE_DEPENSE.ANIMAUX_VIVANTS_VENTE],
    categoriesVente: [CATEGORIE_VENTE.VIANDE],
    nouvelle: `${NOUVELLE}?type=emise&categorie=${CATEGORIE_RECETTE.VIANDE}`,
    liens: [
      { cle: 'lots', icone: 'business', route: ROUTES.PRODUCTION_VIANDE },
      { cle: 'afacturer', icone: 'receipt', route: `${ROUTES.PRODUCTION_VIANDE}?onglet=afacturer` },
      { cle: 'stock', icone: 'cube', route: stock(SECTION_STOCK.VIANDE) },
    ],
  },
  boucherie: {
    cle: 'boucherie',
    emoji: '🥩',
    categoriesContact: [],
    categoriesFacture: [],
    categoriesVente: [CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE],
    nouvelle: `${NOUVELLE}?type=emise&categorie=${CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE}`,
    liens: [
      { cle: 'stock', icone: 'cube', route: stock(SECTION_STOCK.VIANDE) },
      { cle: 'charcuterie', icone: 'restaurant', route: ROUTES.PRODUCTION_CHARCUTERIE },
      { cle: 'fabrication', icone: 'flask', route: ROUTES.productionFabrication('charcuterie') },
      { cle: 'rappels', icone: 'notifications', route: ROUTES.PRODUCTION_RAPPELS_LOTS },
    ],
  },
};

export const estLieuTiers = (cle: string | undefined): cle is CleLieuTiers => !!cle && cle in LIEUX_TIERS;

/** Les écritures d'un lieu : celles de ses catégories (factures ou ventes) et celles de ses tiers (le nom du tiers sur l'écriture). */
export function ecrituresDuLieu<T extends { titre: string; categorie?: string; libelleCategorie?: string }>(
  config: Pick<ConfigLieuTiers, 'categoriesFacture' | 'categoriesVente'>,
  ecritures: readonly T[],
  nomsDesTiers: readonly string[],
  libelleDeVente: (categorie: string) => string,
): T[] {
  const noms = new Set(nomsDesTiers.map((n) => n.trim().toLowerCase()).filter(Boolean));
  const libellesDeVente = new Set(config.categoriesVente.map(libelleDeVente));
  return ecritures.filter(
    (e) =>
      (e.categorie !== undefined && config.categoriesFacture.includes(e.categorie)) ||
      (e.libelleCategorie !== undefined && libellesDeVente.has(e.libelleCategorie)) ||
      noms.has(e.titre.trim().toLowerCase()),
  );
}
