import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { YearPicker } from '@/components/YearPicker';
import { colors } from '@/theme/colors';
import { useAppSettings } from '@/context/AppSettingsContext';
import {
  calculerBilanAlimentation,
  calculerBilanCarburant,
  calculerDetailComptable,
  toutesLesAnneesConnues,
  type BilanAlimentation,
  type BilanCarburant,
  type DetailComptable,
} from '@/storage/repositories';
import { LABEL_CATEGORIE_DEPENSE, LABEL_CATEGORIE_RECETTE, LABEL_TYPE_ALIMENT, LABEL_TYPE_CARBURANT } from '@/utils/planComptable';
import { formatMontant } from '@/utils/dates';
import type { CategorieDepense, TypeAliment, TypeCarburant } from '@/types/models';

const VIDE: DetailComptable = { depenses: [], recettes: [], totalDepenses: 0, totalRecettes: 0 };

/** « Autre » est exclu de ces sous-détails (voir écran Alimentation) : sa précision libre peut recouvrir un achat pour un tout autre élevage. */
const TYPES_ALIMENT_DETAIL: TypeAliment[] = ['mais', 'luzerne', 'foin', 'paille'];
const TYPES_CARBURANT_DETAIL: TypeCarburant[] = ['gazoil', 'essence', 'gnr'];

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

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const sousPostes = (categorie: CategorieDepense): SousPoste[] | null => {
    if (categorie === 'alimentation' && bilanAlimentation) {
      return TYPES_ALIMENT_DETAIL.map((t) => ({
        label: LABEL_TYPE_ALIMENT[t],
        montant: bilanAlimentation.parType[t].montant,
      }));
    }
    if (categorie === 'carburant' && bilanCarburant) {
      return TYPES_CARBURANT_DETAIL.map((t) => ({
        label: LABEL_TYPE_CARBURANT[t],
        montant: bilanCarburant.parType[t].montant,
      }));
    }
    return null;
  };

  return (
    <Screen>
      <YearPicker annees={annees} value={settings.anneeActive} onChange={setAnneeActive} />

      <Text style={styles.titreSection}>Dépenses</Text>
      <Card style={styles.card}>
        {detail.depenses.map((d) => {
          const sous = sousPostes(d.categorie);
          const ouverte = categorieOuverte === d.categorie;
          return (
            <View key={d.categorie} style={styles.groupe}>
              <View style={styles.ligneInterne}>
                <View>
                  <Text style={styles.libelle}>{LABEL_CATEGORIE_DEPENSE[d.categorie]}</Text>
                  {sous && (
                    <Pressable onPress={() => setCategorieOuverte(ouverte ? null : d.categorie)}>
                      <Text style={styles.voirPlus}>{ouverte ? 'Voir moins' : 'Voir plus'}</Text>
                    </Pressable>
                  )}
                </View>
                <Text style={[styles.montant, { color: colors.danger }]}>{formatMontant(d.montant)}</Text>
              </View>
              {sous && ouverte && (
                <View style={styles.sousDetail}>
                  {sous.map((s) => (
                    <View key={s.label} style={styles.sousLigne}>
                      <Text style={styles.sousLibelle}>{s.label}</Text>
                      <Text style={styles.sousMontant}>{formatMontant(s.montant)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
        <View style={[styles.ligne, styles.ligneTotal]}>
          <Text style={styles.libelleTotal}>Total</Text>
          <Text style={[styles.montant, styles.montantTotal, { color: colors.danger }]}>
            {formatMontant(detail.totalDepenses)}
          </Text>
        </View>
      </Card>

      <Text style={styles.titreSection}>Recettes</Text>
      <Card style={styles.card}>
        {detail.recettes.map((r) => (
          <View key={r.categorie} style={styles.ligne}>
            <Text style={styles.libelle}>{LABEL_CATEGORIE_RECETTE[r.categorie]}</Text>
            <Text style={[styles.montant, { color: colors.primary }]}>{formatMontant(r.montant)}</Text>
          </View>
        ))}
        <View style={[styles.ligne, styles.ligneTotal]}>
          <Text style={styles.libelleTotal}>Total</Text>
          <Text style={[styles.montant, styles.montantTotal, { color: colors.primary }]}>
            {formatMontant(detail.totalRecettes)}
          </Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titreSection: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 4 },
  card: { gap: 2 },
  groupe: { borderBottomWidth: 1, borderBottomColor: colors.border },
  ligne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ligneInterne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  ligneTotal: { borderBottomWidth: 0, paddingTop: 12 },
  libelle: { fontSize: 15, color: colors.text },
  libelleTotal: { fontSize: 15, fontWeight: '700', color: colors.text },
  montant: { fontSize: 15, fontWeight: '600' },
  montantTotal: { fontSize: 17, fontWeight: '800' },
  voirPlus: { fontSize: 12, fontWeight: '600', color: colors.primary, marginTop: 2 },
  sousDetail: { paddingLeft: 12, paddingBottom: 8, gap: 4 },
  sousLigne: { flexDirection: 'row', justifyContent: 'space-between' },
  sousLibelle: { fontSize: 13, color: colors.textMuted },
  sousMontant: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
});
