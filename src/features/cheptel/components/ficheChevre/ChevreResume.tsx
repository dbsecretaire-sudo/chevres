import { Text } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { formatDateFR } from '@/shared/utils/dates';
import { statutLabel } from '@/features/cheptel/utils/chevreLabel';
import { avecIndicatif } from '@/features/export/services/lignesExport';
import type { Chevre } from '@/features/cheptel/types';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_SEXE } from '@/shared/textes/libelles';

interface Props {
  chevre: Chevre;
  indicatif?: string;
  onModifier: () => void;
}

/** Fiche d'une chèvre en lecture seule. */
export function ChevreResume({ chevre, indicatif, onModifier }: Props) {
  return (
    <Card>
      <Text style={commonStyles.line}>
        {TEXTES.cheptel.ficheChevre.nDeBoucleDeuxPoints}
        {chevre.numeroBoucle ? avecIndicatif(chevre.numeroBoucle, indicatif) : '—'}
      </Text>
      {chevre.numeroBoucle && (
        <Text style={commonStyles.line}>
          {TEXTES.cheptel.ficheChevre.dateDeBouclageDeuxPoints}
          {formatDateFR(chevre.dateBouclage)}
        </Text>
      )}
      {(chevre.dateBoucleRouge || chevre.numeroBoucleRouge) && (
        <Text style={commonStyles.line}>
          {TEXTES.cheptel.ficheChevre.dateBouclageRougeDeuxPoints}
          {formatDateFR(chevre.dateBoucleRouge)}
        </Text>
      )}
      {chevre.dateRebouclage && (
        <Text style={commonStyles.line}>
          {TEXTES.cheptel.ficheChevre.dateRebouclageDeuxPoints}
          {formatDateFR(chevre.dateRebouclage)}
        </Text>
      )}
      <Text style={commonStyles.line}>
        {TEXTES.cheptel.ficheChevre.sexeDeuxPoints}
        {LABEL_SEXE[chevre.sexe]}
      </Text>
      <Text style={commonStyles.line}>
        {TEXTES.cheptel.ficheChevre.dateDeNaissanceDeuxPoints}
        {formatDateFR(chevre.dateNaissance)}
      </Text>
      {chevre.poidsKg !== undefined && (
        <Text style={commonStyles.line}>
          {TEXTES.cheptel.ficheChevre.poidsDeuxPoints}
          {TEXTES.cheptel.ficheChevre.poidsKg(chevre.poidsKg)}
        </Text>
      )}
      <Text style={commonStyles.line}>
        {TEXTES.cheptel.ficheChevre.notesDeuxPoints}
        {chevre.notes ?? '—'}
      </Text>
      {chevre.statut !== STATUT_CHEVRE.VIVANTE && (
        <Text style={commonStyles.line}>
          {statutLabel(chevre.statut, chevre.sexe)} {TEXTES.cheptel.ficheChevre.leEspace}
          {formatDateFR(chevre.dateStatut)}
        </Text>
      )}
      <Button label={TEXTES.commun.general.modifierLaFiche} variant="secondary" onPress={onModifier} />
    </Card>
  );
}
