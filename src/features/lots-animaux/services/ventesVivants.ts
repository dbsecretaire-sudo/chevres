import type { DocumentCirculationDepose } from '@/features/comptabilite/types';
import type { LotAnimaux, VenteDAnimauxVivants } from '@/features/settings/settings';
import { numerosDeBoucles } from '@/features/cheptel/utils/numerosBoucles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';

/**
 * Les anciens départs d'animaux vivants (des lots internes, sans abattoir) deviennent des ventes d'animaux vivants : le jour, l'acheteur, les boucles et le document
 * de circulation sont repris, avec le même identifiant (les factures et les ventes qui s'y rattachent le gardent). Le lot disparaît.
 * Rend les lots sans eux et la liste des ventes complétée — rien quand il n'y avait aucun ancien départ.
 */
export function ventesVivantesDepuisLesLots(
  lots: readonly LotAnimaux[],
  ventes: readonly VenteDAnimauxVivants[],
): { lots: LotAnimaux[]; ventesVivants: VenteDAnimauxVivants[] } | null {
  const estUnAncienDepart = (l: LotAnimaux) => !!l.depart && !l.abattoir;
  const anciens = lots.filter(estUnAncienDepart);
  if (anciens.length === 0) return null;
  const deja = new Set(ventes.map((v) => v.id));
  const nouvelles: VenteDAnimauxVivants[] = anciens
    .filter((l) => !deja.has(l.id))
    .map((l) => ({
      id: l.id,
      date: l.dateDepart ?? '',
      boucles: l.boucles,
      contactCle: l.contactCle,
      documentCirculation: l.documentCirculation,
    }));
  return { lots: lots.filter((l) => !estUnAncienDepart(l)), ventesVivants: [...ventes, ...nouvelles] };
}

interface Depart {
  /** Le jour du départ (AAAA-MM-JJ). */
  date: string;
  /** Les boucles des animaux qui partent (celles qu'ils n'ont pas ne peuvent pas figurer dans une vente). */
  boucles: readonly string[];
  /** Le document de circulation, déposé avant toute écriture ; absent tant qu'il manque. */
  document?: DocumentCirculationDepose;
  /** L'acheteur (l'identifiant de sa fiche client) : deux acheteurs le même jour font deux ventes. */
  contactCle?: string;
  nouvelId?: () => string;
}

/** Les boucles déjà là, complétées par les nouvelles, sans doublon et rangées. */
const reunir = (a: string, b: readonly string[]): string =>
  [...new Set([...numerosDeBoucles(a), ...b.map((x) => x.trim()).filter(Boolean)])].sort().join(', ');

/**
 * La vente d'un départ d'animaux vivants, ajoutée aux ventes (ou complétée quand la vente du même jour au même acheteur existe déjà : deux départs vers lui le même jour
 * ne font qu'une vente et qu'un document). Rend les ventes et la vente du départ.
 */
export function venteDuDepart(
  ventes: readonly VenteDAnimauxVivants[],
  d: Depart,
): { ventes: VenteDAnimauxVivants[]; vente: VenteDAnimauxVivants } {
  const index = ventes.findIndex((v) => v.date === d.date && v.contactCle === d.contactCle);
  if (index >= 0) {
    const vente: VenteDAnimauxVivants = {
      ...ventes[index],
      boucles: reunir(ventes[index].boucles, d.boucles),
      documentCirculation: d.document ?? ventes[index].documentCirculation,
    };
    return { ventes: ventes.map((v, i) => (i === index ? vente : v)), vente };
  }
  const vente: VenteDAnimauxVivants = {
    id: (d.nouvelId ?? generateId)(),
    date: d.date,
    boucles: reunir('', d.boucles),
    contactCle: d.contactCle,
    documentCirculation: d.document,
  };
  return { ventes: [...ventes, vente], vente };
}

/** Du plus récent au plus ancien (une vente sans date en dernier). */
export const ventesVivantesRecentesDabord = (ventes: readonly VenteDAnimauxVivants[] | undefined): VenteDAnimauxVivants[] =>
  [...(ventes ?? [])].sort((a, b) => b.date.localeCompare(a.date));

/** Le nom d'une vente dans les listes : « Vente du 12/03/2026 ». */
export const titreDeLaVenteVivants = (v: Pick<VenteDAnimauxVivants, 'date'>): string =>
  v.date ? TEXTES.exploitation.ventesVivants.venteDu(formatDateFR(v.date)) : TEXTES.exploitation.ventesVivants.titre;

/** Le nombre de boucles d'une vente. */
export const nombreDAnimauxDeLaVente = (v: Pick<VenteDAnimauxVivants, 'boucles'>): number => numerosDeBoucles(v.boucles).length;
