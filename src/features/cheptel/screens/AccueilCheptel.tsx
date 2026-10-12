import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { GroupeAccueil } from '@/shared/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';
import { entrerAvecRetour } from '@/shared/navigation/contexteRetour';
import { TEXTES } from '@/shared/textes';

const F = TEXTES.exploitation.controles.familles;
const G = TEXTES.cheptel.accueil.groupes;

/**
 * L'onglet Cheptel, en groupes titrés : le cheptel lui-même (les animaux vivants) ; les terrains et l'identification (contrôles de
 * surface et des animaux, avec les boucles et la santé : les visites du vétérinaire) ; les statistiques (alimentation) ; la technique
 * (réglages : UGB, primes). Depuis ces écrans, la flèche de retour ramène ici.
 */
export default function AccueilCheptel() {
  const router = useRouter();
  const vers = (route: string) => () => {
    entrerAvecRetour(ROUTES.CHEPTEL);
    router.push(route as never);
  };
  const terrains: {
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
  ];
  return (
    <Screen>
      <SelecteurEspece />
      <GroupeAccueil titre={G.troupeau}>
        <BlocLignes>
          <ListRow
            title={TEXTES.commun.general.cheptel}
            icone="paw"
            onPress={() => router.push(ROUTES.CHEPTEL_LISTE)}
          />
        </BlocLignes>
      </GroupeAccueil>
      <GroupeAccueil titre={G.terrains}>
        <BlocLignes>
          {terrains.map((l) => (
            <ListRow key={l.cle} title={l.titre} subtitle={l.aide} icone={l.icone} onPress={vers(l.route)} />
          ))}
        </BlocLignes>
      </GroupeAccueil>
      <GroupeAccueil titre={G.statistiques}>
        <BlocLignes>
          <ListRow
            title={TEXTES.commun.general.alimentation}
            icone="nutrition"
            onPress={vers(ROUTES.SANTE_ALIMENTATION)}
          />
        </BlocLignes>
      </GroupeAccueil>
      <GroupeAccueil titre={G.technique}>
        <BlocLignes>
          <ListRow
            title={TEXTES.cheptel.reglages.titre}
            subtitle={TEXTES.cheptel.reglages.aide}
            icone="settings"
            onPress={() => router.push(ROUTES.CHEPTEL_REGLAGES)}
          />
        </BlocLignes>
      </GroupeAccueil>
    </Screen>
  );
}
