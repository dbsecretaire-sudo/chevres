import type { DocumentCirculationDepose, Facture, Vente } from '@/features/comptabilite/types';
import { activiteFacture, activiteVente } from '@/features/comptabilite/utils/activite';
import { documentCirculationRequis, idsDesAnimaux, idsDesAnimauxAchetes, idsDesAnimauxEnvoyes } from '@/features/comptabilite/utils/ventes';
import { getFacture, remplacerFacture } from '@/features/comptabilite/repository/factures';
import { getVente } from '@/features/comptabilite/repository/ventes';
import { upsertRecord } from '@/shared/storage/localStore';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { tiersEstUnAbattoir } from '@/features/fournisseurs/services/abattoirs';
import { TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { todayISO, yearOf } from '@/shared/utils/dates';
import { ajouterJours } from '@/shared/utils/calendrier';
import type { LotAnimaux, VenteDAnimauxVivants } from '@/features/settings/settings';
import { titreDeLaVenteVivants } from '@/features/lots-animaux/services/ventesVivants';
import { numerosDeBoucles } from '@/features/cheptel/utils/numerosBoucles';
import type { Chevre } from '@/features/cheptel/types';
import { animauxDuLot } from '@/features/lots-animaux/services/lots';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';

/** Pendant combien de jours un document de circulation manquant est rappelé (au-delà, l'écriture est trop ancienne pour qu'on le réclame). */
export const JOURS_RAPPEL_CIRCULATION = 365;

/** Le genre d'une écriture à document : une vente, une dépense, ou un départ (bon de livraison « lot », vente d'animaux vivants « vivants »). */
export type TypeDEcritureACirculation = 'vente' | 'facture' | 'lot' | 'vivants';

/** Vrai pour un départ (un bon de livraison ou une vente d'animaux vivants) : son document est déposé avant toute écriture, et couvre celles qui s'y rattachent. */
export const estUnDepart = (type: TypeDEcritureACirculation): type is 'lot' | 'vivants' => type === 'lot' || type === 'vivants';

/** Ce qui demande un document de circulation : une vente, une dépense (achat d'animaux, abattoir), un bon de livraison à l'abattoir ou une vente d'animaux vivants (le document est déposé avant toute écriture). */
export interface EcritureACirculation {
  /** « vente:identifiant », « facture:identifiant », « lot:identifiant » (bon de livraison) ou « vivants:identifiant » : de quoi la retrouver et la mettre en évidence. */
  cle: string;
  type: TypeDEcritureACirculation;
  id: string;
  date: string;
  /** Le client (vente) ou le fournisseur (dépense). */
  tiers: string;
  /** Le n° de facture (ou l'objet de la dépense). */
  reference: string;
  /** Le montant TTC : positif pour une vente, négatif pour une dépense. */
  montant: number;
  /** L'activité (l'espèce) de l'écriture, pour ne montrer que celle choisie. */
  activite: string;
  /** Ce que raconte l'écriture : un achat d'animaux (feuillet vert), un envoi à l'abattoir ou une vente d'animaux vivants (feuillet rose). */
  nature: 'achat' | 'abattoir' | 'vente';
  /** Le document déposé ; absent tant qu'il manque. */
  depose?: DocumentCirculationDepose;
  /** Pour un départ (bon de livraison, vente d'animaux vivants) : la prestation de l'abattoir et les ventes qui s'y rattachent (vide hors lot). */
  liees: EcritureLiee[];
}

/** Une écriture rattachée à un départ : la prestation de l'abattoir (dépense) ou la vente des animaux ou de leur viande. */
export interface EcritureLiee {
  type: 'vente' | 'facture';
  id: string;
  date: string;
  tiers: string;
  reference: string;
  /** Le montant TTC : positif pour une vente, négatif pour une dépense. */
  montant: number;
  /** Ce que raconte l'écriture : la prestation de l'abattoir ou la vente. */
  role: 'prestation' | 'vente';
}

/**
 * Les écritures qui demandent un document de circulation, de la plus récente à la plus ancienne : les départs (un document par bon de livraison ou par vente d'animaux vivants, déposé
 * avant toute écriture, avec les écritures qui s'y rattachent), et, hors lot, les ventes déclarées d'animaux vivants et les dépenses d'animaux
 * vivants achetés ou d'un contact de catégorie Abattoir.
 */
export function ecrituresACirculation(
  ventes: Vente[],
  factures: Facture[],
  abattoirs: ReadonlySet<string>,
  lots: readonly LotAnimaux[] = [],
  animaux: readonly Chevre[] = [],
  ventesVivants: readonly VenteDAnimauxVivants[] = [],
): EcritureACirculation[] {
  /** Ce qui porte un document de circulation avant toute écriture : les bons de livraison à l'abattoir et les ventes d'animaux vivants. */
  const departs = [
    ...lots
      .filter((l) => l.depart && l.abattoir)
      .map((l) => ({
        type: 'lot' as const,
        id: l.id,
        date: l.abattoir as string,
        nom: l.nom,
        boucles: l.boucles,
        nature: 'abattoir' as const,
        depose: l.documentCirculation,
        factureId: l.factureId,
      })),
    ...ventesVivants.map((v) => ({
      type: 'vivants' as const,
      id: v.id,
      date: v.date,
      nom: titreDeLaVenteVivants(v),
      boucles: v.boucles,
      nature: 'vente' as const,
      depose: v.documentCirculation,
      factureId: undefined,
    })),
  ];
  const idsDesLots = new Set(departs.map((d) => d.id));
  const deVentes = ventes
    .filter((v) => documentCirculationRequis(v) && !(v.lotId && idsDesLots.has(v.lotId)))
    .map<EcritureACirculation>((v) => ({
      cle: `vente:${v.id}`,
      type: 'vente',
      id: v.id,
      date: v.date,
      tiers: v.client ?? '',
      reference: v.numeroFacture ?? '',
      montant: v.prix ?? 0,
      activite: activiteVente(v),
      nature: 'vente',
      depose: v.documentCirculation,
      liees: [],
    }));
  const deDepenses = factures
    .filter(
      (f) =>
        f.type === TYPE_FACTURE.RECUE &&
        !(f.lotId && idsDesLots.has(f.lotId)) &&
        (idsDesAnimauxAchetes(f).length > 0 || idsDesAnimauxEnvoyes(f).length > 0 || tiersEstUnAbattoir(f.tiers, abattoirs)),
    )
    .map<EcritureACirculation>((f) => ({
      cle: `facture:${f.id}`,
      type: 'facture',
      id: f.id,
      date: f.date,
      tiers: f.tiers,
      reference: f.description ?? '',
      montant: -f.montant,
      activite: activiteFacture(f),
      nature: idsDesAnimauxAchetes(f).length > 0 ? 'achat' : 'abattoir',
      depose: f.documentCirculation,
      liees: [],
    }));
  const deLots = departs.map<EcritureACirculation>((l) => {
    const boucles = numerosDeBoucles(l.boucles);
    const idsDuLot = new Set(animauxDuLot({ boucles: l.boucles }, [...animaux]).map((a) => a.id));
    const prestations = factures
      .filter((f) => f.lotId === l.id || (!!l.factureId && f.id === l.factureId))
      .map<EcritureLiee>((f) => ({
        type: 'facture',
        id: f.id,
        date: f.date,
        tiers: f.tiers,
        reference: f.description ?? '',
        montant: -f.montant,
        role: 'prestation',
      }));
    // Les ventes du lot : celles qui s'y rattachent, et celles des animaux du lot (la viande facturée au client).
    const vendues = ventes
      .filter((v) => v.lotId === l.id || idsDesAnimaux(v).some((id) => idsDuLot.has(id)))
      .map<EcritureLiee>((v) => ({
        type: 'vente',
        id: v.id,
        date: v.date,
        tiers: v.client ?? '',
        reference: v.numeroFacture ?? '',
        montant: v.prix ?? 0,
        role: 'vente',
      }));
    return {
      cle: `${l.type}:${l.id}`,
      type: l.type,
      id: l.id,
      date: l.date,
      tiers: l.nom,
      reference: `${boucles.length} ${boucles.length > 1 ? 'animaux' : 'animal'}`,
      montant: 0,
      activite: ACTIVITE_COMMUNE,
      nature: l.nature,
      depose: l.depose,
      liees: [...prestations, ...vendues],
    };
  });
  return [...deVentes, ...deDepenses, ...deLots].sort((a, b) => b.date.localeCompare(a.date));
}

/** Celles dont le document manque et qui sont assez récentes pour être rappelées. */
export function documentsManquants(
  ecritures: EcritureACirculation[],
  aujourdhui: string = todayISO(),
): EcritureACirculation[] {
  const limite = ajouterJours(aujourdhui, -JOURS_RAPPEL_CIRCULATION);
  return ecritures.filter((e) => !e.depose && e.date >= limite);
}

/** Tous les documents qui manquent, de toutes les années (les plus anciens aussi : un document manquant reste à déposer). */
export const documentsManquantsToutesAnnees = (ecritures: EcritureACirculation[]): EcritureACirculation[] =>
  ecritures.filter((e) => !e.depose);

/** Les écritures qui correspondent à une recherche : le tiers, la référence, la date ou le montant contiennent le texte tapé. */
export function rechercherEcritures(ecritures: EcritureACirculation[], texte: string): EcritureACirculation[] {
  const q = texte.trim().toLowerCase();
  if (!q) return ecritures;
  return ecritures.filter((e) =>
    [e.tiers, e.reference, e.date, e.date.split('-').reverse().join('/'), String(Math.abs(e.montant)).replace('.', ',')]
      .join(' ')
      .toLowerCase()
      .includes(q),
  );
}

/** Les années où des écritures demandent un document (de la plus récente à la plus ancienne). */
export const anneesDesEcritures = (ecritures: EcritureACirculation[]): number[] =>
  [...new Set(ecritures.map((e) => Number(e.date.slice(0, 4))))].sort((a, b) => b - a);

/** Dépose (ou retire, avec `undefined`) le document de circulation d'une vente ou d'une dépense. */
export async function deposerDocumentCirculation(
  ecriture: Pick<EcritureACirculation, 'type' | 'id'>,
  depose: DocumentCirculationDepose | undefined,
): Promise<void> {
  if (ecriture.type === 'vente') {
    const vente = await getVente(ecriture.id);
    // Enregistré tel quel : un document ajouté ne change ni le stock ni les lots de la vente.
    if (vente) await upsertRecord(CATEGORIE_STOCKAGE.VENTES, yearOf(vente.date), { ...vente, documentCirculation: depose });
  } else if (ecriture.type === 'facture') {
    const facture = await getFacture(ecriture.id);
    if (facture) await remplacerFacture({ ...facture, documentCirculation: depose });
  }
  // Un départ (bon de livraison, vente d'animaux vivants) : son document est dans les réglages, que la couche des écrans met à jour (voir useActionsDocumentCirculation).
}
