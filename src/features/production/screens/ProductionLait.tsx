import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { YearPicker } from '@/shared/components/YearPicker';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { LaitParAnimal } from '@/features/exploitation/components/LaitParAnimal';
import {
  productionLaitiere,
  type ProductionLaitiere,
} from '@/features/exploitation/services/productionLaitiere';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { ESPECES_PETITS_RUMINANTS } from '@/shared/constants/primes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/**
 * La page de la production de lait : le lait par chèvre (ou brebis), par jour et par traite, d'après l'inventaire, pour l'année et
 * l'animal choisis. Elle est à part du contrôle laitier (les analyses et les contrôles).
 */
export default function ProductionLait() {
  const { settings, setAnneeActive } = useAppSettings();
  // L'espèce active : l'écran se recharge quand elle change, sans être recréé.
  const { espece } = useEtablissement();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [lait, setLait] = useState<ProductionLaitiere | null>(null);
  const petitsRuminants = ESPECES_PETITS_RUMINANTS.includes(espece);

  const charger = useCallback(async () => {
    const [toutesAnnees, production] = await Promise.all([
      toutesLesAnneesConnues(),
      petitsRuminants ? productionLaitiere(settings.anneeActive) : Promise.resolve(null),
    ]);
    setAnnees(toutesAnnees);
    setLait(production);
  }, [settings.anneeActive, petitsRuminants]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return (
    <Screen>
      <LigneFiltres>
        <YearPicker annees={annees} value={settings.anneeActive} onChange={setAnneeActive} />
        <SelecteurEspece />
      </LigneFiltres>
      {lait ? (
        <LaitParAnimal production={lait} annee={settings.anneeActive} onChange={charger} />
      ) : (
        <Text style={commonStyles.mutedItalic}>{TEXTES.production.productionLait.nonCalcule}</Text>
      )}
    </Screen>
  );
}
