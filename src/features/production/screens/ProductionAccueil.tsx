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
 * L'onglet Production d'un élevage, à côté du Cheptel : les fromages (par lot), la viande vendue, le contrôle laitier et les
 * groupements. Le stock y est branché : les lots de fromage sont ceux de l'inventaire.
 */
export default function ProductionAccueil() {
  const router = useRouter();
  const { espece } = useEtablissement();
  // Le lait, les fromages et son contrôle ne concernent que les espèces qui ont une laiterie (chèvres, brebis, vaches).
  const laiterie = laiterieActive(espece);
  const lignes: {
    cle: string;
    titre: string;
    aide: string;
    icone: keyof typeof Ionicons.glyphMap;
    route: string;
  }[] = [
    ...(laiterie
      ? [
          { cle: 'fromages', ...T.fromages, icone: 'nutrition' as const, route: ROUTES.PRODUCTION_FROMAGES },
          {
            cle: 'laitier',
            ...T.laitier,
            icone: 'flask' as const,
            route: ROUTES.santeControles(FAMILLE_CONTROLE.LAITIER),
          },
        ]
      : []),
    { cle: 'viande', ...T.viande, icone: 'restaurant', route: ROUTES.PRODUCTION_VIANDE },
    {
      cle: 'groupements',
      ...T.groupements,
      icone: 'people',
      route: ROUTES.santeControles(FAMILLE_CONTROLE.GROUPEMENT),
    },
  ];
  return (
    <Screen>
      <SelecteurEspece />
      <BlocLignes>
        {lignes.map((l) => (
          <ListRow
            key={l.cle}
            title={l.titre}
            subtitle={l.aide}
            icone={l.icone}
            onPress={() => router.push(l.route as never)}
          />
        ))}
      </BlocLignes>
    </Screen>
  );
}
