import type { EcritureACirculation } from '@/features/comptabilite/services/documentsCirculation';
import type { LotAnimaux } from '@/features/settings/settings';
import { CATEGORIE_LOT } from '@/shared/constants/lots';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.contacts.fiche.pieces;

/** Une pièce qui se range toute seule dans les documents d'un contact : un bon d'équarrissage (équarrisseur), un document de circulation (abattoir). */
export interface PieceDuContact {
  cle: string;
  titre: string;
  /** Ce qui la date et la situe : le jour, le nombre de fichiers, ce qui manque. */
  detail: string;
  date: string;
  /** Vrai quand il manque encore le fichier (le bon, le document) : la ligne le dit en rouge. */
  manque: boolean;
  route: string;
}

const meme = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Les pièces qui viennent toutes seules dans les documents d'un contact, du plus récent au plus ancien :
 * - pour un équarrisseur, les bons d'équarrissage des lots d'équarrissage (le bon manquant est signalé : un appui ouvre le lot sur ses fichiers) ;
 * - pour un abattoir, les documents de circulation des écritures et des lots de départ qui le concernent (son nom pour tiers, ou sa prestation dans le lot).
 * Rien pour les autres contacts.
 */
export function piecesDuContact(
  contact: { nom: string; cle: string },
  categorieId: string | undefined,
  lots: readonly LotAnimaux[],
  ecritures: readonly EcritureACirculation[],
): PieceDuContact[] {
  const pieces: PieceDuContact[] = [];
  if (categorieId === CATEGORIE_FOURNISSEUR.EQUARRISSAGE) {
    for (const l of lots.filter((x) => x.categorie === CATEGORIE_LOT.EQUARRISSAGE)) {
      const fichiers = l.fichiers?.length ?? 0;
      const manque = fichiers === 0 && !l.numeroBon;
      pieces.push({
        cle: `bon-${l.id}`,
        titre: l.numeroBon ? T.bonNumero(l.numeroBon) : T.bonDuLot(l.nom),
        detail: [
          l.dateEnlevement ? formatDateFR(l.dateEnlevement) : undefined,
          fichiers > 0 ? TEXTES.fichiers.nombre(fichiers) : undefined,
          manque ? T.bonManque : undefined,
        ]
          .filter(Boolean)
          .join(' · '),
        date: l.dateEnlevement ?? '',
        manque,
        route: `${ROUTES.lot(l.id)}&onglet=fichiers`,
      });
    }
  }
  if (categorieId === CATEGORIE_FOURNISSEUR.ABATTOIR) {
    for (const e of ecritures) {
      const concerne =
        e.type === 'lot'
          ? e.liees.some((x) => x.role === 'prestation' && meme(x.tiers, contact.nom))
          : meme(e.tiers, contact.nom);
      if (!concerne) continue;
      pieces.push({
        cle: `circulation-${e.cle}`,
        titre: T.circulation(e.type === 'lot' ? e.tiers : e.reference || e.tiers),
        detail: [formatDateFR(e.date), e.depose ? T.documentAjoute : T.documentManque].join(' · '),
        date: e.date,
        manque: !e.depose,
        route: ROUTES.documentsCirculationDepuis(ROUTES.ficheContact(contact.cle), e.cle),
      });
    }
  }
  return pieces.sort((a, b) => b.date.localeCompare(a.date));
}
