import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/shared/components/Screen';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { InfoModal } from '@/shared/components/InfoModal';

import { colors } from '@/shared/theme/colors';
import {
  FournisseurEcritures,
  FournisseurTotal,
} from '@/features/fournisseurs/components/FournisseurEcritures';
import {
  FournisseurFormulaire,
  FournisseurLecture,
} from '@/features/fournisseurs/components/FournisseurFiche';
import { ContactLie } from '@/features/contacts/components/ContactLie';
import { useFicheFournisseur } from '@/features/fournisseurs/hooks/useFicheFournisseur';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

export default function FicheFournisseur() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const e = useFicheFournisseur(id);
  const { fournisseur, form } = e;

  if (!fournisseur || !form) {
    return (
      <Screen>
        <Text style={commonStyles.notFound}>
          {TEXTES.fournisseurs.ficheFournisseur.fournisseurIntrouvable}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <ScrollView style={commonStyles.flex1} contentContainerStyle={commonStyles.scrollContent}>
        <View style={commonStyles.header}>
          <View style={commonStyles.flex1}>
            <Text style={commonStyles.title}>{fournisseur.nomEntreprise}</Text>
            <Text style={commonStyles.subtitle}>
              {fournisseur.nom}
              {fournisseur.prenom ? ` ${fournisseur.prenom}` : ''}
            </Text>
          </View>
          <Pressable style={commonStyles.boutonMenu} onPress={() => e.setMenuOuvert(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
          </Pressable>
        </View>

        <OptionsModal
          visible={e.menuOuvert}
          onClose={() => e.setMenuOuvert(false)}
          title={fournisseur.nomEntreprise}
          options={[
            {
              label: TEXTES.commun.general.modifierLaFiche,
              icon: 'create',
              onPress: () => {
                e.setMenuOuvert(false);
                e.setEditing(true);
              },
            },
            {
              label: TEXTES.commun.general.supprimerDefinitivement,
              icon: 'trash',
              color: colors.danger,
              onPress: () => {
                e.setMenuOuvert(false);
                e.setSuppressionOuverte(true);
              },
            },
          ]}
        />

        {e.editing ? (
          <FournisseurFormulaire
            form={form}
            onChange={e.setForm}
          />
        ) : (
          <>
            <FournisseurLecture fournisseur={fournisseur} onModifier={() => e.setEditing(true)} />
            <ContactLie id={fournisseur.id} />
            {e.ecritures.length > 0 && <FournisseurTotal resume={e.resume} />}
            <FournisseurEcritures ecritures={e.ecritures} />
          </>
        )}
      </ScrollView>

      <ConfirmModal
        visible={e.suppressionOuverte}
        title={TEXTES.commun.general.supprimerDefinitivementQuestion}
        message={TEXTES.fournisseurs.ficheFournisseur.cetteActionSupprimeraDefinitivementLa(
          fournisseur.nomEntreprise,
        )}
        confirmLabel={TEXTES.commun.general.supprimerDefinitivement}
        onCancel={() => e.setSuppressionOuverte(false)}
        onConfirm={e.supprimerDefinitivement}
      />

      <InfoModal visible={!!e.erreur} title={e.erreur ?? ''} onClose={() => e.setErreur(null)} />
    </Screen>
  );
}
