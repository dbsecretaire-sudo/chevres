import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { EmptyState } from '@/shared/components/EmptyState';
import { Fab } from '@/shared/components/Fab';
import { CarteDossier } from '@/features/dossiers/components/CarteDossier';
import { RechercheDossiers } from '@/features/dossiers/components/RechercheDossiers';
import { lignesDeLaNote } from '@/features/dossiers/services/facturation';
import { useExplorateur } from '@/features/dossiers/hooks/useExplorateur';
import { ROUTES } from '@/shared/constants/routes';
import { nomComplet } from '@/shared/utils/personne';
import { styles } from '@/shared/styles/dossiers/Dossiers.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/**
 * Écran Activité d'une entreprise : la recherche sur tout le contenu, les filtres d'avancement et la grille des
 * dossiers (un par client). Avec un terme ou un filtre, la grille laisse place aux résultats.
 */
export default function ExplorateurClients() {
  const router = useRouter();
  const e = useExplorateur();
  const T = TEXTES.dossiers.explorateur;

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        <RechercheDossiers etat={e}>
          {e.clients.length === 0 ? (
            <EmptyState title={T.aucunClient} subtitle={T.ajoutezUnClient} />
          ) : (
            <View style={styles.grille}>
              {e.clients.map((client) => {
                const resume = e.resume.get(client.id);
                return (
                  <CarteDossier
                    key={client.id}
                    client
                    titre={nomComplet(client)}
                    detail={resume ? T.contenus(resume.total) : T.aucunContenu}
                    alerte={resume && resume.aFaire > 0 ? T.aFaire(resume.aFaire) : undefined}
                    aFacturer={lignesDeLaNote(e.archive.elements, client.id).length > 0}
                    onPress={() => router.push(ROUTES.dossierClient(client.id))}
                  />
                );
              })}
            </View>
          )}
        </RechercheDossiers>
      </ScrollView>

      <Fab
        options={[
          {
            label: T.nouveauClient,
            icon: 'person-add',
            onPress: () => router.push(ROUTES.CLIENT_NOUVEAU),
          },
        ]}
      />
    </Screen>
  );
}
