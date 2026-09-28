import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { YearPicker } from '@/components/YearPicker';
import { colors } from '@/theme/colors';
import { useAppSettings } from '@/context/AppSettingsContext';
import { calculerBilan, toutesLesAnneesConnues, type Bilan, type DateEtNombre } from '@/storage/repositories';
import { formatDateFR } from '@/utils/dates';

/** Chèvres vivantes en fin d'année qui ne sont pas des renouvellements de cette année-là : le troupeau déjà établi. */
function chevresAnciennes(b: Bilan): number {
  return b.chevresVivantesFinAnnee - b.chevresRenouvellementFinAnnee;
}

/** Boucs vivants en fin d'année qui ne sont pas des renouvellements de cette année-là : le troupeau déjà établi. */
function boucsAnciens(b: Bilan): number {
  return b.boucsVivantsFinAnnee - b.boucsRenouvellementFinAnnee;
}

function VoirPlus({ ouvert, onToggle }: { ouvert: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle}>
      <Text style={styles.voirPlus}>{ouvert ? 'Voir moins' : 'Voir plus'}</Text>
    </Pressable>
  );
}

/** Liste les dates de sortie sous la ligne Abattoir, une par ligne, décalées et avec le nombre aligné à droite. */
function DatesAbattoir({ dates }: { dates: DateEtNombre[] }) {
  if (dates.length === 0) return null;
  return (
    <View style={styles.datesAbattoir}>
      {dates.map((d) => (
        <View key={d.date} style={styles.ligneDateAbattoir}>
          <Text style={styles.dateAbattoirTexte}>{formatDateFR(d.date)}</Text>
          <Text style={styles.dateAbattoirNombre}>{d.nombre}</Text>
        </View>
      ))}
    </View>
  );
}

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
  const { settings, setAnneeActive } = useAppSettings();
  const annee = settings.anneeActive;

  const [annees, setAnnees] = useState<number[]>([annee]);
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [bilanPrecedent, setBilanPrecedent] = useState<Bilan | null>(null);
  const [cabritsDetailsOuvert, setCabritsDetailsOuvert] = useState(false);
  const [chevresDetailsOuvert, setChevresDetailsOuvert] = useState(false);
  const [boucsDetailsOuvert, setBoucsDetailsOuvert] = useState(false);

  const charger = useCallback(async () => {
    const [b, bPrec, toutesAnnees] = await Promise.all([
      calculerBilan(annee),
      calculerBilan(annee - 1),
      toutesLesAnneesConnues(),
    ]);
    setBilan(b);
    setBilanPrecedent(bPrec);
    setAnnees(toutesAnnees);
  }, [annee]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  if (!bilan) return null;

  return (
    <Screen>
      <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />

      <Text style={styles.intro}>
        Comparaison {annee} (précédente année entre parenthèses : {annee - 1})
      </Text>

      <Card>
        <View style={styles.titreLigne}>
          <Text style={styles.cardTitle}>Cabris nés en {annee}</Text>
          <View style={styles.ligneValeurs}>
            <Text style={styles.cardTitreValeur}>{bilan.cabritsTotal}</Text>
            {bilanPrecedent && <Text style={styles.ligneComparaison}>({bilanPrecedent.cabritsTotal})</Text>}
          </View>
        </View>
        <Text style={styles.note}>
          Nés entre le 01/01 et le 31/12/{annee}. Vendus/Abattoir/Auto-consommation comptent les sorties
          de {annee} pour tout cabri encore âgé de moins de 6 mois à ce moment-là, même né l’année précédente.
        </Text>
        <Ligne
          label={`1er semestre (tardifs ${annee - 1})`}
          valeur={bilan.cabritsPremierSemestre}
          comparaison={bilanPrecedent?.cabritsPremierSemestre}
        />
        <Ligne
          label={`2e semestre (cabris ${annee})`}
          valeur={bilan.cabritsSecondSemestre}
          comparaison={bilanPrecedent?.cabritsSecondSemestre}
        />
        <VoirPlus ouvert={cabritsDetailsOuvert} onToggle={() => setCabritsDetailsOuvert((v) => !v)} />
        {cabritsDetailsOuvert && (
          <>
            <View style={styles.separateur} />
            <View style={styles.detailsSerres}>
              <Ligne label="Vendus" valeur={bilan.cabritsVendus} comparaison={bilanPrecedent?.cabritsVendus} />
              <Ligne label="Abattoir" valeur={bilan.cabritsAbattoir} comparaison={bilanPrecedent?.cabritsAbattoir} />
              <DatesAbattoir dates={bilan.cabritsAbattoirDates} />
              <Ligne label="Auto-consommation" valeur={bilan.cabritsAutoconsommes} comparaison={bilanPrecedent?.cabritsAutoconsommes} />
              <Ligne label="Mort-nés" valeur={bilan.cabritsMortNes} comparaison={bilanPrecedent?.cabritsMortNes} />
            </View>
            <View style={styles.separateur} />
            <Ligne label="Total cabris" valeur={bilan.cabritsRestants} comparaison={bilanPrecedent?.cabritsRestants} />
          </>
        )}
      </Card>

      <Card>
        <View style={styles.titreLigne}>
          <Text style={styles.cardTitle}>Chèvres</Text>
          <View style={styles.ligneValeurs}>
            <Text style={styles.cardTitreValeur}>{bilan.chevresVivantesFinAnnee}</Text>
            {bilanPrecedent && <Text style={styles.ligneComparaison}>({bilanPrecedent.chevresVivantesFinAnnee})</Text>}
          </View>
        </View>
        <Text style={styles.note}>
          Chèvres (femelles, 6 mois et plus) vivantes au 31/12/{annee}, reconstitué à partir des statuts actuels.
        </Text>
        <Ligne
          label="Renouvellement (désignées cette année)"
          valeur={bilan.chevresRenouvellementFinAnnee}
          comparaison={bilanPrecedent?.chevresRenouvellementFinAnnee}
        />
        <Ligne
          label="Plus anciennes"
          valeur={chevresAnciennes(bilan)}
          comparaison={bilanPrecedent ? chevresAnciennes(bilanPrecedent) : undefined}
        />
        <VoirPlus ouvert={chevresDetailsOuvert} onToggle={() => setChevresDetailsOuvert((v) => !v)} />
        {chevresDetailsOuvert && (
          <>
            <View style={styles.separateur} />
            <View style={styles.detailsSerres}>
              <Ligne label="Mortes" valeur={bilan.chevresMortesAnnee} comparaison={bilanPrecedent?.chevresMortesAnnee} />
              <Ligne label="Abattoir" valeur={bilan.chevresAbattoirAnnee} comparaison={bilanPrecedent?.chevresAbattoirAnnee} />
              <DatesAbattoir dates={bilan.chevresAbattoirDates} />
              <Ligne label="Vendues" valeur={bilan.chevresVenduesAnnee} comparaison={bilanPrecedent?.chevresVenduesAnnee} />
              <Ligne label="Auto-consommation" valeur={bilan.chevresAutoconsommeesAnnee} comparaison={bilanPrecedent?.chevresAutoconsommeesAnnee} />
              <Ligne label="Mises bas (portées)" valeur={bilan.miseBasCount} comparaison={bilanPrecedent?.miseBasCount} />
            </View>
          </>
        )}
      </Card>

      <Card>
        <View style={styles.titreLigne}>
          <Text style={styles.cardTitle}>Boucs</Text>
          <View style={styles.ligneValeurs}>
            <Text style={styles.cardTitreValeur}>{bilan.boucsVivantsFinAnnee}</Text>
            {bilanPrecedent && <Text style={styles.ligneComparaison}>({bilanPrecedent.boucsVivantsFinAnnee})</Text>}
          </View>
        </View>
        <Text style={styles.note}>
          Boucs (mâles, 6 mois et plus) vivants au 31/12/{annee}, reconstitué à partir des statuts actuels.
        </Text>
        <Ligne
          label="Renouvellement (désignés cette année)"
          valeur={bilan.boucsRenouvellementFinAnnee}
          comparaison={bilanPrecedent?.boucsRenouvellementFinAnnee}
        />
        <Ligne
          label="Plus anciens"
          valeur={boucsAnciens(bilan)}
          comparaison={bilanPrecedent ? boucsAnciens(bilanPrecedent) : undefined}
        />
        <VoirPlus ouvert={boucsDetailsOuvert} onToggle={() => setBoucsDetailsOuvert((v) => !v)} />
        {boucsDetailsOuvert && (
          <>
            <View style={styles.separateur} />
            <View style={styles.detailsSerres}>
              <Ligne label="Morts" valeur={bilan.boucsMortsAnnee} comparaison={bilanPrecedent?.boucsMortsAnnee} />
              <Ligne label="Abattoir" valeur={bilan.boucsAbattoirAnnee} comparaison={bilanPrecedent?.boucsAbattoirAnnee} />
              <DatesAbattoir dates={bilan.boucsAbattoirDates} />
              <Ligne label="Vendus" valeur={bilan.boucsVendusAnnee} comparaison={bilanPrecedent?.boucsVendusAnnee} />
              <Ligne label="Auto-consommation" valeur={bilan.boucsAutoconsommesAnnee} comparaison={bilanPrecedent?.boucsAutoconsommesAnnee} />
            </View>
          </>
        )}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Effectif du troupeau</Text>
        <Ligne label={`Au 01/01/${annee}`} valeur={bilan.stockDebutAnnee} />
        <Ligne label={`Effectif actuel / fin ${annee}`} valeur={bilan.stockFinAnnee} />
        <Text style={styles.note}>
          Chèvres, boucs et cabris confondus, vivants (ou sortis après le 31/12/{annee}) d’après les statuts actuels.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 13, color: colors.textMuted },
  titreLigne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardTitreValeur: { fontSize: 15, fontWeight: '800', color: colors.text },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  ligneLabel: { fontSize: 14, color: colors.text, flexShrink: 1 },
  ligneValeurs: { flexDirection: 'row', gap: 6, alignItems: 'baseline' },
  ligneValeur: { fontSize: 15, fontWeight: '700', color: colors.text },
  ligneComparaison: { fontSize: 13, color: colors.textMuted },
  separateur: { borderTopWidth: 1, borderTopColor: colors.border, marginVertical: 4 },
  detailsSerres: { gap: 2 },
  note: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 },
  voirPlus: { fontSize: 13, fontWeight: '600', color: colors.ajout, textDecorationLine: 'underline', marginTop: 4 },
  datesAbattoir: { marginBottom: 2, gap: 1 },
  ligneDateAbattoir: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 20 },
  dateAbattoirTexte: { fontSize: 12, color: colors.textMuted },
  dateAbattoirNombre: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
});
