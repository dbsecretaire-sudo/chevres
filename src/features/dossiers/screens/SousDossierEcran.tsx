import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/ScreenList';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { InfoModal } from '@/shared/components/InfoModal';
import { choisirFichiers, piecesDisponibles, rangerFichier } from '@/features/fichiers/services/pieces';
import { TYPES_FICHIERS_ACCEPTES } from '@/shared/constants/fichiers';
import { STATUT_ELEMENT } from '@/shared/constants/dossiers';
import { todayISO } from '@/shared/utils/dates';
import { EmptyState } from '@/shared/components/EmptyState';
import { Fab } from '@/shared/components/Fab';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { CarteDossier } from '@/features/dossiers/components/CarteDossier';
import { LigneElement } from '@/features/dossiers/components/LigneElement';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { RechercheDossiers } from '@/features/dossiers/components/RechercheDossiers';
import { useExplorateur } from '@/features/dossiers/hooks/useExplorateur';
import {
  creerSousDossier,
  enregistrerElement,
  renommerSousDossier,
  supprimerSousDossier,
} from '@/features/dossiers/repository';
import { cheminDuDossier, dossiersEnfants, resumeDossier } from '@/features/dossiers/services/arborescence';
import { colors } from '@/shared/theme/colors';
import { ROUTES } from '@/shared/constants/routes';
import { styles } from '@/shared/styles/dossiers/Dossiers.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/**
 * Un dossier : la recherche dans ce dossier, les dossiers qu'il contient et ses contenus. Le menu permet de le
 * renommer ou de le supprimer ; le bouton « + » d'y ajouter un dossier ou un contenu.
 */
export default function SousDossierEcran() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const e = useExplorateur({ dossierId: id });
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [renommerOuvert, setRenommerOuvert] = useState(false);
  const [nouveauOuvert, setNouveauOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const T = TEXTES.dossiers.sousDossier;
  const { recharger } = e;

  const dossier = e.archive.sousDossiers.find((d) => d.id === id);
  const enfants = dossier ? dossiersEnfants(e.archive.sousDossiers, dossier.clientId, id) : [];
  const contenus = e.archiveAffichee.elements
    .filter((el) => el.dossierId === id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const resume = resumeDossier(e.archive.sousDossiers, e.archive.elements, id);

  useFocusEffect(
    useCallback(() => {
      recharger();
    }, [recharger]),
  );

  const renommer = async (nom: string) => {
    await renommerSousDossier(id, nom);
    setRenommerOuvert(false);
    recharger();
  };

  const creerDossier = async (nom: string) => {
    if (!dossier) return;
    await creerSousDossier(dossier.clientId, nom, id);
    setNouveauOuvert(false);
    recharger();
  };

  /** Chaque fichier choisi (Word, Excel, PDF, image) devient un contenu de ce dossier, déjà terminé. */
  const importerFichiers = async () => {
    if (!dossier) return;
    if (!piecesDisponibles()) return setErreur(TEXTES.fichiers.indisponibleWeb);
    try {
      for (const choisi of await choisirFichiers(TYPES_FICHIERS_ACCEPTES, true)) {
        const piece = await rangerFichier(choisi);
        await enregistrerElement({
          clientId: dossier.clientId,
          dossierId: id,
          titre: choisi.nom.replace(/\.[^.]+$/, ''),
          date: todayISO(),
          statut: STATUT_ELEMENT.TERMINE,
          fichiers: [piece],
        });
      }
      recharger();
    } catch (e: any) {
      setErreur(e?.message ?? TEXTES.fichiers.erreurAjout);
    }
  };

  const supprimer = async () => {
    await supprimerSousDossier(id);
    setSuppressionOuverte(false);
    router.back();
  };

  return (
    <Screen scroll={false}>
      <Stack.Screen
        options={{
          title: dossier?.nom ?? T.introuvable,
          headerRight: () => (
            <Pressable style={styles.boutonEntete} onPress={() => setMenuOuvert(true)} hitSlop={8}>
              <Ionicons name="ellipsis-vertical" size={22} color={colors.blanc} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        <RechercheDossiers etat={e} dansUnDossier>
          {dossier ? (
            <Text style={commonStyles.muted}>{cheminDuDossier(id, e.archive.sousDossiers, e.clients)}</Text>
          ) : null}

          {enfants.length === 0 && contenus.length === 0 ? (
            <EmptyState title={T.aucunContenuNiDossier} subtitle={T.ajoutezUnDossierOuUnContenu} />
          ) : null}

          {enfants.length > 0 ? (
            <View style={styles.grille}>
              {enfants.map((enfant) => {
                const sien = resumeDossier(e.archive.sousDossiers, e.archiveAffichee.elements, enfant.id);
                return (
                  <CarteDossier
                    key={enfant.id}
                    large
                    titre={enfant.nom}
                    detail={TEXTES.dossiers.explorateur.contenus(sien.contenus)}
                    alerte={sien.aFaire > 0 ? TEXTES.dossiers.explorateur.aFaire(sien.aFaire) : undefined}
                    onPress={() => router.push(ROUTES.sousDossier(enfant.id))}
                  />
                );
              })}
            </View>
          ) : null}

          {contenus.map((element) => (
            <LigneElement key={element.id} element={element} />
          ))}
        </RechercheDossiers>
      </ScrollView>

      <Fab
        options={[
          { label: T.nouveauDossier, icon: 'folder', onPress: () => setNouveauOuvert(true) },
          {
            label: T.nouveauContenu,
            icon: 'document-text',
            onPress: () => router.push(ROUTES.elementNouveau(id)),
          },
          { label: TEXTES.fichiers.importerUnFichier, icon: 'attach', onPress: importerFichiers },
        ]}
      />

      <OptionsModal
        visible={menuOuvert}
        onClose={() => setMenuOuvert(false)}
        options={[
          { label: T.renommer, icon: 'pencil', onPress: () => setRenommerOuvert(true) },
          {
            label: T.supprimer,
            icon: 'trash',
            color: colors.danger,
            onPress: () => setSuppressionOuverte(true),
          },
        ]}
      />
      <NomModal
        visible={renommerOuvert}
        titre={T.renommer}
        valeurInitiale={dossier?.nom}
        onValider={renommer}
        onAnnuler={() => setRenommerOuvert(false)}
      />
      <NomModal
        visible={nouveauOuvert}
        titre={T.nouveauDossier}
        placeholder={T.nomDuDossier}
        onValider={creerDossier}
        onAnnuler={() => setNouveauOuvert(false)}
      />
      <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
      <ConfirmModal
        visible={suppressionOuverte}
        title={T.supprimerQuestion}
        message={T.supprimerMessage(dossier?.nom ?? '', resume.contenus, resume.dossiers)}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setSuppressionOuverte(false)}
        onConfirm={supprimer}
      />
    </Screen>
  );
}
