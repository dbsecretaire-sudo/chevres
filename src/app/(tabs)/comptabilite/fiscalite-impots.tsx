import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { YearPicker } from '@/components/YearPicker';
import { colors } from '@/theme/colors';
import { useAppSettings } from '@/context/AppSettingsContext';
import { calculerRecettesMicroBA, toutesLesAnneesConnues, type RecettesMicroBA } from '@/storage/repositories';
import { formatMontant } from '@/utils/dates';

export default function FiscaliteImpots() {
  const { settings, setAnneeActive } = useAppSettings();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [recettes, setRecettes] = useState<RecettesMicroBA | null>(null);

  const charger = useCallback(async () => {
    const [toutesAnnees, r] = await Promise.all([
      toutesLesAnneesConnues(),
      calculerRecettesMicroBA(settings.anneeActive),
    ]);
    setAnnees(toutesAnnees);
    setRecettes(r);
  }, [settings.anneeActive]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  return (
    <Screen>
      <YearPicker annees={annees} value={settings.anneeActive} onChange={setAnneeActive} />

      {recettes && (
        <Card>
          <Text style={styles.cardTitle}>Recettes brutes — {settings.anneeActive}</Text>
          <Ligne label="Ventes de production (lait, fromage, cabris)" valeur={recettes.ventesProduits} />
          <Ligne label="Aides imposables" valeur={recettes.aidesImposables} />
          <Ligne label="Autres factures émises" valeur={recettes.autresRecettesImposables} />
          <View style={styles.separateur} />
          <Ligne label="Total recettes imposables" valeur={recettes.totalImposable} gras />
        </Card>
      )}

      {recettes && recettes.aidesParType.length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>Détail des aides par type — {settings.anneeActive}</Text>
          <Text style={styles.info}>
            Le caractère imposable est celui que vous avez indiqué à la saisie de chaque aide — vérifiez-le type par
            type, il peut différer d’une aide à l’autre (voir notice ci-dessous).
          </Text>
          {recettes.aidesParType.map((a) => (
            <View key={a.libelle} style={styles.aideBloc}>
              <Text style={styles.aideTitre}>{a.libelle}</Text>
              {a.imposable > 0 && <Ligne label="Imposable" valeur={a.imposable} />}
              {a.nonImposable > 0 && <Ligne label="Non imposable" valeur={a.nonImposable} />}
            </View>
          ))}
        </Card>
      )}

      <Card>
        <Text style={styles.cardTitle}>Notice explicative — à vérifier avant usage officiel</Text>
        <Text style={styles.para}>
          Ce total additionne, pour l’année sélectionnée : vos ventes de production enregistrées (lait, fromage,
          cabris), vos factures émises hors aides, et les aides que vous avez marquées « imposable » (voir le détail
          par type ci-dessus — chaque type d’aide PAC peut avoir un traitement fiscal différent, c’est pour ça que
          la ventilation est faite type par type plutôt qu’un seul total générique).
        </Text>
        <Text style={styles.para}>
          Cela correspond à la notion de « recettes brutes encaissées » du régime micro-BA (Code général des
          impôts, art. 64 bis). Ce régime s’applique si vos recettes moyennes sur 3 ans ne dépassent pas le seuil
          en vigueur.
        </Text>
        <Text style={styles.paraGras}>
          Ce que l’app NE calcule PAS volontairement : l’abattement forfaitaire pour frais (son taux et son
          plancher minimum changent selon les années fiscales) et le montant net imposable qui en résulte. Reportez
          le total ci-dessus sur votre déclaration 2042-C-PRO (rubrique Bénéfices agricoles, régime micro-BA), et
          laissez l’administration ou votre comptable appliquer l’abattement en vigueur — ou vérifiez son taux
          exact sur impots.gouv.fr avant de le faire vous-même.
        </Text>
        <Text style={styles.para}>
          Le « taux d’imposition » saisi pour chaque aide (dans le détail ci-dessus) ne fixe que la part du
          montant incluse dans ce total de recettes brutes — pas votre taux d’impôt réel. L’app pré-remplit 100 %
          par défaut, mais ce n’est qu’un point de départ modifiable pour chaque aide, y compris les types PAC
          répertoriés : certaines aides (notamment à l’investissement) peuvent être étalées sur plusieurs années
          ou traitées différemment — vérifiez le taux adapté à chaque aide avec votre comptable/CGA plutôt que de
          vous fier à la valeur pré-remplie. Ensuite, sur le total de vos recettes, s’appliquent l’abattement
          forfaitaire évoqué ci-dessus puis le barème progressif de l’impôt sur le revenu de votre foyer (par
          tranches, de 0 à 45 %), qui dépend de vos autres revenus et de votre quotient familial — l’app ne peut
          pas l’estimer à partir des seules données de l’exploitation.
        </Text>
        <Text style={styles.para}>
          Vérifiez aussi le caractère imposable ou non de chaque aide perçue (ex : la plupart des aides PAC sont
          imposables, certaines subventions d’investissement peuvent ne pas l’être) — c’est vous qui le renseignez
          lors de la saisie, l’app ne le détermine pas automatiquement.
        </Text>
        <Text style={styles.source}>
          Sources à consulter en cas de doute : impots.gouv.fr (Bénéfices agricoles), votre centre de gestion agréé
          (CGA) ou votre comptable.
        </Text>
      </Card>
    </Screen>
  );
}

function Ligne({ label, valeur, gras }: { label: string; valeur: number; gras?: boolean }) {
  return (
    <View style={styles.ligne}>
      <Text style={[styles.ligneLabel, gras && styles.gras]}>{label}</Text>
      <Text style={[styles.ligneValeur, gras && styles.gras]}>{formatMontant(valeur)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  ligneLabel: { fontSize: 14, color: colors.text, flexShrink: 1, paddingRight: 8 },
  ligneValeur: { fontSize: 14, fontWeight: '700', color: colors.text },
  gras: { fontWeight: '800', color: colors.primary },
  separateur: { borderTopWidth: 1, borderTopColor: colors.border, marginVertical: 4 },
  exclu: { fontSize: 12, color: colors.textMuted, marginTop: 6, fontStyle: 'italic' },
  info: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  aideBloc: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, marginTop: 6 },
  aideTitre: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
  para: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  paraGras: { fontSize: 13, color: colors.text, lineHeight: 19, fontWeight: '600' },
  source: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 },
});
