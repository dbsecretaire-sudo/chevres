import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.sante;

/** L'onglet Santé d'un élevage : ce qu'on donne à manger, les visites du vétérinaire et les contrôles, au même endroit. */
export default function Sante() {
  const router = useRouter();
  const rubriques = [
    {
      titre: TEXTES.commun.general.alimentation,
      aide: T.alimentation,
      icone: 'nutrition',
      route: ROUTES.SANTE_ALIMENTATION,
    },
    {
      titre: TEXTES.commun.general.visitesVeterinaire,
      aide: T.veterinaire,
      icone: 'medkit',
      route: ROUTES.SANTE_VETERINAIRE,
    },
    {
      titre: TEXTES.commun.general.controles,
      aide: T.controles,
      icone: 'checkmark-circle',
      route: ROUTES.SANTE_CONTROLES,
    },
  ] as const;
  return (
    <Screen>
      <SelecteurEspece />
      <BlocLignes>
        {rubriques.map((r) => (
          <ListRow
            key={r.route}
            title={r.titre}
            subtitle={r.aide}
            trailing={<Ionicons name={r.icone} size={26} color={colors.primary} />}
            onPress={() => router.push(r.route)}
          />
        ))}
      </BlocLignes>
    </Screen>
  );
}
