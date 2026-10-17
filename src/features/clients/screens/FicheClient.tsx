import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/Screen';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { InfoModal } from '@/shared/components/InfoModal';
import { colors } from '@/shared/theme/colors';
import { BoutonsContact } from '@/features/clients/components/BoutonsContact';
import { ClientEcritures, ClientResume, estVente } from '@/features/clients/components/ClientResume';
import { ClientFormulaire, ClientLecture } from '@/features/clients/components/ClientFiche';
import { ContactLie } from '@/features/contacts/components/ContactLie';
import { ClientReservations } from '@/features/gite/components/ClientReservations';
import { ClientTaches } from '@/features/dossiers/components/ClientTaches';
import { NoteDuClient } from '@/features/dossiers/components/NoteDuClient';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { activitesEtablissement, modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { useFicheClient } from '@/features/clients/hooks/useFicheClient';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { nomComplet } from '@/shared/utils/personne';

export default function FicheClient() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const fiche = useFicheClient(id);
  const { client, form } = fiche;
  const gite = activitesEtablissement().includes(ACTIVITE_SOCIETE.ASSOCIATION);

  if (!client || !form) {
    return (
      <Screen>
        <Text style={commonStyles.notFound}>{TEXTES.clients.ficheClient.clientIntrouvable}</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <ScrollView style={commonStyles.flex1} contentContainerStyle={commonStyles.scrollContent}>
        <View style={commonStyles.header}>
          <View style={commonStyles.flex1}>
            <Text style={commonStyles.title}>{nomComplet(client)}</Text>
            {client.telephone || client.email ? (
              <Text style={commonStyles.subtitle}>
                {[client.telephone, client.email].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
          <View style={commonStyles.headerDroite}>
            <BoutonsContact telephone={client.telephone} email={client.email} />
          </View>
          <Pressable style={commonStyles.boutonMenu} onPress={() => fiche.setMenuOuvert(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
          </Pressable>
        </View>

        <OptionsModal
          visible={fiche.menuOuvert}
          onClose={() => fiche.setMenuOuvert(false)}
          title={nomComplet(client)}
          options={[
            {
              label: TEXTES.commun.general.modifierLaFiche,
              icon: 'create',
              onPress: () => {
                fiche.setMenuOuvert(false);
                fiche.setEditing(true);
              },
            },
            {
              label: TEXTES.commun.general.supprimerDefinitivement,
              icon: 'trash',
              color: colors.danger,
              onPress: () => {
                fiche.setMenuOuvert(false);
                fiche.setSuppressionOuverte(true);
              },
            },
          ]}
        />

        {fiche.editing ? (
          <ClientFormulaire
            form={form}
            onChange={fiche.setForm}
          />
        ) : (
          <ClientLecture client={client} onModifier={() => fiche.setEditing(true)} />
        )}
        {!fiche.editing ? <ContactLie id={client.id} /> : null}

        {/* Un gîte liste les réservations du client ; un secrétariat, ses tâches et contenus. */}
        {!fiche.editing && modeEntreprise() && gite ? <ClientReservations clientId={client.id} /> : null}
        {!fiche.editing && modeEntreprise() && !gite ? <ClientTaches clientId={client.id} /> : null}

        {!fiche.editing && fiche.ecritures.length > 0 && <ClientResume resume={fiche.resume} />}

        {!fiche.editing && (
          <ClientEcritures
            ecritures={fiche.ecritures}
            enTete={
              modeEntreprise() ? <NoteDuClient client={client} onFacturee={fiche.recharger} /> : undefined
            }
            onOuvrir={(e) => router.push(estVente(e) ? ROUTES.ficheVente(e.id) : ROUTES.ficheFacture(e.id))}
          />
        )}
      </ScrollView>

      <ConfirmModal
        visible={fiche.suppressionOuverte}
        title={TEXTES.commun.general.supprimerDefinitivementQuestion}
        message={TEXTES.clients.ficheClient.cetteActionSupprimeraDefinitivementLa(
          client.nom,
          client.prenom ? ` ${client.prenom}` : '',
        )}
        confirmLabel={TEXTES.commun.general.supprimerDefinitivement}
        onCancel={() => fiche.setSuppressionOuverte(false)}
        onConfirm={fiche.supprimerDefinitivement}
      />

      <InfoModal visible={!!fiche.erreur} title={fiche.erreur ?? ''} onClose={() => fiche.setErreur(null)} />
    </Screen>
  );
}
