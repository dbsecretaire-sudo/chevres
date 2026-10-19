import type { Rappel } from '@/features/rappels/services/rappels';
import type { EcritureACirculation } from '@/features/comptabilite/services/documentsCirculation';
import { GENRE_RAPPEL, JOURS_RAPPEL_ENVOI_CIRCULATION } from '@/shared/constants/rappels';
import { ROUTES } from '@/shared/constants/routes';
import { ajouterJours } from '@/shared/utils/calendrier';
import { formatDateFR } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.rappels.circulation;

/** « circulation:vert:2026-03-12:facture:abc » : la couleur du feuillet, la date de l'écriture, puis l'écriture elle-même. */
const MOTIF_ID = /^circulation:(vert|rose):(\d{4})-(\d{2})-(\d{2}):/;

/**
 * Les rappels d'envoi à la chambre d'agriculture : un par écriture d'animaux vivants (vente, achat, abattoir) des derniers jours, tant que
 * l'envoi n'est pas validé. Le feuillet vert part pour un achat, le rose pour un envoi à l'abattoir ou une recette.
 */
export function rappelsEnvoiCirculation(
  ecritures: readonly EcritureACirculation[],
  valides: readonly string[],
  aujourdhui: string,
): Rappel[] {
  const limite = ajouterJours(aujourdhui, -JOURS_RAPPEL_ENVOI_CIRCULATION);
  return ecritures
    .filter((e) => e.date >= limite && e.date <= aujourdhui)
    .map<Rappel>((e) => {
      const couleur = e.nature === 'achat' ? 'vert' : 'rose';
      const id = `${GENRE_RAPPEL.CIRCULATION}:${couleur}:${e.date}:${e.cle}`;
      return {
        id,
        genre: GENRE_RAPPEL.CIRCULATION,
        libelle: T.envoi(formatDateFR(e.date), couleur),
        detail: [T.nature[e.nature], e.tiers].filter(Boolean).join(' · '),
        echeance: e.date,
        enRetard: false,
        cible: `${ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION}?ecriture=${encodeURIComponent(e.cle)}`,
      };
    })
    .filter((r) => !valides.includes(r.id))
    .sort((a, b) => a.echeance.localeCompare(b.echeance));
}

/** Le libellé d'un rappel d'envoi d'après son identifiant (pour l'historique) ; rien si l'identifiant n'en est pas un. */
export function libelleDeRappelCirculation(id: string): string | null {
  const m = MOTIF_ID.exec(id);
  return m ? T.envoi(formatDateFR(`${m[2]}-${m[3]}-${m[4]}`), m[1] as 'vert' | 'rose') : null;
}

/** Le mois de l'écriture d'un rappel d'envoi (AAAAMM), pour ranger l'historique ; 0 si l'identifiant n'en est pas un. */
export function periodeDeRappelCirculation(id: string): number {
  const m = MOTIF_ID.exec(id);
  return m ? Number(m[2]) * 100 + Number(m[3]) : 0;
}
