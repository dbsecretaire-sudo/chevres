import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/Screen';
import { Badge } from '@/shared/components/Badge';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { InfoModal } from '@/shared/components/InfoModal';
import { colors } from '@/shared/theme/colors';
import { formatDateFR } from '@/shared/utils/dates';
import { VenteFormulaire } from '@/features/comptabilite/components/VenteFormulaire';
import { VenteLecture } from '@/features/comptabilite/components/VenteLecture';
import { AnimauxDeLaVente } from '@/features/comptabilite/components/AnimauxDeLaVente';
import { AnimauxVendusEdition } from '@/features/comptabilite/components/AnimauxVendusEdition';
import { LotsVendusEdition } from '@/features/comptabilite/components/LotsVendusEdition';
import { useFicheVente } from '@/features/comptabilite/hooks/useFicheVente';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { idsDesFromages, libelleCategorieVente } from '@/features/comptabilite/utils/ventes';

export default function FicheVente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fiche = useFicheVente(id);
  const { vente, form } = fiche;

  if (!vente || !form) {
    return (
      <Screen>
        <Text style={commonStyles.notFound}>{TEXTES.comptabilite.ficheVente.venteIntrouvable}</Text>
      </Screen>
    );
  }

  const titre = libelleCategorieVente(vente);

  return (
    <Screen scroll={false}>
      <ScrollView style={commonStyles.flex1} contentContainerStyle={commonStyles.scrollContent}>
        <View style={commonStyles.header}>
          <View style={commonStyles.flex1}>
            <Text style={commonStyles.title}>{titre}</Text>
            <Text style={commonStyles.subtitle}>
              {formatDateFR(vente.date)} · {vente.prix?.toFixed(2)} €
            </Text>
          </View>

          <View style={commonStyles.headerDroite}>
            <Badge label={TEXTES.commun.general.vente} color={colors.primary} />
            <Pressable style={commonStyles.boutonMenu} onPress={() => fiche.setMenuOuvert(true)}>
              <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <OptionsModal
          visible={fiche.menuOuvert}
          onClose={() => fiche.setMenuOuvert(false)}
          title={titre}
          options={[
            {
              label: TEXTES.comptabilite.ficheVente.modifierLaVente,
              icon: 'create',
              onPress: () => {
                fiche.setMenuOuvert(false);
                fiche.setEditing(true);
              },
            },
            {
              label: TEXTES.commun.general.supprimerDefinitivement,
              icon: 'trash',
              onPress: () => {
                fiche.setMenuOuvert(false);
                fiche.setSuppressionOuverte(true);
              },
            },
          ]}
        />

        {fiche.editing ? (
          <VenteFormulaire
            form={form}
            onChange={fiche.setForm}
            onChangerCategorie={fiche.changerCategorie}
            client={fiche.clientDeLaVente}
            prixDuContact={fiche.prixDuContact}
            clients={fiche.clients}
            montantTexte={fiche.montantTexte}
            onChangerMontant={fiche.changerMontant}
            onEnregistrer={() => fiche.enregistrerModifications()}
            // Les animaux vendus (cabris, adultes…) : leur boucle, M ou F et leur naissance ; les fromages et la charcuterie, désignés
            // par leur n° de lot quand le produit en a — comme dans le formulaire de vente.
            complement={
              <>
                <AnimauxVendusEdition form={form} onChange={fiche.setForm} />
                <LotsVendusEdition
                  vente={form}
                  venteId={form.id}
                  ids={idsDesFromages(form)}
                  onChange={(ids) =>
                    fiche.setForm({
                      ...form,
                      fromages: ids.length > 0 ? ids.join(';') : undefined,
                      quantite: ids.length > 0 ? ids.length : form.quantite,
                    })
                  }
                />
              </>
            }
          />
        ) : (
          <>
            <VenteLecture vente={vente} onModifier={() => fiche.setEditing(true)} />
            <AnimauxDeLaVente vente={vente} />
          </>
        )}
      </ScrollView>

      <ConfirmModal
        visible={fiche.suppressionOuverte}
        title={TEXTES.commun.general.supprimerDefinitivementQuestion}
        message={TEXTES.comptabilite.ficheVente.cetteActionSupprimeraDefinitivementCette(
          formatDateFR(vente.date),
        )}
        confirmLabel={TEXTES.commun.general.supprimerDefinitivement}
        onCancel={() => fiche.setSuppressionOuverte(false)}
        onConfirm={fiche.supprimerDefinitivement}
      />

      <InfoModal
        visible={!!fiche.erreur}
        title={fiche.erreur?.titre ?? ''}
        message={fiche.erreur?.message}
        onClose={() => fiche.setErreur(null)}
      />
    </Screen>
  );
}
