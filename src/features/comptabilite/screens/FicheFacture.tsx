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
import type { Vente } from '@/features/comptabilite/types';
import {
  supprimerLaVenteEtRemettreLesAnimaux,
  ventesDuLotDeLaFacture,
} from '@/features/comptabilite/services/suppressionVente';
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
  /** Les ventes aux clients qui portent les mêmes animaux que le lot de cette dépense d'abattoir : on demande s'il faut les supprimer aussi. */
  const [ventesLiees, setVentesLiees] = useState<Vente[] | null>(null);
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
        onConfirm={async () => {
          f.setSuppressionOuverte(false);
          const liees = await ventesDuLotDeLaFacture(facture).catch(() => []);
          if (liees.length === 0) return f.supprimerDefinitivement();
          setVentesLiees(liees);
        }}
      />

      {/* Une vente porte les mêmes animaux : la supprimer aussi (les animaux reviennent vivants), ou garder la vente. */}
      <OptionsModal
        visible={!!ventesLiees}
        onClose={() => setVentesLiees(null)}
        title={`${TEXTES.comptabilite.ficheFacture.venteLiee.titre(ventesLiees?.[0]?.client ?? '', ventesLiees?.[0] ? formatDateFR(ventesLiees[0].date) : '')} ${TEXTES.comptabilite.ficheFacture.venteLiee.aide}`}
        options={[
          {
            label: TEXTES.comptabilite.ficheFacture.venteLiee.lesDeux,
            icon: 'trash',
            color: colors.danger,
            onPress: async () => {
              const liees = ventesLiees ?? [];
              setVentesLiees(null);
              for (const v of liees) await supprimerLaVenteEtRemettreLesAnimaux(v);
              await f.supprimerDefinitivement();
            },
          },
          {
            label: TEXTES.comptabilite.ficheFacture.venteLiee.seulement,
            icon: 'document',
            onPress: async () => {
              setVentesLiees(null);
              await f.supprimerDefinitivement();
            },
          },
        ]}
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
