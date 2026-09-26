import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { useAppSettings } from '@/context/AppSettingsContext';
import { calculerBilan, type Bilan } from '@/storage/repositories';
import { getSettings, setDeclarationAnnee } from '@/storage/settings';

function Ligne({ label, valeur, comparaison }: { label: string; valeur: number; comparaison?: number }) {
  return (
    <View style={styles.ligne}>
      <Text style={styles.ligneLabel}>{label}</Text>
      <View style={styles.ligneValeurs}>
        <Text style={styles.ligneValeur}>{valeur}</Text>
        {comparaison !== undefined && <Text style={styles.ligneComparaison}>({comparaison})</Text>}
      </View>
    </View>
  );
}

export default function BilanAnnuel() {
  const { settings } = useAppSettings();
  const annee = settings.anneeActive;

  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [bilanPrecedent, setBilanPrecedent] = useState<Bilan | null>(null);
  const [declare, setDeclare] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);

  const charger = useCallback(async () => {
    const [b, bPrec, s] = await Promise.all([
      calculerBilan(annee),
      calculerBilan(annee - 1),
      getSettings(),
    ]);
    setBilan(b);
    setBilanPrecedent(bPrec);
    setDeclare(s.declarations?.[String(annee)] !== undefined ? String(s.declarations[String(annee)]) : '');
  }, [annee]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const enregistrerDeclare = async () => {
    setEnregistrement(true);
    try {
      const valeur = declare.trim() ? Number(declare.trim()) : undefined;
      await setDeclarationAnnee(annee, Number.isFinite(valeur) ? valeur : undefined);
    } finally {
      setEnregistrement(false);
    }
  };

  if (!bilan) return null;

  const ecart = declare.trim() ? bilan.stockFinAnnee - Number(declare.trim()) : undefined;

  return (
    <Screen>
      <Text style={styles.intro}>
        Comparaison {annee} (précédente année entre parenthèses : {annee - 1})
      </Text>

      <Card>
        <Text style={styles.cardTitle}>Cabrits nés en {annee}</Text>
        <Ligne label="Renouvellement (gardés)" valeur={bilan.cabritsRenouvellement} comparaison={bilanPrecedent?.cabritsRenouvellement} />
        <Ligne label="Vendus" valeur={bilan.cabritsVendus} comparaison={bilanPrecedent?.cabritsVendus} />
        <Ligne label="Abattoir" valeur={bilan.cabritsAbattoir} comparaison={bilanPrecedent?.cabritsAbattoir} />
        <Ligne label="Auto-consommation" valeur={bilan.cabritsAutoconsommes} comparaison={bilanPrecedent?.cabritsAutoconsommes} />
        <Ligne label="Mort-nés" valeur={bilan.cabritsMortNes} comparaison={bilanPrecedent?.cabritsMortNes} />
        <View style={styles.separateur} />
        <Ligne label="Total cabrits" valeur={bilan.cabritsTotal} comparaison={bilanPrecedent?.cabritsTotal} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Chèvres (troupeau déjà présent)</Text>
        <Ligne label="Mortes" valeur={bilan.chevresMortesAnnee} comparaison={bilanPrecedent?.chevresMortesAnnee} />
        <Ligne label="Abattoir" valeur={bilan.chevresAbattoirAnnee} comparaison={bilanPrecedent?.chevresAbattoirAnnee} />
        <Ligne label="Vendues" valeur={bilan.chevresVenduesAnnee} comparaison={bilanPrecedent?.chevresVenduesAnnee} />
        <Ligne label="Auto-consommation" valeur={bilan.chevresAutoconsommeesAnnee} comparaison={bilanPrecedent?.chevresAutoconsommeesAnnee} />
        <View style={styles.separateur} />
        <Ligne label="Mises bas (portées)" valeur={bilan.miseBasCount} comparaison={bilanPrecedent?.miseBasCount} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Effectif du troupeau</Text>
        <Ligne label={`Au 01/01/${annee}`} valeur={bilan.stockDebutAnnee} />
        <Ligne label={`Effectif actuel / fin ${annee}`} valeur={bilan.stockFinAnnee} />
        <View style={styles.separateur} />
        <FormField
          label="Nombre officiellement déclaré"
          value={declare}
          onChangeText={setDeclare}
          keyboardType="number-pad"
          placeholder="ex: 194"
        />
        {ecart !== undefined && (
          <Text style={[styles.ecart, { color: ecart === 0 ? colors.primary : colors.danger }]}>
            Écart avec l’effectif calculé : {ecart > 0 ? '+' : ''}{ecart}
          </Text>
        )}
        <Button label="Enregistrer" variant="secondary" onPress={enregistrerDeclare} loading={enregistrement} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 13, color: colors.textMuted },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  ligneLabel: { fontSize: 14, color: colors.text, flexShrink: 1 },
  ligneValeurs: { flexDirection: 'row', gap: 6, alignItems: 'baseline' },
  ligneValeur: { fontSize: 15, fontWeight: '700', color: colors.text },
  ligneComparaison: { fontSize: 13, color: colors.textMuted },
  separateur: { borderTopWidth: 1, borderTopColor: colors.border, marginVertical: 4 },
  ecart: { fontSize: 14, fontWeight: '700' },
});
