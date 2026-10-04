import { useCallback, useState } from 'react';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { EmptyState } from '@/shared/components/EmptyState';
import { statutColors } from '@/shared/theme/colors';
import { listNaissancesGroupees, type PorteeNaissance } from '@/features/cheptel/repository/naissances';
import { formatDateFR } from '@/shared/utils/dates';
import { statutLabel } from '@/features/cheptel/utils/chevreLabel';
import { styles } from '@/shared/styles/cheptel/Naissances.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { SEXE } from '@/shared/constants/cheptel';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';

export default function Naissances() {
  const router = useRouter();
  // L'espèce active : l'écran se recharge quand elle change, sans être recréé.
  const { espece } = useEtablissement();
  const [portees, setPortees] = useState<PorteeNaissance[]>([]);

  useFocusEffect(
    useCallback(() => {
      listNaissancesGroupees().then(setPortees);
      // L'espèce n'est pas lue dans le chargement : elle sert à le relancer quand elle change.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [espece]),
  );

  return (
    <Screen scroll={false}>
      <SelecteurEspece />
      <FlatList
        data={portees}
        keyExtractor={(item) => `${item.mereNumeroBoucle}__${item.date}`}
        contentContainerStyle={commonStyles.listBox}
        ListEmptyComponent={
          <EmptyState
            title={TEXTES.cheptel.naissances.aucuneNaissanceEnregistree}
            subtitle={TEXTES.cheptel.naissances.declarezUneNaissanceDepuisL}
          />
        }
        renderItem={({ item }) => (
          <Card>
            <View style={commonStyles.rowSpaceBetween}>
              <Text style={commonStyles.cardTitle}>
                {TEXTES.cheptel.naissances.mereEspace}
                {item.mereNumeroBoucle}
              </Text>
              <Text style={commonStyles.muted}>{formatDateFR(item.date)}</Text>
            </View>
            <Text style={commonStyles.muted}>
              {item.cabrits.length} {TEXTES.cheptel.naissances.cabri}
              {item.cabrits.length > 1 ? 's' : ''} ·{' '}
              {item.cabrits.filter((c) => c.sexe === SEXE.FEMELLE).length} F ·{' '}
              {item.cabrits.filter((c) => c.sexe === SEXE.MALE).length} M
            </Text>
            <View style={styles.cabritsRow}>
              {item.cabrits.map((c) => (
                <View key={c.id} style={styles.cabritChip}>
                  <Text style={styles.cabritChipText} onPress={() => router.push(ROUTES.ficheChevre(c.id))}>
                    {c.numeroBoucle ?? TEXTES.cheptel.naissances.sansBoucleSexe(c.sexe)}
                  </Text>
                  <Badge label={statutLabel(c.statut, c.sexe)} color={statutColors[c.statut]} />
                </View>
              ))}
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}
