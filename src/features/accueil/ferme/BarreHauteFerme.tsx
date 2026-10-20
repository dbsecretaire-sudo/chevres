import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BoutonDidacticiel } from '@/features/didacticiel/components/BoutonDidacticiel';
import { SelecteursFerme } from '@/features/accueil/ferme/SelecteursFerme';
import { PastilleDeMenu } from '@/shared/components/PastilleDeMenu';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

interface Props {
  annees: number[];
  annee: number;
  onChoisirAnnee: (annee: number) => void;
}

/**
 * La barre du haut de l'accueil, sur le téléphone : l'année, l'espèce, le didacticiel et l'organisation. On les touche rarement : ils sont dans la
 * zone du haut, que le pouce atteint le moins bien, et le bandeau qu'on utilise sans cesse (la maison, la balance, les rappels) est en bas.
 */
export function BarreHauteFerme({ annees, annee, onChoisirAnnee }: Props) {
  const router = useRouter();
  return (
    <View style={styles.barre}>
      <SelecteursFerme annees={annees} annee={annee} onChoisirAnnee={onChoisirAnnee} forme="pastille" />
      <BoutonDidacticiel forme="pastille" />
      <PastilleDeMenu
        libelle={TEXTES.accueil.ferme.barre.reglages}
        onPress={() => router.push(ROUTES.REGLAGES as never)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // La même capsule verte que le bandeau du bas, avec ses pastilles blanches.
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 999,
    padding: 6,
  },
});
