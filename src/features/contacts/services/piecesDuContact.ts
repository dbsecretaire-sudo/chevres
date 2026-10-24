import { estUnDepart, type EcritureACirculation } from '@/features/comptabilite/services/documentsCirculation';
import { titreDeLEnlevement } from '@/features/lots-animaux/services/enlevements';
import type { EnlevementEquarrissage, LotAnimaux, VenteDAnimauxVivants } from '@/features/settings/settings';
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
 * - pour un équarrisseur, les bons d'équarrissage des lots d'équarrissage qu'il a enlevés (le bon manquant est signalé : un appui ouvre le lot sur ses
 *   fichiers) ; un lot sans équarrisseur choisi est montré à chacun, avec « équarrisseur à choisir » ;
 * - pour tout contact (un abattoir, un particulier, un autre éleveur…), les documents de circulation des ventes et dépenses d'animaux vivants faites avec
 *   lui (son nom pour tiers), et ceux des bons de livraison et des ventes d'animaux vivants dont il est le contact ou dont une écriture porte son nom.
 */
export function piecesDuContact(
  contact: { nom: string; cle: string; ids?: readonly string[] },
  categorieId: string | undefined,
  lots: readonly LotAnimaux[],
  ecritures: readonly EcritureACirculation[],
  enlevements: readonly EnlevementEquarrissage[] = [],
  ventesVivants: readonly VenteDAnimauxVivants[] = [],
): PieceDuContact[] {
  const ids = new Set([contact.cle, ...(contact.ids ?? [])].filter(Boolean));
  const pieces: PieceDuContact[] = [];
  if (categorieId === CATEGORIE_FOURNISSEUR.EQUARRISSAGE) {
    for (const e of enlevements) {
      if (e.contactCle && !ids.has(e.contactCle)) continue;
      const fichiers = e.fichiers?.length ?? 0;
      const manque = fichiers === 0 && !e.numeroBon;
      pieces.push({
        cle: `bon-${e.id}`,
        titre: e.numeroBon ? T.bonNumero(e.numeroBon) : titreDeLEnlevement(e),
        detail: [
          e.date ? formatDateFR(e.date) : undefined,
          fichiers > 0 ? TEXTES.fichiers.nombre(fichiers) : undefined,
          manque ? T.bonManque : undefined,
          e.contactCle ? undefined : T.equarrisseurAChoisir,
        ]
          .filter(Boolean)
          .join(' · '),
        date: e.date,
        manque,
        route: ROUTES.enlevement(e.id),
      });
    }
  }
  for (const e of ecritures) {
    // Un départ (bon de livraison, vente d'animaux vivants) se range chez le contact qu'il porte, ou dont une écriture porte le nom.
    const contactDuDepart =
      e.type === 'lot' ? lots.find((l) => l.id === e.id)?.contactCle : e.type === 'vivants' ? ventesVivants.find((v) => v.id === e.id)?.contactCle : undefined;
    const concerne = estUnDepart(e.type)
      ? (!!contactDuDepart && ids.has(contactDuDepart)) || e.liees.some((x) => meme(x.tiers, contact.nom))
      : meme(e.tiers, contact.nom);
    if (!concerne) continue;
    pieces.push({
      cle: `circulation-${e.cle}`,
      titre: T.circulation(estUnDepart(e.type) ? e.tiers : e.reference || e.tiers),
      detail: [formatDateFR(e.date), e.depose ? T.documentAjoute : T.documentManque].join(' · '),
      date: e.date,
      manque: !e.depose,
      route: ROUTES.documentsCirculationDepuis(ROUTES.ficheContact(contact.cle), e.cle),
    });
  }
  return pieces.sort((a, b) => b.date.localeCompare(a.date));
}
