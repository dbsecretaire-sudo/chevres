import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/Screen';
import { SelectModal } from '@/shared/components/SelectModal';
import { ChampTauxImposition } from '@/features/comptabilite/components/ChampTauxImposition';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { getSettings } from '@/features/settings/settings';
import { TAUX_TVA_VENTE_PAR_CATEGORIE } from '@/shared/constants/comptabilite';
import { TAUX_IMPOSITION_TYPE_AIDE } from '@/shared/constants/planComptable';
import {
  tauxImpositionDeLAide,
  tauxTvaDeLaVente,
  type TauxParProduit,
  type TypeAideAvecTaux,
} from '@/shared/dictionnaire/tauxParProduit';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import type { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_CATEGORIE_VENTE, LABEL_TYPE_AIDE } from '@/shared/textes/libelles';

const T = TEXTES.comptabilite.tauxParProduit;

type CategorieTva = ValeurDe<typeof CATEGORIE_VENTE>;

const styles = StyleSheet.create({
  /** La note « ces taux sont ceux d'une nouvelle écriture », dans le vert clair de la maquette. */
  noteVerte: { backgroundColor: colors.badgeBg, borderRadius: 12, padding: 12 },
});

/**
 * Comptabilité › Réglages › Taux par produit : le taux de TVA proposé pour chaque vente de production et le taux d'imposition
 * proposé pour chaque type d'aide. Ce sont les valeurs d'office d'une nouvelle écriture, que chaque écriture peut encore changer.
 * Comme sur la maquette : une ligne par produit (son taux à droite), une note verte, puis les taux d'imposition des aides (avancé).
 */
export default function ReglagesTaux() {
  const { patchSettings } = useAppSettings();
  /** La catégorie dont on choisit le taux de TVA (la liste de choix est ouverte quand elle est présente). */
  const [tvaOuverte, setTvaOuverte] = useState<CategorieTva | null>(null);

  /** Enregistre à partir des réglages les plus récents, en changeant un seul taux. */
  const enregistrer = async (modifie: (actuels: TauxParProduit) => TauxParProduit) => {
    const { exploitation } = await getSettings();
    await patchSettings({
      exploitation: { ...exploitation, tauxParProduit: modifie(exploitation?.tauxParProduit ?? {}) },
    });
  };

  const choisirTva = (categorie: CategorieTva, taux: string) => {
    setTvaOuverte(null);
    enregistrer((actuels) => ({ ...actuels, tva: { ...actuels.tva, [categorie]: Number(taux) } }));
  };

  return (
    <Screen>
      <View style={commonStyles.gap10}>
        <View style={commonStyles.gap2}>
          <Text style={commonStyles.lineBold}>{T.tva}</Text>
          <Text style={commonStyles.note}>{T.aideTva}</Text>
        </View>
        {(Object.keys(TAUX_TVA_VENTE_PAR_CATEGORIE) as CategorieTva[]).map((categorie) => (
          <ListRow
            key={categorie}
            title={LABEL_CATEGORIE_VENTE[categorie]}
            onPress={() => setTvaOuverte(categorie)}
            trailing={
              <View style={commonStyles.row}>
                <Text style={commonStyles.lineBold}>{`${tauxTvaDeLaVente(categorie)} %`}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            }
          />
        ))}
      </View>

      <View style={styles.noteVerte}>
        <Text style={commonStyles.note}>{T.note}</Text>
      </View>

      <View style={commonStyles.gap10}>
        <View style={commonStyles.row}>
          <Text style={commonStyles.lineBold}>{T.imposition}</Text>
          <Badge label="Avancé" color={colors.text} />
        </View>
        <Text style={commonStyles.note}>{T.aideImposition}</Text>
        {(Object.keys(TAUX_IMPOSITION_TYPE_AIDE) as TypeAideAvecTaux[]).map((type) => (
          <ChampTauxImposition
            key={type}
            label={LABEL_TYPE_AIDE[type]}
            value={String(tauxImpositionDeLAide(type))}
            onChange={(taux) =>
              enregistrer((actuels) => ({
                ...actuels,
                imposition: { ...actuels.imposition, [type]: Number(taux) },
              }))
            }
          />
        ))}
      </View>

      <Button variant="secondary" label={T.retablir} onPress={() => enregistrer(() => ({}))} />

      <SelectModal<string>
        visible={tvaOuverte !== null}
        titre={tvaOuverte ? LABEL_CATEGORIE_VENTE[tvaOuverte] : ''}
        value={tvaOuverte ? String(tauxTvaDeLaVente(tvaOuverte)) : ''}
        options={OPTIONS_TAUX_TVA}
        onSelect={(taux) => {
          if (tvaOuverte) choisirTva(tvaOuverte, taux);
        }}
        onClose={() => setTvaOuverte(null)}
      />
    </Screen>
  );
}
