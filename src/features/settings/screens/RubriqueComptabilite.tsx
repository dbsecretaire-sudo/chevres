import { Text } from 'react-native';
import { Screen } from '@/shared/components/Screen';
import { Checkbox } from '@/shared/components/Checkbox';
import { BlocLignes } from '@/shared/components/BlocListe';
import { LigneRubrique } from '@/features/settings/components/LigneRubrique';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { ROUTES } from '@/shared/constants/routes';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.reglages;

/**
 * Organisation › Comptabilité : les catégories de recette d'un élevage, les comptes du plan comptable et le mode avancé, qui
 * montre ou cache les notions de comptabilité dans les écritures.
 */
export default function RubriqueComptabilite() {
  const { settings, patchSettings } = useAppSettings();
  return (
    <Screen>
      <BlocLignes>
        {!modeEntreprise() ? (
          <LigneRubrique
            titre={T.categoriesRecette}
            aide={T.aideCategoriesRecette}
            icone="checkbox"
            route={ROUTES.CATEGORIES_RECETTE}
          />
        ) : null}
        {settings.exploitation?.modeAvance ? (
          <LigneRubrique
            titre={T.comptesPcg}
            aide={T.aideComptesPcg}
            icone="list"
            route={ROUTES.COMPTES_PCG}
          />
        ) : null}
      </BlocLignes>
      {/* Le mode simple cache les notions de comptabilité (comptes du plan comptable, TVA, nature URSSAF). */}
      <Checkbox
        label={T.modeAvance}
        value={!!settings.exploitation?.modeAvance}
        onChange={(valeur) =>
          patchSettings({ exploitation: { ...settings.exploitation, modeAvance: valeur } })
        }
      />
      <Text style={commonStyles.note}>{T.modeAvanceExplication}</Text>
    </Screen>
  );
}
