import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { GroupeAccueil } from '@/shared/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';
import { useAccueilEnDeuxColonnes, useLigneActive } from '@/bureau/colonnes';
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
  const estActive = useLigneActive();
  // Deux colonnes : le menu est déjà à gauche, la colonne de droite montre le cheptel.
  const redirection = useAccueilEnDeuxColonnes(ROUTES.CHEPTEL_LISTE);
  if (redirection) return redirection;
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
            actif={estActive(ROUTES.CHEPTEL_LISTE)}
            onPress={() => router.push(ROUTES.CHEPTEL_LISTE)}
          />
        </BlocLignes>
      </GroupeAccueil>
      <GroupeAccueil titre={G.terrains}>
        <BlocLignes>
          {terrains.map((l) => (
            <ListRow
              key={l.cle}
              title={l.titre}
              subtitle={l.aide}
              icone={l.icone}
              actif={estActive(l.route)}
              onPress={vers(l.route)}
            />
          ))}
        </BlocLignes>
      </GroupeAccueil>
      <GroupeAccueil titre={G.sante}>
        <BlocLignes>
          <ListRow
            title={TEXTES.cheptel.traitements.titre}
            subtitle={TEXTES.cheptel.traitements.aide}
            icone="medkit"
            actif={estActive(ROUTES.CHEPTEL_TRAITEMENTS)}
            onPress={vers(ROUTES.CHEPTEL_TRAITEMENTS)}
          />
        </BlocLignes>
      </GroupeAccueil>
      <GroupeAccueil titre={G.statistiques}>
        <BlocLignes>
          <ListRow
            title={TEXTES.cheptel.tableauDeBord.titre}
            subtitle={TEXTES.cheptel.tableauDeBord.aide}
            icone="stats-chart"
            actif={estActive(ROUTES.CHEPTEL_TABLEAU_DE_BORD)}
            onPress={vers(ROUTES.CHEPTEL_TABLEAU_DE_BORD)}
          />
          <ListRow
            title={TEXTES.commun.general.alimentation}
            icone="nutrition"
            actif={estActive(ROUTES.SANTE_ALIMENTATION)}
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
            actif={estActive(ROUTES.CHEPTEL_REGLAGES)}
            onPress={() => router.push(ROUTES.CHEPTEL_REGLAGES)}
          />
        </BlocLignes>
      </GroupeAccueil>
    </Screen>
  );
}
