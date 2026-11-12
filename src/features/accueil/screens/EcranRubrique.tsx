import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { SectionsRubrique } from '@/features/accueil/components/SectionsRubrique';
import { RUBRIQUES, type Rubrique } from '@/features/accueil/rubriques/rubriquesDuPlus';
import { ROUTES } from '@/shared/constants/routes';
import { CarteCodeAcces } from '@/features/settings/components/CarteCodeAcces';
import { CarteModeAvance } from '@/features/settings/components/CarteModeAvance';
import { HistoriqueMouvements } from '@/features/cheptel/components/HistoriqueMouvements';
import { colors } from '@/shared/theme/colors';

/**
 * Une page de rubrique du mode avancé, comme sur la maquette : la phrase d'accroche, puis des groupes de lignes (un écran par ligne).
 * Le titre est celui de la barre du haut (voir Visites, Plus et la page Mouvement des chèvres).
 */
export default function EcranRubrique() {
  const { nom } = useLocalSearchParams<{ nom?: string }>();
  const rubrique: Rubrique | undefined = nom ? RUBRIQUES[nom] : undefined;
  if (!rubrique) return null;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.textMuted }}>{rubrique.sousTitre}</Text>
      {/* Les réglages de l'application : le mode avancé et le code d'accès, en tête de la page Plus. */}
      {nom === 'reglages' ? (
        <>
          <CarteModeAvance />
          <CarteCodeAcces />
        </>
      ) : null}
      {/* Les pages ouvertes depuis la Santé reviennent à la Santé. */}
      <SectionsRubrique repliables={nom === 'documents'} sections={rubrique.sections} retour={nom && ['sante', 'mouvement', 'historique'].includes(nom) ? ROUTES.rubrique(nom) : undefined} />
      {/* Les mouvements de l'année active, sous les boutons : une recherche, le plus récent en tête. */}
      {nom === 'mouvement' ? <HistoriqueMouvements /> : null}
    </ScrollView>
  );
}
