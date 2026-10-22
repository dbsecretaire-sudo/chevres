import { useRouter } from 'expo-router';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/Screen';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.lots;

/** Les lots de l'atelier : une ligne par produit suivi lot par lot (fromages, viande, boucherie / charcuterie, plats préparés). Un appui ouvre sa liste de lots. */
export default function CategoriesDeLots() {
  const router = useRouter();
  const lignes = [
    { cle: 'fromages', titre: T.fromages, route: ROUTES.PRODUCTION_FROMAGES },
    { cle: 'viande', titre: T.viande, route: ROUTES.PRODUCTION_VIANDE },
    { cle: 'charcuterie', titre: T.charcuterie, route: ROUTES.PRODUCTION_CHARCUTERIE },
    { cle: 'plats', titre: T.plats, route: ROUTES.PRODUCTION_PLATS },
  ];
  return (
    <Screen>
      <BlocLignes>
        {lignes.map((l) => (
          <ListRow key={l.cle} title={l.titre} onPress={() => router.push(l.route as never)} />
        ))}
      </BlocLignes>
    </Screen>
  );
}
