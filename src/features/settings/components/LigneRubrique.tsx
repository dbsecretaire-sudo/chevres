import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { entrerAvecRetour } from '@/shared/navigation/contexteRetour';
import { ListRow } from '@/shared/components/ListRow';
import { useLigneActive } from '@/bureau/colonnes';

/** Une ligne d'un menu de l'organisation : une icône, un titre, une phrase, et l'écran qu'elle ouvre. */
export function LigneRubrique({
  titre,
  aide,
  icone,
  route,
  retour,
}: {
  titre: string;
  aide: string;
  icone: keyof typeof Ionicons.glyphMap;
  route: string;
  /** Pour un écran de la comptabilité : la page d'Organisation où sa flèche de retour ramène (et dont l'onglet reste en couleur). */
  retour?: string;
}) {
  const router = useRouter();
  const estActive = useLigneActive();
  return (
    <ListRow
      title={titre}
      actif={estActive(route)}
      subtitle={aide}
      icone={icone}
      onPress={() => {
        if (retour) entrerAvecRetour(retour);
        router.push(route as never);
      }}
    />
  );
}
