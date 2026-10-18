import { Badge } from '@/shared/components/Badge';
import { ListRow } from '@/shared/components/ListRow';
import { colors, statutColors } from '@/shared/theme/colors';
import { formatDateFR } from '@/shared/utils/dates';
import {
  afficherBadgeRenouvellement,
  detailDeLAnimal,
  libelleChevre,
  statutLabel,
} from '@/features/cheptel/utils/chevreLabel';
import type { Chevre } from '@/features/cheptel/types';
import { estReserve } from '@/features/cheptel/services/reservations';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { TEXTES } from '@/shared/textes';
import { LABEL_SEXE } from '@/shared/textes/libelles';

/** Badge à droite de la ligne : renouvellement en priorité, sinon le statut d'un animal sorti. */
function BadgeChevre({ chevre }: { chevre: Chevre }) {
  if (chevre.renouvellement && afficherBadgeRenouvellement(chevre.dateNaissance)) {
    return <Badge label={TEXTES.commun.general.renouvellement} color={colors.primary} />;
  }
  if (chevre.statut !== STATUT_CHEVRE.VIVANTE) {
    return <Badge label={statutLabel(chevre.statut, chevre.sexe)} color={statutColors[chevre.statut]} />;
  }
  return null;
}

/** Ligne de la liste du cheptel : libellé, sexe/naissance/sortie/mère et badge. */
export function LigneChevre({
  chevre,
  onPress,
  titre,
}: {
  chevre: Chevre;
  onPress: () => void;
  /** Un titre à la place du libellé de l'animal (la liste des animaux réservés : « Réservation Momo »), sans la mention « Réservé pour… ». */
  titre?: string;
}) {
  const dateSortie =
    chevre.statut !== STATUT_CHEVRE.VIVANTE && chevre.dateStatut ? formatDateFR(chevre.dateStatut) : '';
  const mere = chevre.mereNumeroBoucle
    ? TEXTES.cheptel.listeCheptel.mereMerenumeroboucle(chevre.mereNumeroBoucle)
    : '';

  const reserve = !titre && estReserve(chevre) ? ` · ${TEXTES.cheptel.reservation.pour(chevre.reservation!.client)}${chevre.reservation!.etat ? ` (${chevre.reservation!.etat})` : ''}` : '';

  return (
    <ListRow
      title={titre ?? libelleChevre(chevre)}
      subtitle={
        // Sans boucle ni nom : la ligne du dessous dit sa naissance et sa sortie, le titre dit déjà ce que c'est.
        !chevre.numeroBoucle && !chevre.nom
          ? `${detailDeLAnimal(chevre)}${mere}${reserve}`
          : `${LABEL_SEXE[chevre.sexe]} · ${formatDateFR(chevre.dateNaissance)} - ${dateSortie}${mere}${reserve}`
      }
      trailing={<BadgeChevre chevre={chevre} />}
      onPress={onPress}
    />
  );
}
