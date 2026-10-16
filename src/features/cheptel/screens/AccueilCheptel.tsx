import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { GroupeAccueil } from '@/shared/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { groupesCheptel } from '@/features/cheptel/services/rubriquesCheptel';
import { especeDuSuivi } from '@/features/export/suiviMouvementsPdf';
import { ROUTES } from '@/shared/constants/routes';
import { useAccueilEnDeuxColonnes, useLigneActive } from '@/bureau/colonnes';
import { entrerAvecRetour } from '@/shared/navigation/contexteRetour';

/**
 * L'onglet Cheptel, en groupes titrés (voir groupesCheptel) : le troupeau, la santé, l'identification et la PAC, les statistiques, la
 * technique. Depuis ces écrans, la flèche de retour ramène ici.
 */
export default function AccueilCheptel() {
  const router = useRouter();
  const estActive = useLigneActive();
  const { espece } = useEtablissement();
  // Deux colonnes : le menu est déjà à gauche, la colonne de droite montre le cheptel.
  const redirection = useAccueilEnDeuxColonnes(ROUTES.CHEPTEL_LISTE);
  if (redirection) return redirection;
  const vers = (route: string) => () => {
    entrerAvecRetour(ROUTES.CHEPTEL);
    router.push(route as never);
  };
  return (
    <Screen>
      <SelecteurEspece />
      {groupesCheptel(especeDuSuivi(espece)).map((groupe) => (
        <GroupeAccueil key={groupe.cle} titre={groupe.titre}>
          <BlocLignes>
            {groupe.lignes.map((l) => (
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
      ))}
    </Screen>
  );
}
