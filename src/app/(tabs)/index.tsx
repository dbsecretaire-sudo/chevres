import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { useAppSettings } from '@/context/AppSettingsContext';
import { formatMontant } from '@/utils/dates';
import {
  listChevresHistorique,
  listChevresVivantes,
  listFactures,
  listVentes,
  listVisitesVeterinaire,
} from '@/storage/repositories';

interface Stats {
  totalVivantes: number;
  sorties: number;
  cabritsAnnee: number;
  ventesTotal: number;
  entrees: number;
  facturesRecues: number;
  soldeFactures: number;
  derniereVisite?: string;
}

export default function Accueil() {
  const router = useRouter();
  const { settings } = useAppSettings();
  const [stats, setStats] = useState<Stats | null>(null);

  const charger = useCallback(async () => {
    const annee = settings.anneeActive;
    const [vivantes, historique, ventes, factures, visites] = await Promise.all([
      listChevresVivantes(),
      listChevresHistorique(),
      listVentes(annee),
      listFactures(annee),
      listVisitesVeterinaire(annee),
    ]);

    const cabritsAnnee = vivantes.filter(
      (c) => c.mereNumeroBoucle && c.dateNaissance.startsWith(String(annee)),
    ).length;

    const ventesTotal = ventes.reduce(
      (sum, v) => sum + (v.prix ?? 0),
      0,
    );

    const facturesEmises = factures
      .filter((f) => f.type === 'emise')
      .reduce(
        (sum, f) => sum + (f.montant ?? 0),
        0,
      );
    const facturesRecues = factures
      .filter((f) => f.type === 'recue')
      .reduce(
        (sum, f) => sum + (f.montant ?? 0),
        0,
      );

    const entrees = ventesTotal + facturesEmises;
    const soldeFactures = entrees - facturesRecues;

    setStats({
      totalVivantes: vivantes.length,
      sorties: historique.length,
      cabritsAnnee,
      ventesTotal,
      entrees,
      facturesRecues,
      soldeFactures,
      derniereVisite: visites[0]?.date,
    });
  }, [settings.anneeActive]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return (
    <Screen>
      <Text style={styles.heading}>Troupeau — {settings.anneeActive}</Text>

      <View style={styles.grid}>
        <Card style={styles.gridCard}>
          <Text style={styles.statValue}>{stats?.totalVivantes ?? '—'}</Text>
          <Text style={styles.statLabel}>Chèvres vivantes</Text>
          <Text style={styles.statSub}>
            {stats ? `${stats.totalVivantes} vivante${stats.totalVivantes > 1 ? 's' : ''} - ${stats.sorties} morte${stats.sorties > 1 ? 's' : ''}/vendue${stats.sorties > 1 ? 's' : ''}/à l’abattoir` : ''}
          </Text>
        </Card>
        <Card style={styles.gridCard}>
          <Text style={styles.statValue}>{stats?.cabritsAnnee ?? '—'}</Text>
          <Text style={styles.statLabel}>Cabrits nés en {settings.anneeActive}</Text>
        </Card>
      </View>

      <View style={styles.grid}>
        <Card style={styles.gridCard}>
          <Text style={styles.statValue}>{formatMontant(stats?.ventesTotal)}</Text>
          <Text style={styles.statLabel}>Ventes {settings.anneeActive}</Text>
        </Card>
        <Card style={styles.gridCard}>
          <Text
            style={[
              styles.statValue,
              { color: stats && stats.soldeFactures < 0 ? colors.danger : colors.primary },
            ]}
          >
            {stats ? formatMontant(stats.soldeFactures) : '—'}
          </Text>
          <Text style={styles.statLabel}>Solde factures</Text>
          <Text style={styles.statSub}>
            {stats ? `+${formatMontant(stats.entrees)} / -${formatMontant(stats.facturesRecues)}` : ''}
          </Text>
        </Card>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Dernière visite vétérinaire</Text>
        <Text style={styles.cardBody}>
          {stats?.derniereVisite
            ? new Date(stats.derniereVisite).toLocaleDateString('fr-FR')
            : 'Aucune visite enregistrée cette année'}
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>Actions rapides</Text>
      <View style={styles.actions}>
        <Button style={styles.flex1} label="+ Cheptel" onPress={() => router.push('/cheptel/ajout-rapide')} />
        <Button
          style={styles.flex1}
          label="+ Comptabilité"
          onPress={() => router.push('/comptabilite/nouvelle')}
          variant="secondary"
        />
      </View>

      <Button
        label="Informations de l’exploitation"
        variant="secondary"
        onPress={() => router.push('/informations-exploitation')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  grid: { flexDirection: 'row', gap: 12 },
  gridCard: { flex: 1 },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  statSub: { fontSize: 12, color: colors.textMuted },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardBody: { fontSize: 15, color: colors.textMuted },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
});
