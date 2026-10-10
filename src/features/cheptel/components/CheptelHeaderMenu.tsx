import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { ROUTES } from '@/shared/constants/routes';
import { entrerAvecRetour } from '@/shared/navigation/contexteRetour';
import { TEXTES } from '@/shared/textes';

/**
 * Les boutons de l'en-tête du Cheptel : la santé du troupeau (les contrôles, les visites du vétérinaire, l'alimentation) et le
 * bilan annuel (les exports du cheptel sont dans Organisation › PDF). Depuis la santé, la flèche de retour ramène au cheptel.
 */
export function CheptelHeaderMenu() {
  const router = useRouter();
  const boutons = [
    {
      icone: 'checkmark-circle',
      route: ROUTES.SANTE_CONTROLES,
      titre: TEXTES.commun.general.controles,
      sante: true,
    },
    {
      icone: 'medkit',
      route: ROUTES.SANTE_VETERINAIRE,
      titre: TEXTES.commun.general.visitesVeterinaire,
      sante: true,
    },
    {
      icone: 'nutrition',
      route: ROUTES.SANTE_ALIMENTATION,
      titre: TEXTES.commun.general.alimentation,
      sante: true,
    },
    {
      icone: 'stats-chart',
      route: ROUTES.CHEPTEL_BILAN,
      titre: TEXTES.commun.general.bilanAnnuel,
      sante: false,
    },
  ] as const;
  return (
    <View style={[commonStyles.headerDroite, commonStyles.boutonEnteteDroite]}>
      {boutons.map((b) => (
        <Pressable
          key={b.route}
          onPress={() => {
            if (b.sante) entrerAvecRetour(ROUTES.CHEPTEL);
            router.push(b.route);
          }}
          hitSlop={10}
          accessibilityLabel={b.titre}
          style={commonStyles.boutonCompact}
        >
          <Ionicons name={b.icone} size={24} color={colors.blanc} />
        </Pressable>
      ))}
    </View>
  );
}
