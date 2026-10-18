import type { DocumentCirculationDepose, Facture, Vente } from '@/features/comptabilite/types';
import { activiteFacture, activiteVente } from '@/features/comptabilite/utils/activite';
import { documentCirculationRequis, idsDesAnimauxAchetes, idsDesAnimauxEnvoyes } from '@/features/comptabilite/utils/ventes';
import { getFacture, remplacerFacture } from '@/features/comptabilite/repository/factures';
import { getVente } from '@/features/comptabilite/repository/ventes';
import { upsertRecord } from '@/shared/storage/localStore';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { tiersEstUnAbattoir } from '@/features/fournisseurs/services/abattoirs';
import { TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { todayISO, yearOf } from '@/shared/utils/dates';
import { ajouterJours } from '@/shared/utils/calendrier';
import { comparerAlphabetique } from '@/shared/utils/personne';

/** Pendant combien de jours un document de circulation manquant est rappelé (au-delà, l'écriture est trop ancienne pour qu'on le réclame). */
export const JOURS_RAPPEL_CIRCULATION = 365;

/** Une écriture d'animaux vivants qui demande un document de circulation : une vente, ou une dépense (achat d'animaux, abattoir). */
export interface EcritureACirculation {
  /** « vente:identifiant » ou « facture:identifiant » : de quoi la retrouver et la mettre en évidence. */
  cle: string;
  type: 'vente' | 'facture';
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
  /** Le document déposé ; absent tant qu'il manque. */
  depose?: DocumentCirculationDepose;
}

/**
 * Les écritures qui demandent un document de circulation, de la plus récente à la plus ancienne : les ventes déclarées d'animaux vivants,
 * les dépenses d'animaux vivants achetés et celles d'un contact de catégorie Abattoir.
 */
export function ecrituresACirculation(
  ventes: Vente[],
  factures: Facture[],
  abattoirs: ReadonlySet<string>,
): EcritureACirculation[] {
  const deVentes = ventes
    .filter((v) => documentCirculationRequis(v))
    .map<EcritureACirculation>((v) => ({
      cle: `vente:${v.id}`,
      type: 'vente',
      id: v.id,
      date: v.date,
      tiers: v.client ?? '',
      reference: v.numeroFacture ?? '',
      montant: v.prix ?? 0,
      activite: activiteVente(v),
      depose: v.documentCirculation,
    }));
  const deDepenses = factures
    .filter(
      (f) =>
        f.type === TYPE_FACTURE.RECUE && (idsDesAnimauxAchetes(f).length > 0 || idsDesAnimauxEnvoyes(f).length > 0 || tiersEstUnAbattoir(f.tiers, abattoirs)),
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
      depose: f.documentCirculation,
    }));
  return [...deVentes, ...deDepenses].sort((a, b) => b.date.localeCompare(a.date));
}

/** Celles dont le document manque et qui sont assez récentes pour être rappelées. */
export function documentsManquants(
  ecritures: EcritureACirculation[],
  aujourdhui: string = todayISO(),
): EcritureACirculation[] {
  const limite = ajouterJours(aujourdhui, -JOURS_RAPPEL_CIRCULATION);
  return ecritures.filter((e) => !e.depose && e.date >= limite);
}

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

/** Les tiers, rangés alphabétiquement : de quoi proposer une recherche. */
export const tiersDesEcritures = (ecritures: EcritureACirculation[]): string[] =>
  [...new Set(ecritures.map((e) => e.tiers).filter(Boolean))].sort(comparerAlphabetique);

/** Dépose (ou retire, avec `undefined`) le document de circulation d'une vente ou d'une dépense. */
export async function deposerDocumentCirculation(
  ecriture: Pick<EcritureACirculation, 'type' | 'id'>,
  depose: DocumentCirculationDepose | undefined,
): Promise<void> {
  if (ecriture.type === 'vente') {
    const vente = await getVente(ecriture.id);
    // Enregistré tel quel : un document ajouté ne change ni le stock ni les lots de la vente.
    if (vente) await upsertRecord(CATEGORIE_STOCKAGE.VENTES, yearOf(vente.date), { ...vente, documentCirculation: depose });
  } else {
    const facture = await getFacture(ecriture.id);
    if (facture) await remplacerFacture({ ...facture, documentCirculation: depose });
  }
}
