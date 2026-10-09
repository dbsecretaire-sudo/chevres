import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ListRow } from '@/shared/components/ListRow';
import { colors } from '@/shared/theme/colors';

export type IconeRubrique = keyof typeof Ionicons.glyphMap;

/** Une ligne d'un menu de l'organisation : une icône, un titre, une phrase, et l'écran qu'elle ouvre. */
export function LigneRubrique({
  titre,
  aide,
  icone,
  route,
}: {
  titre: string;
  aide: string;
  icone: IconeRubrique;
  route: string;
}) {
  const router = useRouter();
  return (
    <ListRow
      title={titre}
      subtitle={aide}
      trailing={<Ionicons name={icone} size={26} color={colors.primary} />}
      onPress={() => router.push(route as never)}
    />
  );
}
