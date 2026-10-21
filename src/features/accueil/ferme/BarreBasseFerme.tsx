import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BoutonDidacticiel } from '@/features/didacticiel/components/BoutonDidacticiel';
import { SelecteursFerme } from '@/features/accueil/ferme/SelecteursFerme';
import { BoutonDeBarre } from '@/shared/components/BoutonDeBarre';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { colonneCentree } from '@/shared/theme/miseEnPage';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme.barre;

interface Props {
  annees: number[];
  annee: number;
  onChoisirAnnee: (annee: number) => void;
}

/**
 * La barre du bas de l'accueil sous Windows (la souris n'a pas de zone du pouce) : l'année, l'espèce, le didacticiel et les réglages. Sur le
 * téléphone, ces menus sont dans la barre du haut (`BarreHauteFerme`), et le bandeau est en bas.
 */
export function BarreBasseFerme({ annees, annee, onChoisirAnnee }: Props) {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[styles.barre, { paddingBottom: 8 + bottom }]}>
      <View style={styles.boutons}>
        <SelecteursFerme annees={annees} annee={annee} onChoisirAnnee={onChoisirAnnee} forme="barre" />
        <BoutonDidacticiel forme="barre" />
        <BoutonDeBarre
          icone={<MaterialCommunityIcons name="sitemap-outline" size={26} color={colors.blanc} />}
          libelle={T.reglages}
          onPress={() => router.push(ROUTES.REGLAGES as never)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Les boutons forment une colonne de largeur limitée, centrée, dans une barre qui remplit la fenêtre.
  boutons: { ...colonneCentree, flexDirection: 'row', gap: 8 },
  barre: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
