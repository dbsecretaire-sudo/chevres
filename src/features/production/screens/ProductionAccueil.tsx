import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { laiterieActive } from '@/features/comptabilite/utils/recettes';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.accueil;

/**
 * L'onglet Production d'un élevage, à côté du Cheptel : un premier groupe (fromages et charcuterie par lot, viande vendue), puis
 * le contrôle laitier et les groupements. Le stock y est branché : les lots sont ceux de l'inventaire.
 */
export default function ProductionAccueil() {
  const router = useRouter();
  const { espece } = useEtablissement();
  // Le lait, les fromages et son contrôle ne concernent que les espèces qui ont une laiterie (chèvres, brebis, vaches).
  const laiterie = laiterieActive(espece);
  type Ligne = {
    cle: string;
    titre: string;
    aide: string;
    icone: keyof typeof Ionicons.glyphMap;
    route: string;
  };
  /** Le premier groupe : ce qu'on produit et vend (fromages, viande, boucherie / charcuterie). */
  const produits: Ligne[] = [
    ...(laiterie
      ? [{ cle: 'fromages', ...T.fromages, icone: 'nutrition' as const, route: ROUTES.PRODUCTION_FROMAGES }]
      : []),
    { cle: 'viande', ...T.viande, icone: 'restaurant', route: ROUTES.PRODUCTION_VIANDE },
    { cle: 'charcuterie', ...T.charcuterie, icone: 'cut', route: ROUTES.PRODUCTION_CHARCUTERIE },
  ];
  /** Le second groupe : les contrôles et les groupements. */
  const suivi: Ligne[] = [
    ...(laiterie
      ? [
          {
            cle: 'laitier',
            ...T.laitier,
            icone: 'flask' as const,
            route: ROUTES.santeControles(FAMILLE_CONTROLE.LAITIER),
          },
        ]
      : []),
    {
      cle: 'groupements',
      ...T.groupements,
      icone: 'people',
      route: ROUTES.santeControles(FAMILLE_CONTROLE.GROUPEMENT),
    },
    {
      cle: 'rappels',
      ...T.rappels,
      icone: 'notifications',
      route: ROUTES.PRODUCTION_RAPPELS_LOTS,
    },
  ];
  return (
    <Screen>
      <SelecteurEspece />
      {[produits, suivi].map((groupe) => (
        <BlocLignes key={groupe[0].cle}>
          {groupe.map((l) => (
            <ListRow
              key={l.cle}
              title={l.titre}
              subtitle={l.aide}
              icone={l.icone}
              onPress={() => router.push(l.route as never)}
            />
          ))}
        </BlocLignes>
      ))}
    </Screen>
  );
}
