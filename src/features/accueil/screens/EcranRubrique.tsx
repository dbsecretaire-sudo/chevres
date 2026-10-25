import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { GroupeAccueil } from '@/features/accueil/components/GroupeAccueil';
import { RUBRIQUES, type Rubrique } from '@/features/accueil/rubriques/rubriquesDuPlus';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { colors } from '@/shared/theme/colors';

/**
 * Une page de rubrique du mode avancé, comme sur la maquette : la phrase d'accroche, puis des groupes de lignes (un écran par ligne).
 * Le titre est celui de la barre du haut (voir Visites, Plus et la page Mouvement des chèvres).
 */
export default function EcranRubrique() {
  const { nom } = useLocalSearchParams<{ nom?: string }>();
  const router = useRouter();
  const rubrique: Rubrique | undefined = nom ? RUBRIQUES[nom] : undefined;
  if (!rubrique) return null;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.textMuted }}>{rubrique.sousTitre}</Text>
      {rubrique.sections.map((section) => (
        <GroupeAccueil key={section.titre} titre={section.titre}>
          <BlocLignes>
            {section.lignes.map((ligne) => (
              <ListRow
                key={ligne.libelle}
                title={ligne.libelle}
                subtitle={ligne.aide}
                icone={ligne.icone}
                onPress={() => router.push(ligne.route as never)}
              />
            ))}
          </BlocLignes>
        </GroupeAccueil>
      ))}
    </ScrollView>
  );
}
