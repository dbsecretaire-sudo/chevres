import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useRole } from '@/features/roles/context/RoleContext';
import { ROLE } from '@/shared/constants/roles';
import { ListeDeChoix } from '@/features/production/simple/ListeDeChoix';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.lots;

/** Les lots de l'atelier, en tuiles : une par produit suivi lot par lot (fromages, viande, boucherie / charcuterie, plats préparés, savons). Un appui ouvre sa liste de lots. */
export default function CategoriesDeLots() {
  const router = useRouter();
  const simple = useRole().role === ROLE.BERGER;
  /** La viande : ses lots dans un seul onglet ; le mode normal en a deux entrées, la viande à vendre et la viande à facturer. */
  const viande = simple
    ? [
        { cle: 'viandeAVendre', titre: TEXTES.accueil.ferme.terrain.tuiles.viandeAVendre, route: ROUTES.productionLotsViandeSimple('avendre'), icone: 'food-steak' as const },
        { cle: 'viandeAFacturer', titre: TEXTES.accueil.ferme.terrain.tuiles.viandeAFacturer, route: ROUTES.productionLotsViandeSimple('afacturer'), icone: 'food-steak' as const },
      ]
    : [{ cle: 'viande', titre: T.viande, route: ROUTES.PRODUCTION_VIANDE, icone: 'food-steak' as const }];
  const lignes = [
    { cle: 'fromages', titre: T.fromages, route: ROUTES.PRODUCTION_FROMAGES, icone: 'cheese' as const },
    ...viande,
    { cle: 'charcuterie', titre: T.charcuterie, route: ROUTES.PRODUCTION_CHARCUTERIE, icone: 'knife' as const },
    { cle: PRODUIT_A_LOTS.PLAT, titre: T.plats, route: ROUTES.PRODUCTION_PLATS, icone: 'pot-steam' as const },
    { cle: 'savons', titre: T.savons, route: ROUTES.PRODUCTION_SAVONS, icone: 'hand-wash' as const },
  ];
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <ListeDeChoix
        presentation="tuiles"
        choix={lignes.map((l) => ({ cle: l.cle, libelle: l.titre, icone: l.icone }))}
        onChoisir={(c) => {
          const ligne = lignes.find((l) => l.cle === c.cle);
          if (ligne) router.push(ligne.route as never);
        }}
      />
    </ScrollView>
  );
}
