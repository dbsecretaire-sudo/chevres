import type { Client } from '@/features/clients/types';
import type { Vente } from '@/features/comptabilite/types';
import { etatDuLot, lotsDePlatsUtilisant } from '@/features/stock/services/lots';
import { libelleArticle } from '@/features/stock/services/stock';
import type { ArchiveStock, FabricationDePlats, LotFromage } from '@/features/stock/types';
import { ETAT_LOT } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { nomComplet } from '@/shared/utils/personne';

type ArchiveDeTracabilite = Pick<ArchiveStock, 'lots' | 'platsFabriques' | 'articles' | 'noms' | 'dossiersSavons'>;

/** Un ingrédient d'une fabrication : son nom, la quantité sortie du stock et les numéros des lots pris. */
export interface IngredientTrace {
  libelle: string;
  quantite: number;
  numeros: string[];
}

/** Où est parti un lot : son état, la vente (date, facture) et le client à joindre (sa fiche quand elle existe). */
export interface DestinationDeLot {
  numero: string;
  libelle: string;
  etat: Exclude<ValeurDe<typeof ETAT_LOT>, typeof ETAT_LOT.TOUT>;
  dateVente?: string;
  dateRappel?: string;
  numeroFacture?: string;
  client?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  /** Vrai : le client n'a fait que réserver le lot, il n'est pas encore vendu. */
  reserve?: boolean;
}

/** La traçabilité d'un lot, pour un rappel : d'où viennent ses ingrédients, où sont partis les lots de sa fabrication, et les plats faits avec lui. */
export interface TracabiliteLot {
  lot: LotFromage;
  libelle: string;
  fabrication?: FabricationDePlats;
  /** Les ingrédients de la fabrication, avec leurs numéros de lot (en amont). */
  ingredients: IngredientTrace[];
  /** Tous les lots de la même fabrication (le lot demandé d'abord) : leur état, leur vente et leur client. */
  lotsDeLaFabrication: DestinationDeLot[];
  /** Les lots de plats faits avec un lot de cette fabrication (en aval), à rappeler avec elle. */
  produitsDerives: DestinationDeLot[];
}

function destination(
  lot: LotFromage,
  archive: ArchiveDeTracabilite,
  ventes: ReadonlyMap<string, Vente>,
  clients: readonly Client[],
): DestinationDeLot {
  const vente = lot.venteId ? ventes.get(lot.venteId) : undefined;
  const nom = (vente?.client ?? lot.reservation?.client)?.trim();
  const fiche = lot.reservation?.clientId
    ? clients.find((c) => c.id === lot.reservation?.clientId)
    : nom
      ? clients.find((c) => nomComplet(c).trim().toLowerCase() === nom.toLowerCase())
      : undefined;
  const etat = etatDuLot(lot);
  return {
    numero: lot.numero,
    libelle: libelleArticle(lot.article, archive as ArchiveStock),
    etat,
    dateVente: lot.dateVente ?? vente?.date,
    dateRappel: lot.dateRappel,
    numeroFacture: vente?.numeroFacture,
    client: fiche ? nomComplet(fiche) : nom || undefined,
    telephone: fiche?.telephone,
    email: fiche?.email,
    adresse: fiche?.adressePostale,
    reserve: etat === ETAT_LOT.EN_STOCK && !!lot.reservation,
  };
}

/**
 * La fiche de traçabilité d'un lot : ses ingrédients et leurs lots (en amont), les lots de sa fabrication avec la vente et le client de chacun, et les
 * plats préparés faits avec eux (en aval). `ventes` : les ventes des lots vendus, par identifiant ; `clients` : pour joindre les coordonnées.
 */
export function tracabiliteDuLot(
  lot: LotFromage,
  archive: ArchiveDeTracabilite,
  ventes: ReadonlyMap<string, Vente>,
  clients: readonly Client[],
): TracabiliteLot {
  const lots = archive.lots ?? [];
  const fabrication = lot.mouvementId ? archive.platsFabriques?.[lot.mouvementId] : undefined;
  const freres = lot.mouvementId ? lots.filter((l) => l.mouvementId === lot.mouvementId && l.id !== lot.id) : [];
  const ensemble = [lot, ...freres];
  const derives = lotsDePlatsUtilisant(
    archive,
    ensemble.map((l) => l.id),
  ).filter((l) => !ensemble.some((e) => e.id === l.id));
  return {
    lot,
    libelle: libelleArticle(lot.article, archive as ArchiveStock),
    fabrication,
    ingredients: (fabrication?.ingredients ?? []).map((i) => ({
      libelle: libelleArticle(i.article, archive as ArchiveStock),
      quantite: i.quantite,
      numeros: lots.filter((l) => i.lotIds.includes(l.id)).map((l) => l.numero),
    })),
    lotsDeLaFabrication: ensemble.map((l) => destination(l, archive, ventes, clients)),
    produitsDerives: derives.map((l) => destination(l, archive, ventes, clients)),
  };
}
