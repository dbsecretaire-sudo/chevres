import { Text, View } from 'react-native';
import { Badge } from '@/shared/components/Badge';
import { Card } from '@/shared/components/Card';
import { ListRow } from '@/shared/components/ListRow';
import { statutColors } from '@/shared/theme/colors';
import { formatDateFR } from '@/shared/utils/dates';
import { demonstratifAnimal, libelleChevre, statutLabel } from '@/features/cheptel/utils/chevreLabel';
import type { Chevre } from '@/features/cheptel/types';
import type { Controle, VisiteVeterinaire } from '@/features/exploitation/types';
import { SEXE } from '@/shared/constants/cheptel';
import { styles } from '@/shared/styles/cheptel/FicheChevre.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Liste des petits d'une chèvre (cliquables pour ouvrir leur fiche). */
export function ChevreDescendance({
  descendance,
  onOuvrir,
}: {
  descendance: Chevre[];
  onOuvrir: (id: string) => void;
}) {
  return (
    <Card>
      <Text style={commonStyles.cardTitle}>
        {TEXTES.cheptel.ficheChevre.descendance}
        {descendance.length})
      </Text>
      {descendance.map((d) => (
        <ListRow
          key={d.id}
          title={libelleChevre(d)}
          subtitle={TEXTES.commun.general.accordNeLeDate(
            d.sexe === SEXE.FEMELLE ? TEXTES.cheptel.ficheChevre.nee : TEXTES.cheptel.ficheChevre.ne,
            formatDateFR(d.dateNaissance),
          )}
          trailing={<Badge label={statutLabel(d.statut, d.sexe)} color={statutColors[d.statut]} />}
          onPress={() => onOuvrir(d.id)}
        />
      ))}
    </Card>
  );
}

/** Visites vétérinaires concernant l'animal. */
export function ChevreVisites({ chevre, visites }: { chevre: Chevre; visites: VisiteVeterinaire[] }) {
  return (
    <Card>
      <Text style={commonStyles.cardTitle}>
        {TEXTES.cheptel.ficheChevre.visitesVeterinaires}
        {visites.length})
      </Text>
      {visites.length === 0 ? (
        <Text style={commonStyles.muted}>
          {TEXTES.cheptel.ficheChevre.aucuneVisiteEnregistreePourEspace}
          {demonstratifAnimal(chevre)}.
        </Text>
      ) : (
        visites.map((v) => (
          <View key={v.id} style={styles.entry}>
            <Text style={commonStyles.lineSemiBold}>
              {formatDateFR(v.date)} — {v.motif}
            </Text>
            {v.description ? <Text style={commonStyles.muted}>{v.description}</Text> : null}
          </View>
        ))
      )}
    </Card>
  );
}

/** Contrôles concernant l'animal. */
export function ChevreControles({ chevre, controles }: { chevre: Chevre; controles: Controle[] }) {
  return (
    <Card>
      <Text style={commonStyles.cardTitle}>
        {TEXTES.cheptel.ficheChevre.controles}
        {controles.length})
      </Text>
      {controles.length === 0 ? (
        <Text style={commonStyles.muted}>
          {TEXTES.cheptel.ficheChevre.aucunControleEnregistrePourEspace}
          {demonstratifAnimal(chevre)}.
        </Text>
      ) : (
        controles.map((c) => (
          <View key={c.id} style={styles.entry}>
            <Text style={commonStyles.lineSemiBold}>
              {formatDateFR(c.date)} — {c.type}
            </Text>
            {c.resultat ? <Text style={commonStyles.muted}>{c.resultat}</Text> : null}
          </View>
        ))
      )}
    </Card>
  );
}
