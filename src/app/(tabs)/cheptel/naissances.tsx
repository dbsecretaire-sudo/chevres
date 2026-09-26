import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { colors, statutColors } from '@/theme/colors';
import { listNaissancesGroupees, type PorteeNaissance } from '@/storage/repositories';
import { formatDateFR } from '@/utils/dates';
import { statutLabel } from '@/utils/chevreLabel';

export default function Naissances() {
  const router = useRouter();
  const [portees, setPortees] = useState<PorteeNaissance[]>([]);

  useFocusEffect(
    useCallback(() => {
      listNaissancesGroupees().then(setPortees);
    }, []),
  );

  return (
    <Screen scroll={false}>
      <FlatList
        data={portees}
        keyExtractor={(item) => `${item.mereNumeroBoucle}__${item.date}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="Aucune naissance enregistrée"
            subtitle="Déclarez une naissance depuis l'onglet Cheptel."
          />
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.header}>
              <Text style={styles.title}>Mère {item.mereNumeroBoucle}</Text>
              <Text style={styles.date}>{formatDateFR(item.date)}</Text>
            </View>
            <Text style={styles.subtitle}>
              {item.cabrits.length} cabrit{item.cabrits.length > 1 ? 's' : ''} ·{' '}
              {item.cabrits.filter((c) => c.sexe === 'F').length} F ·{' '}
              {item.cabrits.filter((c) => c.sexe === 'M').length} M
            </Text>
            <View style={styles.cabritsRow}>
              {item.cabrits.map((c) => (
                <View key={c.id} style={styles.cabritChip}>
                  <Text
                    style={styles.cabritChipText}
                    onPress={() => router.push(`/cheptel/${c.id}`)}
                  >
                    {c.numeroBoucle ?? `sans boucle (${c.sexe})`}
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

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  date: { fontSize: 13, color: colors.textMuted },
  subtitle: { fontSize: 13, color: colors.textMuted },
  cabritsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  cabritChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.badgeBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cabritChipText: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
});
