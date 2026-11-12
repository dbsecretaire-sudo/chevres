import type { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { ROUTES } from '@/shared/constants/routes';
import { RUBRIQUES_DU_PLUS } from '@/features/accueil/rubriques/rubriquesDuPlus';
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
  /** Une ligne de texte sous le titre (l'aliment par animal, sur la tuile des soins). */
  detail?: string;
  /** La tuile prend toute la largeur (deux colonnes). */
  large?: boolean;
  /** Une ligne de liste, et non une grande tuile : les réglages et les rubriques, sans chiffre. */
  ligne?: boolean;
  /** Le menu titré où range la ligne (« Gestion » par défaut) : Lots, Réglementation, Partenaires, Bilans, Argent… */
  groupe?: string;
}

/** Ce que les boutons comptent : ce que l'accueil sait déjà (voir useFermeAccueil). */
export interface ComptesTerrain {
  animaux?: number;
  naissances?: number;
  /** Les animaux en délai d'attente après un traitement. */
  delais: number;
  /** L'aliment moyen par animal et par jour, en grammes (affiché sur la tuile des soins). */
  grammesParAnimalParJour?: number;
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

/**
 * Les rubriques du menu « Plus » (Réglementation, Argent, Partenaires, Bilans, Historique ; « Réglages » reste dans le menu) : la page Chèvres les
 * reprend en liste sous « Gestion », sous les six tuiles du troupeau. Elles s'ouvrent comme dans le menu « Plus ».
 */
const TUILES_DU_PLUS: TuileTerrain[] = RUBRIQUES_DU_PLUS.filter((r) => r.cle === 'historique').map((r) => ({
  cle: `plus-${r.cle}`,
  titre: r.libelle,
  icone: r.icone,
  route: ROUTES.rubrique(r.cle),
  ligne: true,
}));

/** Le titre de l'écran terrain d'une zone. */
export const titreDuTerrain = (zone: ZoneTerrain): string => TEXTES.accueil.ferme.terrain.titres[zone];

/** Les grands boutons d'une zone, dans l'ordre où on s'en sert. Un nombre à zéro ne s'affiche pas. */
export function tuilesDuTerrain(zone: ZoneTerrain, c: ComptesTerrain): TuileTerrain[] {
  const avec = (nombre: number | undefined, alerte = false): Pick<TuileTerrain, 'nombre' | 'alerte'> =>
    nombre ? { nombre, alerte } : {};
  switch (zone) {
    case 'troupeau':
      // Comme sur la maquette : les six tuiles du troupeau, puis la liste « Gestion » (réglages du cheptel, rubriques du « Plus »), sans chiffre.
      return [
        { cle: 'scanner', titre: T.scanner, icone: 'scan', route: ROUTES.CHEPTEL_LISTE },
        { cle: 'naissance', titre: T.naissance, icone: 'heart', route: ROUTES.CHEPTEL_NAISSANCES, ...avec(c.naissances) },
        // La tuile des soins porte l'aliment par animal et par jour, en ligne sous le titre.
        {
          cle: 'traitement',
          titre: T.traitement,
          icone: 'medkit',
          route: ROUTES.rubrique('sante'),
          ...avec(c.delais, true),
          ...(c.grammesParAnimalParJour !== undefined
            ? { detail: `Aliment par animal et par jour : ${Math.round(c.grammesParAnimalParJour).toLocaleString('fr-FR')} g` }
            : {}),
        },
        // Les ventes de vivants sans document de circulation se signalent sur Mouvement (où se font les ventes vivantes).
        { cle: 'mouvement', titre: T.mouvement, icone: 'swap-horizontal', route: ROUTES.rubrique('mouvement'), ...avec(c.ventesSansDocument, true) },
        { cle: 'deces', titre: T.deces, icone: 'add', route: ROUTES.CHEPTEL_DECES },
        // Le cheptel montre le nombre d'animaux ; quand le berger a saisi des naissances ou des morts à compléter, ce chiffre (en rouge) remplace le nombre.
        c.aCompleter
          ? { cle: 'cheptel', titre: T.cheptel, icone: 'list', route: ROUTES.CHEPTEL_A_COMPLETER, nombre: c.aCompleter, alerte: true }
          : { cle: 'cheptel', titre: T.cheptel, icone: 'list', route: ROUTES.CHEPTEL_LISTE, ...avec(c.animaux) },
        { cle: 'reglagesCheptel', titre: 'Réglages du cheptel', icone: 'settings-outline', route: ROUTES.CHEPTEL_REGLAGES, ligne: true },
        { cle: 'bilanAnnuel', titre: 'Bilan annuel', icone: 'stats-chart-outline', route: ROUTES.CHEPTEL_BILAN, ligne: true },
        ...TUILES_DU_PLUS,
      ];
    case 'atelier':
      // Comme sur la maquette : le lait, fabriquer (une page avec les produits), scanner un lot, les étiquettes, vendre, le stock.
      return [
        { cle: 'lait', titre: T.lait, icone: 'water', route: ROUTES.LAIT_DU_JOUR },
        { cle: 'fabriquer', titre: T.fabriquer, icone: 'restaurant', iconeMci: 'silverware-fork-knife', route: ROUTES.terrain('fabriquer') },
        // Scanner un lot (son numéro, puis sa fabrication, son contrôle, sa vente).
        { cle: 'scanLot', titre: T.scanLot, icone: 'qr-code', route: ROUTES.PRODUCTION_SCAN_LOT_SIMPLE },
        { cle: 'etiquettes', titre: T.etiquettes, icone: 'pricetags', route: ROUTES.PRODUCTION_ETIQUETTES_SIMPLE, ligne: true, groupe: 'Lots' },
        // Toutes les ventes sont réunies ici : on choisit ensuite le produit (le fromage, la charcuterie, un plat, un savon, le lait, la viande à vendre ou à facturer). Aucun chiffre sur la tuile.
        { cle: 'ventes', titre: T.ventes, icone: 'cash', route: ROUTES.PRODUCTION_VENTES_SIMPLE },
        { cle: 'stock', titre: T.stock, icone: 'cube', route: `${ROUTES.COMPTABILITE_STOCKS}?vue=atelier`, ...(c.stockNegatif ? { alerte: true } : {}) },
        { cle: 'recettes', titre: 'Recettes', icone: 'book', route: ROUTES.PRODUCTION_RECETTES },
        // Les menus sous les six tuiles, comme sur la page Chèvres : les lots, la réglementation, les partenaires, les bilans et l'argent.
        { cle: 'lotsDeLAtelier', titre: 'Lots de l’atelier', icone: 'cube-outline', route: ROUTES.PRODUCTION_LOTS, ligne: true, groupe: 'Lots' },
        { cle: 'viandeAtelier', titre: 'Viande', icone: 'restaurant-outline', route: ROUTES.PRODUCTION_VIANDE, ligne: true, groupe: 'Lots' },
        { cle: 'historiqueRappels', titre: 'Historique des rappels', icone: 'time-outline', route: ROUTES.RAPPELS_HISTORIQUE, ligne: true, groupe: 'Lots' },
        { cle: 'cadreAtelier', titre: 'Cadre réglementaire pour l’atelier', icone: 'shield-checkmark-outline', route: ROUTES.CADRE_REGLEMENTAIRE_ATELIER, ligne: true, groupe: 'Réglementation' },
        { cle: 'controleLaitier', titre: 'Contrôle laitier', icone: 'water-outline', route: ROUTES.santeControlesOnglet('laitier', 'laitier'), ligne: true, groupe: 'Réglementation' },
        { cle: 'analyses', titre: 'Analyses', icone: 'flask-outline', route: ROUTES.santeControlesOnglet('laitier', 'analyse'), ligne: true, groupe: 'Réglementation' },
        { cle: 'registreAnalyses', titre: 'Registre des analyses', icone: 'list-outline', route: ROUTES.PRODUCTION_REGISTRE_ANALYSES, ligne: true, groupe: 'Réglementation' },
        { cle: 'rappelsLots', titre: 'Rappels de lots', icone: 'notifications-outline', route: ROUTES.PRODUCTION_RAPPELS_LOTS, ligne: true, groupe: 'Réglementation' },
        { cle: 'ventesAtelier', titre: 'Ventes', icone: 'cash-outline', route: ROUTES.COMMERCIAL_VENTES, ligne: true, groupe: 'Ventes' },
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
