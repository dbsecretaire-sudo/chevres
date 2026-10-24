import { useRouter } from 'expo-router';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/Screen';
import { pagesDuCheptel } from '@/features/accueil/ferme/actionsLieu';

/**
 * La page de menu du cheptel, avant d'y entrer : un bouton par page — la liste des animaux, les naissances, les sorties, les lots d'animaux, les traitements, les boucles et les
 * contrôles des animaux.
 */
export default function MenuCheptel() {
  const router = useRouter();
  return (
    <Screen>
      <BlocLignes>
        {pagesDuCheptel().map((page) => (
          <ListRow key={page.cle} title={page.titre} icone={page.icone} onPress={() => router.push(page.route as never)} />
        ))}
      </BlocLignes>
    </Screen>
  );
}
