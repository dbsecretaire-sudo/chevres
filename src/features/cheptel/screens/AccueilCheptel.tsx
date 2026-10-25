import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { GroupeAccueil } from '@/features/accueil/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { AncreVisite } from '@/shared/components/AncreVisite';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { groupesCheptel } from '@/features/cheptel/services/rubriquesCheptel';
import { especeDuSuivi } from '@/features/export/documents/suiviMouvementsPdf';
import { ROUTES } from '@/shared/constants/routes';
import { useAccueilEnDeuxColonnes, useLigneActive } from '@/bureau/colonnes';
import { entrerAvecRetour } from '@/shared/navigation/contexteRetour';
import { GrilleTerrain } from '@/features/accueil/terrain/EcranTerrain';
import { afficheBureau } from '@/shared/utils/affichage';
import { BlocSante } from '@/features/sante/components/BlocSante';
import { BlocRappels } from '@/features/rappels/components/BlocRappels';
import { useAccueil } from '@/features/accueil/hooks/useAccueil';
import { colors } from '@/shared/theme/colors';
import { Text, View } from 'react-native';

/**
 * L'onglet Chèvres, et l'accueil de l'élevage. Sur le téléphone : le compteur d'aliment, les alertes de santé et les rappels, puis les six tuiles de la maquette
 * (scanner, naissance, soin, mouvement, décès, cheptel). Sur Windows : le menu en groupes titrés (voir ListeCheptel), à côté du cheptel.
 */
export default function AccueilCheptel() {
  if (afficheBureau()) return <ListeCheptel />;
  return <PageChevresTelephone />;
}

/** La page Chèvres du téléphone : l'aliment par animal et par jour (en tête, comme sur la maquette), puis les alertes et les tuiles. */
function PageChevresTelephone() {
  const { stats } = useAccueil();
  const grammes = stats?.gParAnimalParJour;
  return (
    <GrilleTerrain
      zone="troupeau"
      enTete={
        <>
          <SelecteurEspece />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.badgeBg, borderRadius: 14, padding: 12 }}>
            <Text style={{ color: colors.textMuted }}>Aliment par animal et par jour</Text>
            <Text style={{ fontWeight: '800', color: colors.primary }}>
              {grammes === undefined ? '—' : `${Math.round(grammes).toLocaleString('fr-FR')} g`}
            </Text>
          </View>
          <BlocSante />
          <BlocRappels />
        </>
      }
    />
  );
}

/**
 * L'onglet Cheptel, en groupes titrés (voir groupesCheptel) : le troupeau, la santé, l'identification et la PAC, les statistiques, la
 * technique. Depuis ces écrans, la flèche de retour ramène ici.
 */
function ListeCheptel() {
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
              <AncreVisite key={l.cle} id={`rubrique:${l.route}`}>
                <ListRow
                  title={l.titre}
                  subtitle={l.aide}
                  icone={l.icone}
                  actif={estActive(l.route)}
                  onPress={vers(l.route)}
                />
              </AncreVisite>
            ))}
          </BlocLignes>
        </GroupeAccueil>
      ))}
    </Screen>
  );
}
