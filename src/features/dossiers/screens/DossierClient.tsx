import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { EmptyState } from '@/shared/components/EmptyState';
import { Fab } from '@/shared/components/Fab';
import { CarteDossier } from '@/features/dossiers/components/CarteDossier';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { NoteAFacturer } from '@/features/dossiers/components/NoteAFacturer';
import { RechercheDossiers } from '@/features/dossiers/components/RechercheDossiers';
import { facturerLaNote, lignesDeLaNote } from '@/features/dossiers/services/facturation';
import { useExplorateur } from '@/features/dossiers/hooks/useExplorateur';
import { creerSousDossier } from '@/features/dossiers/repository';
import { dossiersEnfants, resumeDossier } from '@/features/dossiers/services/arborescence';
import { assurerStructureClient, structureTypeDe } from '@/features/dossiers/services/structure';
import { getClient } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { nomComplet } from '@/shared/utils/personne';
import { styles } from '@/shared/styles/dossiers/Dossiers.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/**
 * Le dossier d'un client : la recherche dans ce dossier et la grille de ses dossiers (la structure type est créée à
 * la première ouverture).
 */
export default function DossierClient() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings } = useAppSettings();
  const e = useExplorateur({ clientId: id });
  const [client, setClient] = useState<Client | undefined>();
  const [nomOuvert, setNomOuvert] = useState(false);
  const T = TEXTES.dossiers;
  const { recharger } = e;

  const charger = useCallback(async () => {
    const trouve = await getClient(id);
    if (trouve) {
      await assurerStructureClient(trouve, structureTypeDe(settings.exploitation?.entreprise));
    }
    setClient(trouve);
    await recharger();
  }, [id, settings.exploitation?.entreprise, recharger]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const creer = async (nom: string) => {
    await creerSousDossier(id, nom);
    setNomOuvert(false);
    recharger();
  };

  const dossiers = dossiersEnfants(e.archive.sousDossiers, id);
  /** La note du client : ses prestations ajoutées sur la note, pas encore facturées. */
  const note = lignesDeLaNote(e.archive.elements, id);
  const facturerNote = async (numeroFacture: string, date: string) => {
    if (client) await facturerLaNote(id, numeroFacture, date, client, settings.exploitation?.entreprise);
    recharger();
  };

  return (
    <Screen scroll={false}>
      <Stack.Screen
        options={{
          title: client ? nomComplet(client) : T.dossierClient.clientIntrouvable,
          // La fiche du client : une icône à droite du titre (plus de grand bouton dans la page).
          headerRight: () => (
            <Pressable
              style={commonStyles.boutonEnteteDroite}
              onPress={() => router.push(ROUTES.ficheClient(id))}
              hitSlop={10}
              accessibilityLabel={T.dossierClient.ficheClient}
            >
              <Ionicons name="person" size={24} color={colors.blanc} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        <RechercheDossiers etat={e} dansUnDossier>
          <NoteAFacturer lignes={note} onFacturer={facturerNote} />

          {dossiers.length === 0 ? (
            <EmptyState title={T.dossierClient.aucunDossier} subtitle={T.dossierClient.ajoutezUnDossier} />
          ) : (
            <View style={styles.grille}>
              {dossiers.map((dossier) => {
                const resume = resumeDossier(e.archive.sousDossiers, e.archiveAffichee.elements, dossier.id);
                return (
                  <CarteDossier
                    key={dossier.id}
                    large
                    titre={dossier.nom}
                    detail={T.explorateur.contenus(resume.contenus)}
                    alerte={resume.aFaire > 0 ? T.explorateur.aFaire(resume.aFaire) : undefined}
                    onPress={() => router.push(ROUTES.sousDossier(dossier.id))}
                  />
                );
              })}
            </View>
          )}
        </RechercheDossiers>
      </ScrollView>

      <Fab
        options={[
          { label: T.dossierClient.nouveauDossier, icon: 'folder', onPress: () => setNomOuvert(true) },
        ]}
      />

      <NomModal
        visible={nomOuvert}
        titre={T.dossierClient.nouveauDossier}
        placeholder={T.dossierClient.nomDuDossier}
        onValider={creer}
        onAnnuler={() => setNomOuvert(false)}
      />
    </Screen>
  );
}
