import type { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

/**
 * Les zones qui ouvrent un écran « terrain » : l'enclos (le troupeau), le travail du produit (l'atelier), la page des fabrications que l'atelier ouvre
 * (« Fabriquer » : les quatre produits), et l'agritourisme (l'accueil du public).
 */
export type ZoneTerrain = 'troupeau' | 'atelier' | 'fabriquer' | 'accueil';

export const ZONES_TERRAIN: readonly ZoneTerrain[] = ['troupeau', 'atelier', 'fabriquer', 'accueil'];

/** Un grand bouton de l'écran terrain : une seule action, lisible avec des gants. */
export interface TuileTerrain {
  cle: string;
  titre: string;
  icone: keyof typeof Ionicons.glyphMap;
  /** Quand il est donné, le dessin vient de cette famille et remplace `icone`. */
  iconeMci?: keyof typeof MaterialCommunityIcons.glyphMap;
  route: string;
  /** Le chiffre utile affiché sur le bouton (les animaux, les visites à venir…). */
  nombre?: number;
  /** Le chiffre est une alerte (à faire, qui manque) : il s'écrit en rouge. */
  alerte?: boolean;
  /** La tuile prend toute la largeur (deux colonnes). */
  large?: boolean;
}

/** Ce que les boutons comptent : ce que l'accueil sait déjà (voir useFermeAccueil). */
export interface ComptesTerrain {
  animaux?: number;
  naissances?: number;
  /** Les animaux en délai d'attente après un traitement. */
  delais: number;
  ventesSansDocument: number;
  /** Ce que le berger a saisi sur le terrain et qui reste à compléter. */
  aCompleter: number;
  lotsAFacturer: number;
  /** Les animaux abattus qui restent à facturer à un client. */
  viandeAFacturer: number;
  /** Les animaux sans boucle à vendre. */
  viandeAVendre: number;
  lotsARappeler: number;
  stockNegatif: boolean;
  visitesAVenir: number;
}

/** Aucun chiffre sur les tuiles : le mode normal n'en a pas besoin. */
export const COMPTES_VIDES: ComptesTerrain = {
  delais: 0,
  ventesSansDocument: 0,
  aCompleter: 0,
  lotsAFacturer: 0,
  viandeAFacturer: 0,
  viandeAVendre: 0,
  lotsARappeler: 0,
  stockNegatif: false,
  visitesAVenir: 0,
};

const T = TEXTES.accueil.ferme.terrain.tuiles;

/** Le bouton Contacts, utilisé tous les jours : il est sur les trois écrans. */
const contacts = (): TuileTerrain => ({ cle: 'contacts', titre: T.contacts, icone: 'people', route: ROUTES.CONTACTS });

/** Le titre de l'écran terrain d'une zone. */
export const titreDuTerrain = (zone: ZoneTerrain): string => TEXTES.accueil.ferme.terrain.titres[zone];

/** L'adresse de l'écran terrain d'une zone. */
export const routeDuTerrain = (zone: ZoneTerrain): string => ROUTES.terrain(zone);

/** Les grands boutons d'une zone, dans l'ordre où on s'en sert. Un nombre à zéro ne s'affiche pas. */
export function tuilesDuTerrain(zone: ZoneTerrain, c: ComptesTerrain): TuileTerrain[] {
  const avec = (nombre: number | undefined, alerte = false): Pick<TuileTerrain, 'nombre' | 'alerte'> =>
    nombre ? { nombre, alerte } : {};
  switch (zone) {
    case 'troupeau':
      return [
        { cle: 'aCompleter', titre: T.aCompleter, icone: 'create', route: ROUTES.CHEPTEL_A_COMPLETER, ...avec(c.aCompleter, true) },
        { cle: 'liste', titre: T.liste, icone: 'paw', route: ROUTES.lieu('animaux'), ...avec(c.animaux) },
        { cle: 'ajoutRapide', titre: T.ajoutRapide, icone: 'add-circle', route: ROUTES.CHEPTEL_AJOUT_RAPIDE },
        { cle: 'naissance', titre: T.naissance, icone: 'heart', route: ROUTES.CHEPTEL_NAISSANCE_NOUVELLE, ...avec(c.naissances) },
        { cle: 'traitement', titre: T.traitement, icone: 'medkit', route: ROUTES.CHEPTEL_TRAITEMENT_NOUVEAU, ...avec(c.delais, true) },
        { cle: 'sorties', titre: T.sorties, icone: 'log-out', route: ROUTES.CHEPTEL_HISTORIQUE },
        { cle: 'lots', titre: T.lots, icone: 'layers', route: ROUTES.CHEPTEL_LOTS },
        { cle: 'venteVivant', titre: T.venteVivant, icone: 'cash', iconeMci: 'truck-delivery', route: ROUTES.VENTES_VIVANTS, ...avec(c.ventesSansDocument, true) },
        contacts(),
      ];
    case 'atelier':
      // Comme sur la maquette : le lait, fabriquer (une page avec les produits), scanner un lot, les étiquettes, vendre, le stock.
      return [
        { cle: 'lait', titre: T.lait, icone: 'water', route: ROUTES.LAIT_DU_JOUR },
        { cle: 'fabriquer', titre: T.fabriquer, icone: 'restaurant', iconeMci: 'silverware-fork-knife', route: ROUTES.terrain('fabriquer') },
        // Scanner un lot (son numéro, puis sa fabrication, son contrôle, sa vente).
        { cle: 'scanLot', titre: T.scanLot, icone: 'qr-code', route: ROUTES.PRODUCTION_SCAN_LOT_SIMPLE },
        { cle: 'etiquettes', titre: T.etiquettes, icone: 'pricetags', route: ROUTES.PRODUCTION_ETIQUETTES_SIMPLE },
        // Toutes les ventes sont réunies ici : on choisit ensuite le produit (le fromage, la charcuterie, un plat, un savon, le lait, la viande à vendre ou à facturer). Aucun chiffre sur la tuile.
        { cle: 'ventes', titre: T.ventes, icone: 'cash', route: ROUTES.PRODUCTION_VENTES_SIMPLE },
        { cle: 'stock', titre: T.stock, icone: 'cube', route: `${ROUTES.COMPTABILITE_STOCKS}?vue=atelier`, ...(c.stockNegatif ? { alerte: true } : {}) },
      ];
    case 'fabriquer':
      // Les quatre produits, chacun avec son flux en très grands boutons.
      return [
        { cle: 'fromage', titre: T.fromage, icone: 'restaurant', iconeMci: 'cheese', route: ROUTES.productionFabricationSimple(PRODUIT_A_LOTS.FROMAGE) },
        { cle: 'charcuterie', titre: T.charcuterie, icone: 'restaurant', iconeMci: 'knife', route: ROUTES.productionFabricationSimple(PRODUIT_A_LOTS.CHARCUTERIE) },
        { cle: 'plat', titre: T.plat, icone: 'restaurant', iconeMci: 'pot-steam', route: ROUTES.productionFabricationSimple(PRODUIT_A_LOTS.PLAT) },
        { cle: 'savon', titre: T.savon, icone: 'restaurant', iconeMci: 'hand-wash', route: ROUTES.productionFabricationSimple(PRODUIT_A_LOTS.SAVON) },
      ];
    case 'accueil':
      return [
        { cle: 'nouvelleVisite', titre: T.nouvelleVisite, icone: 'add-circle', route: ROUTES.COMMERCIAL_VISITE_SIMPLE },
        { cle: 'visites', titre: T.visites, icone: 'trail-sign', route: ROUTES.COMMERCIAL_VISITES_SIMPLE, ...avec(c.visitesAVenir) },
        { cle: 'formules', titre: T.formules, icone: 'restaurant', route: ROUTES.COMMERCIAL_FORMULES_SIMPLE },
        { cle: 'accueilPublic', titre: T.accueilPublic, icone: 'people-circle', route: ROUTES.COMMERCIAL_ACCUEIL_PUBLIC_SIMPLE },
      ];
  }
}
