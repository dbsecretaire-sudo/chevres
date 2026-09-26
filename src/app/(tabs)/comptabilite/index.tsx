import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { ListRow } from '@/components/ListRow';
import { EmptyState } from '@/components/EmptyState';
import { YearPicker } from '@/components/YearPicker';
import { Fab } from '@/components/Fab';
import { FiltreTransactionsModal, type FiltresTransactions } from '@/components/FiltreTransactionsModal';
import { colors } from '@/theme/colors';
import { useAppSettings } from '@/context/AppSettingsContext';
import { listTransactions, toutesLesAnneesConnues, type Transaction } from '@/storage/repositories';
import { formatDateFR, formatMontant } from '@/utils/dates';

const FILTRES_VIDES: FiltresTransactions = { dateDebut: '', dateFin: '', montantMin: '', montantMax: '' };

export default function ComptabiliteIndex() {
  const router = useRouter();
  const { settings, setAnneeActive } = useAppSettings();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtres, setFiltres] = useState<FiltresTransactions>(FILTRES_VIDES);
  const [filtreOuvert, setFiltreOuvert] = useState(false);

  const charger = useCallback(async () => {
    const [toutesAnnees, liste] = await Promise.all([
      toutesLesAnneesConnues(),
      listTransactions(settings.anneeActive),
    ]);
    setAnnees(toutesAnnees);
    setTransactions(liste);
  }, [settings.anneeActive]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const filtrees = useMemo(() => {
    const min = filtres.montantMin ? Number(filtres.montantMin.replace(',', '.')) : undefined;
    const max = filtres.montantMax ? Number(filtres.montantMax.replace(',', '.')) : undefined;
    return transactions.filter((t) => {
      if (filtres.dateDebut && t.date < filtres.dateDebut) return false;
      if (filtres.dateFin && t.date > filtres.dateFin) return false;
      if ((min !== undefined || max !== undefined)) {
        if (t.montant === undefined) return false;
        if (min !== undefined && t.montant < min) return false;
        if (max !== undefined && t.montant > max) return false;
      }
      return true;
    });
  }, [transactions, filtres]);

  const balance = filtrees.reduce((s, t) => s + (t.montant ?? 0) * (t.sens === 'entree' ? 1 : -1), 0);
  const filtresActifs = filtres.dateDebut || filtres.dateFin || filtres.montantMin || filtres.montantMax;

  return (
    <Screen scroll={false}>
      <View style={styles.top}>
        <YearPicker annees={annees} value={settings.anneeActive} onChange={setAnneeActive} />

        <View style={styles.row}>
          <Pressable style={styles.filtreBouton} onPress={() => setFiltreOuvert(true)}>
            <Text style={styles.filtreTexte}>{filtresActifs ? 'Filtres actifs' : 'Filtrer'}</Text>
          </Pressable>
          {!!filtresActifs && (
            <Pressable style={styles.filtreEffacer} onPress={() => setFiltres(FILTRES_VIDES)}>
              <Text style={styles.filtreEffacerTexte}>Effacer</Text>
            </Pressable>
          )}
        </View>

        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde {filtresActifs ? '(filtré)' : settings.anneeActive}</Text>
          <Text style={[styles.balanceValeur, { color: balance >= 0 ? colors.primary : colors.danger }]}>
            {formatMontant(balance)}
          </Text>
        </Card>
      </View>

      <FlatList
        data={filtrees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="Aucune écriture" subtitle="Ventes et factures de l'année apparaîtront ici." />}
        renderItem={({ item }) => (
          <ListRow
            title={item.titre}
            subtitle={`${formatDateFR(item.date)} · ${item.sousTitre}`}
            trailing={
              <Text style={[styles.montant, { color: item.sens === 'entree' ? colors.primary : colors.danger }]}>
                {item.montant !== undefined ? `${item.sens === 'entree' ? '+' : '-'}${formatMontant(item.montant)}` : '—'}
              </Text>
            }
            onPress={() => {
              if (item.source === 'facture') {
                router.push(`/comptabilite/facture/${item.id}`);
              } else {
                router.push(`/comptabilite/vente/${item.id}`);
              }
            }}
          />
        )}
      />

      <FiltreTransactionsModal
        visible={filtreOuvert}
        onClose={() => setFiltreOuvert(false)}
        valeur={filtres}
        onChange={setFiltres}
      />

      <Fab
        options={[
          {
            label: '- Débit',
            icon: 'remove-circle',
            color: colors.danger,
            onPress: () => router.push({ pathname: '/comptabilite/nouvelle', params: { type: 'recue' } }),
          },
          {
            label: '+ Crédit',
            icon: 'add-circle',
            color: colors.primary,
            onPress: () => router.push({ pathname: '/comptabilite/nouvelle', params: { type: 'emise' } }),
          },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  filtreBouton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.badgeBg },
  filtreTexte: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  filtreEffacer: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.danger + '22' },
  filtreEffacerTexte: { fontSize: 13, fontWeight: '700', color: colors.danger },
  balanceCard: { alignItems: 'center' },
  balanceLabel: { fontSize: 12, color: colors.textMuted },
  balanceValeur: { fontSize: 22, fontWeight: '800' },
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
  montant: { fontSize: 15, fontWeight: '700' },
});
