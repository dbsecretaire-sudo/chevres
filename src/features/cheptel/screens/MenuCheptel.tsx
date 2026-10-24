import { useRouter } from 'expo-router';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/Screen';
import { pagesDuCheptel } from '@/features/accueil/ferme/actionsLieu';
import { useAnimauxACompleter } from '@/features/cheptel/hooks/useAnimauxACompleter';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

/**
 * La page de menu du cheptel, avant d'y entrer : un bouton par page — la liste des animaux, les naissances, les sorties, les lots d'animaux, les traitements, les boucles et les
 * contrôles des animaux.
 */
export default function MenuCheptel() {
  const router = useRouter();
  const { animaux: aCompleter } = useAnimauxACompleter();
  return (
    <Screen>
      <BlocLignes>
        {/* Ce que le berger a saisi sur le terrain : le « ! » dit qu'il reste à compléter. */}
        <ListRow
          title={TEXTES.roles.aCompleter.titre}
          subtitle={aCompleter.length > 0 ? String(aCompleter.length) : undefined}
          icone="create"
          badge={aCompleter.length > 0}
          onPress={() => router.push(ROUTES.CHEPTEL_A_COMPLETER as never)}
        />
        {pagesDuCheptel().map((page) => (
          <ListRow key={page.cle} title={page.titre} icone={page.icone} onPress={() => router.push(page.route as never)} />
        ))}
      </BlocLignes>
    </Screen>
  );
}
