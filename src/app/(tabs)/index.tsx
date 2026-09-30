import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { useAppSettings } from '@/context/AppSettingsContext';
import { formatMontant } from '@/utils/dates';
import {
  calculerBilanAlimentation,
  listChevresVivantes,
  listFactures,
  listVentes,
  listVisitesVeterinaire,
  montantAlimentationHorsAutre,
} from '@/storage/repositories';
import { categorieAnimal } from '@/utils/chevreLabel';
import type { Chevre } from '@/types/models';

function formatKg(kg: number): string {
  return `${kg.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kg`;
}

function formatG(g: number): string {
  return `${g.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} g`;
}

/** Cabrit = moins de 6 mois OU pas encore bouclé (même si plus âgé) ; sinon chèvre/bouc selon le sexe. */
function categorieAccueil(c: Chevre): 'chevre' | 'bouc' | 'cabrit' {
  if (!c.numeroBoucle || categorieAnimal(c) === 'cabrit') return 'cabrit';
  return c.sexe === 'M' ? 'bouc' : 'chevre';
}

interface Stats {
  totalVivantes: number;
  chevres: number;
  boucs: number;
  cabrits: number;
  cabritsAnnee: number;
  ventesTotal: number;
  soldeFactures: number;
  kgParAnimalAlimentation?: number;
  gParAnimalParJour: number | undefined;
  derniereVisite?: string;
}

export default function Accueil() {
  const router = useRouter();
  const { settings } = useAppSettings();
  const [stats, setStats] = useState<Stats | null>(null);

  const charger = useCallback(async () => {
    const annee = settings.anneeActive;
    const [vivantes, ventes, factures, visites, alimentation] = await Promise.all([
      listChevresVivantes(),
      listVentes(annee),
      listFactures(annee),
      listVisitesVeterinaire(annee),
      calculerBilanAlimentation(annee),
    ]);

    const chevres = vivantes.filter((c) => categorieAccueil(c) === 'chevre').length;
    const boucs = vivantes.filter((c) => categorieAccueil(c) === 'bouc').length;
    const cabrits = vivantes.filter((c) => categorieAccueil(c) === 'cabrit').length;

    const cabritsAnnee = vivantes.filter(
      (c) => c.mereNumeroBoucle && c.dateNaissance.startsWith(String(annee)),
    ).length;

    const ventesTotal = ventes.reduce(
      (sum, v) => sum + (v.prix ?? 0),
      0,
    );

    // « Autre » n'est pas représentatif de la santé financière de l'activité : exclu du solde, y
    // compris la part « Autre » à l'intérieur d'une facture Alimentation regroupant plusieurs lignes.
    const facturesEmises = factures
      .filter((f) => f.type === 'emise')
      .reduce((sum, f) => sum + montantAlimentationHorsAutre(f), 0);
    const facturesRecues = factures
      .filter((f) => f.type === 'recue')
      .reduce((sum, f) => sum + montantAlimentationHorsAutre(f), 0);

    const entrees = ventesTotal + facturesEmises;
    const soldeFactures = entrees - facturesRecues;

    setStats({
      totalVivantes: vivantes.length,
      chevres,
      boucs,
      cabrits,
      cabritsAnnee,
      ventesTotal,
      soldeFactures,
      kgParAnimalAlimentation: alimentation.kgParAnimal,
      gParAnimalParJour: alimentation.gParAnimalParJour,
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
        <Pressable
          style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}
          onPress={() => router.push('/cheptel')}
        >
          <Card>
            <Text style={styles.statValue}>{stats?.totalVivantes ?? '—'}</Text>
            <Text style={styles.statLabel}>Animaux vivants</Text>
            <Text style={styles.statSub}>
              {stats ? `${stats.chevres} chèvre${stats.chevres > 1 ? 's' : ''} · ${stats.boucs} bouc${stats.boucs > 1 ? 's' : ''} · ${stats.cabrits} cabri${stats.cabrits > 1 ? 's' : ''}` : ''}
            </Text>
          </Card>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}
          onPress={() => router.push('/cheptel/bilan')}
        >
          <Card>
            <Text style={styles.statValue}>{stats?.cabritsAnnee ?? '—'}</Text>
            <Text style={styles.statLabel}>Cabris nés en {settings.anneeActive}</Text>
          </Card>
        </Pressable>
      </View>

      <View style={styles.grid}>
        <Pressable
          style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}
          onPress={() => router.push('/exploitation/alimentation')}
        >
          <Card>
            <Text style={styles.statValue}>
              {stats?.gParAnimalParJour !== undefined ? formatG(stats.gParAnimalParJour) : '—'}
            </Text>
            <Text style={styles.statLabel}>d’aliment / animal / jour</Text>
          </Card>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}
          onPress={() => router.push('/comptabilite')}
        >
          <Card>
            <Text
              style={[
                styles.statValue,
                { color: stats && stats.soldeFactures < 0 ? colors.danger : colors.primary },
              ]}
            >
              {stats ? formatMontant(stats.soldeFactures) : '—'}
            </Text>
            <Text style={styles.statLabel}>Solde factures (hors Autre)</Text>
          </Card>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => pressed && styles.pressed}
        onPress={() => router.push('/exploitation/veterinaire')}
      >
        <Card>
          <Text style={styles.cardTitle}>Dernière visite vétérinaire</Text>
          <Text style={styles.cardBody}>
            {stats?.derniereVisite
              ? new Date(stats.derniereVisite).toLocaleDateString('fr-FR')
              : 'Aucune visite enregistrée cette année'}
          </Text>
        </Card>
      </Pressable>

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
  pressed: { opacity: 0.7 },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  statSub: { fontSize: 12, color: colors.textMuted },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardBody: { fontSize: 15, color: colors.textMuted },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
});
