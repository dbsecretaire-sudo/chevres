import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { YearPicker } from '@/components/YearPicker';
import { colors } from '@/theme/colors';
import { useAppSettings } from '@/context/AppSettingsContext';
import { calculerRecettesMensuelles, toutesLesAnneesConnues, type RecettesMois } from '@/storage/repositories';
import { formatMontant } from '@/utils/dates';

const NOM_MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export default function FiscaliteRSA() {
  const { settings, setAnneeActive } = useAppSettings();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [mois, setMois] = useState<RecettesMois[]>([]);

  const charger = useCallback(async () => {
    const [toutesAnnees, m] = await Promise.all([
      toutesLesAnneesConnues(),
      calculerRecettesMensuelles(settings.anneeActive),
    ]);
    setAnnees(toutesAnnees);
    setMois(m);
  }, [settings.anneeActive]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  return (
    <Screen>
      <YearPicker annees={annees} value={settings.anneeActive} onChange={setAnneeActive} />

      <Card>
        <Text style={styles.cardTitle}>Recettes par mois — {settings.anneeActive}</Text>
        {mois.map((m) => (
          <View key={m.mois} style={styles.ligne}>
            <Text style={styles.moisLabel}>{NOM_MOIS[m.mois - 1]}</Text>
            <Text style={styles.moisValeur}>{formatMontant(m.total)}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Notice explicative — à vérifier avant usage officiel</Text>
        <Text style={styles.para}>
          Chaque ligne mensuelle additionne : vos ventes de production encaissées ce mois-là (lait, fromage,
          cabris) et vos factures émises (ventes et aides) datées de ce mois. C’est un montant de chiffre
          d’affaires / recettes encaissées, mois par mois.
        </Text>
        <Text style={styles.para}>
          La déclaration trimestrielle de ressources (DTR) pour le RSA, pour un exploitant agricole non-salarié,
          demande généralement le montant du chiffre d’affaires (ou des recettes) de chacun des 3 derniers mois —
          c’est ce que ces lignes visent à vous donner rapidement.
        </Text>
        <Text style={styles.paraGras}>
          Ce que l’app NE calcule PAS volontairement : le montant de « ressources » retenu par la CAF/MSA après
          abattement forfaitaire pour charges professionnelles. Ce taux d’abattement dépend de votre statut exact et
          peut changer — vérifiez-le sur le formulaire de déclaration lui-même, auprès de votre CAF ou de votre MSA
          avant de reporter un montant.
        </Text>
        <Text style={styles.source}>
          Sources à consulter en cas de doute : votre espace personnel caf.fr, le formulaire de déclaration
          trimestrielle reçu par courrier/email, ou votre conseiller MSA.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  moisLabel: { fontSize: 14, color: colors.text },
  moisValeur: { fontSize: 14, fontWeight: '700', color: colors.text },
  para: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  paraGras: { fontSize: 13, color: colors.text, lineHeight: 19, fontWeight: '600' },
  source: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 },
});
