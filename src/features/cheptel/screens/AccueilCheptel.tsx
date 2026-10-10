import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';
import { entrerAvecRetour } from '@/shared/navigation/contexteRetour';
import { TEXTES } from '@/shared/textes';

const F = TEXTES.exploitation.controles.familles;

/**
 * L'onglet Cheptel : d'abord le cheptel lui-même (les animaux vivants), seul dans son bloc ; puis ce qui s'y rapporte — les
 * contrôles de surface et des animaux, les visites du vétérinaire, l'alimentation. Depuis ces écrans, la flèche de retour ramène ici.
 */
export default function AccueilCheptel() {
  const router = useRouter();
  const vers = (route: string) => () => {
    entrerAvecRetour(ROUTES.CHEPTEL);
    router.push(route as never);
  };
  const autres: {
    cle: string;
    titre: string;
    aide?: string;
    icone: keyof typeof Ionicons.glyphMap;
    route: string;
  }[] = [
    {
      cle: 'surface',
      titre: F.surface.titre,
      aide: F.surface.aide,
      icone: 'map',
      route: ROUTES.santeControles(FAMILLE_CONTROLE.SURFACE),
    },
    {
      cle: 'animaux',
      titre: F.animaux.titre,
      aide: F.animaux.aide,
      icone: 'paw',
      route: ROUTES.santeControles(FAMILLE_CONTROLE.ANIMAUX),
    },
    {
      cle: 'visites',
      titre: TEXTES.commun.general.visitesVeterinaire,
      icone: 'medkit',
      route: ROUTES.SANTE_VETERINAIRE,
    },
    {
      cle: 'alimentation',
      titre: TEXTES.commun.general.alimentation,
      icone: 'nutrition',
      route: ROUTES.SANTE_ALIMENTATION,
    },
  ];
  return (
    <Screen>
      <SelecteurEspece />
      <BlocLignes>
        <ListRow
          title={TEXTES.commun.general.cheptel}
          icone="paw"
          onPress={() => router.push(ROUTES.CHEPTEL_LISTE)}
        />
      </BlocLignes>
      <BlocLignes>
        {autres.map((l) => (
          <ListRow key={l.cle} title={l.titre} subtitle={l.aide} icone={l.icone} onPress={vers(l.route)} />
        ))}
      </BlocLignes>
    </Screen>
  );
}
