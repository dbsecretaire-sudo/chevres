import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { BoutonEnteteCirculation } from '@/features/comptabilite/components/BoutonEnteteCirculation';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/Screen';
import { Badge } from '@/shared/components/Badge';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { InfoModal } from '@/shared/components/InfoModal';
import { colors } from '@/shared/theme/colors';
import { formatDateFR } from '@/shared/utils/dates';
import { FactureFormulaire } from '@/features/comptabilite/components/FactureFormulaire';
import { FactureLecture } from '@/features/comptabilite/components/FactureLecture';
import { useFicheFacture } from '@/features/comptabilite/hooks/useFicheFacture';
import { TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { nomsDesAbattoirs, tiersEstUnAbattoir } from '@/features/fournisseurs/services/abattoirs';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { ROUTES } from '@/shared/constants/routes';
import { idsDesAnimauxAchetes } from '@/features/comptabilite/utils/ventes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

export default function FicheFacture() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const f = useFicheFacture(id);
  const { facture, form } = f;
  const router = useRouter();
  const retour = useAdresseCourante();
  const [abattoirs, setAbattoirs] = useState<Set<string>>(new Set());
  useEffect(() => {
    nomsDesAbattoirs().then(setAbattoirs).catch(() => undefined);
  }, []);

  if (!facture || !form) {
    return (
      <Screen>
        <Text style={commonStyles.notFound}>{TEXTES.comptabilite.ficheFacture.factureIntrouvable}</Text>
      </Screen>
    );
  }

  const estEmise = facture.type === TYPE_FACTURE.EMISE;
  /** Des animaux vivants achetés (à un autre éleveur) : le document de circulation part de chez le vendeur, avec ces animaux. */
  const achatAnimaux = !estEmise && idsDesAnimauxAchetes(facture).length > 0;
  /** La dépense d'un abattoir : comme un achat d'animaux, elle a son document de circulation (à déposer, ou le modèle à générer). */
  const depenseAbattoir = !estEmise && tiersEstUnAbattoir(facture.tiers, abattoirs);

  return (
    <Screen scroll={false}>
      {(achatAnimaux || depenseAbattoir) && !f.editing ? (
        <Stack.Screen
          options={{
            headerRight: () => (
              <BoutonEnteteCirculation
                onPress={() => router.push(ROUTES.documentsCirculationDepuis(retour, `facture:${facture.id}`) as never)}
              />
            ),
          }}
        />
      ) : null}
      <ScrollView style={commonStyles.flex1} contentContainerStyle={commonStyles.scrollContent}>
        <View style={commonStyles.header}>
          <View style={commonStyles.flex1}>
            <Text style={commonStyles.title}>{facture.tiers}</Text>
            <Text style={commonStyles.subtitle}>
              {formatDateFR(facture.date)} · {facture.montant.toFixed(2)} €
            </Text>
          </View>

          <View style={commonStyles.headerDroite}>
            <Badge
              label={
                estEmise ? TEXTES.comptabilite.ficheFacture.emise : TEXTES.comptabilite.ficheFacture.recue
              }
              color={estEmise ? colors.primary : colors.danger}
            />
            <Pressable style={commonStyles.boutonMenu} onPress={() => f.setMenuOuvert(true)}>
              <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <OptionsModal
          visible={f.menuOuvert}
          onClose={() => f.setMenuOuvert(false)}
          title={facture.tiers}
          options={[
            {
              label: TEXTES.commun.general.modifierLaFacture,
              icon: 'create',
              onPress: () => {
                f.setMenuOuvert(false);
                f.setEditing(true);
              },
            },
            {
              label: TEXTES.commun.general.supprimerDefinitivement,
              icon: 'trash',
              onPress: () => {
                f.setMenuOuvert(false);
                f.setSuppressionOuverte(true);
              },
            },
          ]}
        />

        {f.editing ? (
          <FactureFormulaire f={f} />
        ) : (
          <FactureLecture facture={facture} compte={f.compteAffiche} onModifier={() => f.setEditing(true)} />
        )}
      </ScrollView>

      <ConfirmModal
        visible={f.suppressionOuverte}
        title={TEXTES.commun.general.supprimerDefinitivementQuestion}
        message={TEXTES.comptabilite.ficheFacture.cetteActionSupprimeraDefinitivementLa(facture.tiers)}
        confirmLabel={TEXTES.commun.general.supprimerDefinitivement}
        onCancel={() => f.setSuppressionOuverte(false)}
        onConfirm={f.supprimerDefinitivement}
      />

      <InfoModal
        visible={!!f.erreur}
        title={f.erreur?.titre ?? ''}
        message={f.erreur?.message}
        onClose={() => f.setErreur(null)}
      />
    </Screen>
  );
}
