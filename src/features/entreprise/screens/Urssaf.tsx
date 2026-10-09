import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { YearPicker } from '@/shared/components/YearPicker';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { calculerUrssaf, type LigneNatureUrssaf, type Urssaf } from '@/features/entreprise/services/urssaf';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { colors } from '@/shared/theme/colors';
import { formatMontant } from '@/shared/utils/dates';
import { LABEL_NATURE_URSSAF, NOMS_MOIS } from '@/shared/textes/libelles';
import { styles } from '@/shared/styles/comptabilite/FiscaliteRsa.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.entreprise.urssaf;

/** Une ligne de nature de recette : son nom, le chiffre d'affaires à déclarer et les cotisations. */
function LigneNature({ ligne, gras }: { ligne: LigneNatureUrssaf; gras?: boolean }) {
  return (
    <View style={styles.ligne}>
      <View style={commonStyles.flex1}>
        <Text style={gras ? commonStyles.lineBold : commonStyles.line}>
          {LABEL_NATURE_URSSAF[ligne.nature]}
        </Text>
        <Text style={commonStyles.note}>{T.taux(String(ligne.taux).replace('.', ','))}</Text>
      </View>
      <Text style={[gras ? commonStyles.lineBold : commonStyles.line, styles.colonne]}>
        {formatMontant(ligne.chiffreAffaires)}
      </Text>
      <Text style={[commonStyles.lineBold, styles.colonne]}>{formatMontant(ligne.cotisations)}</Text>
    </View>
  );
}

/**
 * Les déclarations URSSAF, mois par mois : pour chaque mois, le chiffre d'affaires hors taxes à déclarer par nature de recette
 * (vente de marchandises, prestations commerciales ou artisanales, prestations libérales) et les cotisations dues. Un mois se
 * déroule d'un appui (ils sont repliés au départ) ; le total de l'année est en bas.
 */
export default function UrssafEcran() {
  const { settings, setAnneeActive } = useAppSettings();
  const infos = settings.exploitation?.entreprise;
  const annee = settings.anneeActive;
  const [annees, setAnnees] = useState<number[]>([annee]);
  const [urssaf, setUrssaf] = useState<Urssaf | null>(null);
  /** Les mois dont le détail est déroulé (tous sont repliés au départ). */
  const [deroules, setDeroules] = useState<number[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([toutesLesAnneesConnues(), calculerUrssaf(annee, infos)]).then(([toutes, resultat]) => {
        setAnnees(toutes);
        setUrssaf(resultat);
      });
    }, [annee, infos]),
  );

  const basculer = (mois: number) =>
    setDeroules((actuels) =>
      actuels.includes(mois) ? actuels.filter((m) => m !== mois) : [...actuels, mois],
    );

  return (
    <Screen>
      <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />

      <Card>
        <Text style={commonStyles.cardTitle}>{T.titreMois(annee)}</Text>
        <Text style={commonStyles.note}>{T.horsTaxes}</Text>
        <View style={styles.ligne}>
          <Text style={[commonStyles.mutedBold, commonStyles.flex1]}>{T.nature}</Text>
          <Text style={[commonStyles.mutedBold, styles.colonne]}>{T.chiffreAffaires}</Text>
          <Text style={[commonStyles.mutedBold, styles.colonne]}>{T.cotisations}</Text>
        </View>
        {urssaf?.mois.map((m) => {
          const replie = !deroules.includes(m.mois);
          return (
            <View key={m.mois} style={commonStyles.gap2}>
              <Pressable style={styles.ligne} onPress={() => basculer(m.mois)}>
                <View style={[commonStyles.rowFin, commonStyles.flex1]}>
                  <Text style={commonStyles.lien}>{NOMS_MOIS[m.mois - 1]}</Text>
                  <Ionicons
                    name={replie ? 'chevron-down' : 'chevron-up'}
                    size={16}
                    color={colors.textMuted}
                  />
                </View>
                <Text style={[commonStyles.lien, styles.colonne]}>{formatMontant(m.chiffreAffaires)}</Text>
                <Text style={[commonStyles.lien, styles.colonne]}>{formatMontant(m.cotisations)}</Text>
              </Pressable>
              {replie ? null : (
                <View style={styles.detailMois}>
                  {m.natures.map((n) => (
                    <LigneNature key={n.nature} ligne={n} />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </Card>

      <Card>
        <Text style={commonStyles.cardTitle}>{T.totalAnnee(annee)}</Text>
        {urssaf?.parNature.map((n) => (
          <LigneNature key={n.nature} ligne={n} />
        ))}
        <View style={commonStyles.separateur} />
        <View style={styles.ligne}>
          <Text style={[commonStyles.lineBold, commonStyles.flex1]}>{T.total}</Text>
          <Text style={[commonStyles.lineBold, styles.colonne]}>
            {formatMontant(urssaf?.totalChiffreAffaires ?? 0)}
          </Text>
          <Text style={[commonStyles.strongPrimary, styles.colonne]}>
            {formatMontant(urssaf?.totalCotisations ?? 0)}
          </Text>
        </View>
      </Card>

      <Card>
        <Text style={commonStyles.cardTitle}>{T.noticeTitre}</Text>
        <Text style={commonStyles.para}>{T.notice}</Text>
        <Text style={commonStyles.noteMarge}>{T.noticeVerifier}</Text>
      </Card>
    </Screen>
  );
}
