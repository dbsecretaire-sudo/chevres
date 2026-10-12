import { Text } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import { SectionForm } from '@/shared/components/SectionForm';
import { SelectField } from '@/shared/components/SelectField';
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
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_CATEGORIE_VENTE, LABEL_TYPE_AIDE } from '@/shared/textes/libelles';

const T = TEXTES.comptabilite.tauxParProduit;

/**
 * Comptabilité › Réglages › Taux par produit : le taux de TVA proposé pour chaque vente de production et le taux d'imposition
 * proposé pour chaque type d'aide. Ce sont les valeurs d'office d'une nouvelle écriture, que chaque écriture peut encore changer.
 */
export default function ReglagesTaux() {
  const { patchSettings } = useAppSettings();

  /** Enregistre à partir des réglages les plus récents, en changeant un seul taux. */
  const enregistrer = async (modifie: (actuels: TauxParProduit) => TauxParProduit) => {
    const { exploitation } = await getSettings();
    await patchSettings({
      exploitation: { ...exploitation, tauxParProduit: modifie(exploitation?.tauxParProduit ?? {}) },
    });
  };

  return (
    <Screen>
      <SectionForm titre={T.tva} aide={T.aideTva}>
        {(Object.keys(TAUX_TVA_VENTE_PAR_CATEGORIE) as ValeurDe<typeof CATEGORIE_VENTE>[]).map(
          (categorie) => (
            <SelectField
              key={categorie}
              label={LABEL_CATEGORIE_VENTE[categorie]}
              value={String(tauxTvaDeLaVente(categorie))}
              onChange={(taux) =>
                enregistrer((actuels) => ({ ...actuels, tva: { ...actuels.tva, [categorie]: Number(taux) } }))
              }
              options={OPTIONS_TAUX_TVA}
            />
          ),
        )}
      </SectionForm>

      <SectionForm titre={T.imposition} aide={T.aideImposition}>
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
      </SectionForm>

      <Text style={commonStyles.note}>{T.note}</Text>
      <Button variant="secondary" label={T.retablir} onPress={() => enregistrer(() => ({}))} />
    </Screen>
  );
}
