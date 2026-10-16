import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ListRow } from '@/shared/components/ListRow';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { BlocRappels } from '@/features/rappels/components/BlocRappels';
import { BlocSante } from '@/features/exploitation/components/BlocSante';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { Screen } from '@/shared/components/Screen';
import { YearPicker } from '@/shared/components/YearPicker';
import AccueilEntreprise from '@/features/accueil/screens/AccueilEntreprise';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { TuilesAccueil } from '@/features/accueil/components/TuilesAccueil';
import { TuilesRubriques } from '@/features/accueil/components/TuilesRubriques';
import { estBureau } from '@/shared/utils/plateforme';
import { useAccueil } from '@/features/accueil/hooks/useAccueil';

/** Accueil de l'élevage, ou celui de l'entreprise quand l'établissement actif n'est pas un élevage. */
export default function Accueil() {
  return modeEntreprise() ? <AccueilEntreprise /> : <AccueilElevage />;
}

function AccueilElevage() {
  const router = useRouter();
  const { annee, annees, setAnneeActive, stats } = useAccueil();

  return (
    <Screen>
      <LigneFiltres>
        <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />
        <SelecteurEspece />
      </LigneFiltres>

      {/* Les informations de l'exploitation : juste sous l'année et l'espèce, une simple ligne. */}
      <ListRow
        title={TEXTES.commun.general.informationsDeLExploitation}
        trailing={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
        onPress={() => router.push(ROUTES.INFORMATIONS_EXPLOITATION)}
      />

      {/* Sur ordinateur, les rubriques en grandes tuiles ; sur téléphone, les chiffres de l'élevage. */}
      {estBureau() ? <TuilesRubriques /> : <TuilesAccueil stats={stats} annee={annee} />}

      <BlocSante />
      <BlocRappels />
    </Screen>
  );
}
