import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { YearPicker } from '@/shared/components/YearPicker';
import { colors } from '@/shared/theme/colors';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import {
  calculerBilanAlimentation,
  type BilanAlimentation,
} from '@/features/exploitation/services/bilanAlimentation';
import { calculerBilanCarburant, type BilanCarburant } from '@/features/comptabilite/services/bilanCarburant';
import {
  calculerDetailComptable,
  type DetailComptable,
} from '@/features/comptabilite/services/detailComptable';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import {
  LABEL_CATEGORIE_DEPENSE,
  LABEL_CATEGORIE_RECETTE,
  LABEL_TYPE_ALIMENT,
  LABEL_TYPE_CARBURANT,
} from '@/shared/textes/libelles';
import { formatMontant } from '@/shared/utils/dates';
import type { CategorieDepense } from '@/features/comptabilite/types';
import { styles } from '@/shared/styles/comptabilite/DetailComptable.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import {
  CATEGORIE_DEPENSE,
  TYPES_ALIMENT_COMPTABILISES,
  TYPES_CARBURANT,
} from '@/shared/constants/comptabilite';
import { TEXTES } from '@/shared/textes';

const VIDE: DetailComptable = { depenses: [], recettes: [], totalDepenses: 0, totalRecettes: 0 };

interface SousPoste {
  label: string;
  montant: number;
}

export default function DetailComptabilite() {
  const { settings, setAnneeActive } = useAppSettings();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [detail, setDetail] = useState<DetailComptable>(VIDE);
  const [bilanAlimentation, setBilanAlimentation] = useState<BilanAlimentation | null>(null);
  const [bilanCarburant, setBilanCarburant] = useState<BilanCarburant | null>(null);
  const [categorieOuverte, setCategorieOuverte] = useState<CategorieDepense | null>(null);

  const charger = useCallback(async () => {
    const [toutesAnnees, d, alimentation, carburant] = await Promise.all([
      toutesLesAnneesConnues(),
      calculerDetailComptable(settings.anneeActive),
      calculerBilanAlimentation(settings.anneeActive),
      calculerBilanCarburant(settings.anneeActive),
    ]);
    setAnnees(toutesAnnees);
    setDetail(d);
    setBilanAlimentation(alimentation);
    setBilanCarburant(carburant);
  }, [settings.anneeActive]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const sousPostes = (categorie: CategorieDepense): SousPoste[] | null => {
    if (categorie === CATEGORIE_DEPENSE.ALIMENTATION && bilanAlimentation) {
      return TYPES_ALIMENT_COMPTABILISES.map((t) => ({
        label: LABEL_TYPE_ALIMENT[t],
        montant: bilanAlimentation.parType[t].montant,
      }));
    }
    if (categorie === CATEGORIE_DEPENSE.CARBURANT && bilanCarburant) {
      return TYPES_CARBURANT.map((t) => ({
        label: LABEL_TYPE_CARBURANT[t],
        montant: bilanCarburant.parType[t].montant,
      }));
    }
    return null;
  };

  return (
    <Screen>
      <YearPicker annees={annees} value={settings.anneeActive} onChange={setAnneeActive} />

      <Text style={styles.titreSection}>{TEXTES.commun.general.depenses}</Text>
      <Card style={commonStyles.gap2}>
        {detail.depenses.map((d) => {
          const sous = sousPostes(d.categorie);
          const ouverte = categorieOuverte === d.categorie;
          return (
            <View key={d.categorie} style={styles.groupe}>
              <View style={styles.ligneInterne}>
                <View>
                  <Text style={commonStyles.body}>{LABEL_CATEGORIE_DEPENSE[d.categorie]}</Text>
                  {sous && (
                    <Pressable onPress={() => setCategorieOuverte(ouverte ? null : d.categorie)}>
                      <Text style={styles.voirPlus}>
                        {ouverte ? TEXTES.commun.general.voirMoins : TEXTES.commun.general.voirPlus}
                      </Text>
                    </Pressable>
                  )}
                </View>
                <Text style={[styles.montant, { color: colors.danger }]}>{formatMontant(d.montant)}</Text>
              </View>
              {sous && ouverte && (
                <View style={styles.sousDetail}>
                  {sous.map((s) => (
                    <View key={s.label} style={commonStyles.rowBetween}>
                      <Text style={commonStyles.muted}>{s.label}</Text>
                      <Text style={commonStyles.mutedBold}>{formatMontant(s.montant)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
        <View style={[styles.ligne, styles.ligneTotal]}>
          <Text style={commonStyles.cardTitle}>{TEXTES.commun.general.total}</Text>
          <Text style={[styles.montant, styles.montantTotal, { color: colors.danger }]}>
            {formatMontant(detail.totalDepenses)}
          </Text>
        </View>
      </Card>

      <Text style={styles.titreSection}>{TEXTES.comptabilite.detailComptable.recettes}</Text>
      <Card style={commonStyles.gap2}>
        {detail.recettes.map((r) => (
          <View key={r.categorie} style={styles.ligne}>
            <Text style={commonStyles.body}>{LABEL_CATEGORIE_RECETTE[r.categorie]}</Text>
            <Text style={[styles.montant, { color: colors.primary }]}>{formatMontant(r.montant)}</Text>
          </View>
        ))}
        <View style={[styles.ligne, styles.ligneTotal]}>
          <Text style={commonStyles.cardTitle}>{TEXTES.commun.general.total}</Text>
          <Text style={[styles.montant, styles.montantTotal, { color: colors.primary }]}>
            {formatMontant(detail.totalRecettes)}
          </Text>
        </View>
      </Card>
    </Screen>
  );
}
