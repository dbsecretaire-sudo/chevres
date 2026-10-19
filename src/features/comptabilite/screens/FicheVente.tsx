import { Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { ROUTES } from '@/shared/constants/routes';
import { BoutonEnteteCirculation } from '@/features/comptabilite/components/BoutonEnteteCirculation';
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
import { useLots } from '@/features/exploitation/hooks/useLots';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { CATEGORIE_LOT } from '@/shared/constants/lots';
import { documentCirculationRequis, idsDesFromages, libelleCategorieVente } from '@/features/comptabilite/utils/ventes';

export default function FicheVente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fiche = useFicheVente(id);
  const router = useRouter();
  const retour = useAdresseCourante();
  const { lots, creer } = useLots();
  const { vente, form } = fiche;

  if (!vente || !form) {
    return (
      <Screen>
        <Text style={commonStyles.notFound}>{TEXTES.comptabilite.ficheVente.venteIntrouvable}</Text>
      </Screen>
    );
  }

  // Une vente de viande d'un jour d'abattage : le lot « Abattoir du … » en titre, et un bouton qui l'ouvre.
  const jourAbattage = vente.categorie === CATEGORIE_VENTE.VIANDE ? vente.dateAbattoir : undefined;
  const titre = jourAbattage ? TEXTES.cheptel.lots.abattoirDu(formatDateFR(jourAbattage)) : libelleCategorieVente(vente);
  const ouvrirLeLot = async () => {
    if (!jourAbattage) return;
    const lot =
      lots.find((l) => l.abattoir === jourAbattage) ??
      (await creer(TEXTES.cheptel.lots.abattoirDu(formatDateFR(jourAbattage)), '', { abattoir: jourAbattage, categorie: CATEGORIE_LOT.ABATTOIR }));
    // La flèche de retour du lot ramène à Production › Viande.
    router.push(`${ROUTES.lotDeProduction(lot.id)}&retour=${encodeURIComponent(ROUTES.PRODUCTION_VIANDE)}` as never);
  };

  return (
    <Screen scroll={false}>
      {/* Des animaux vendus vivants : le document de circulation (pré-rempli, pour exemple) se génère depuis l'en-tête. */}
      {documentCirculationRequis(vente) && !fiche.editing ? (
        <Stack.Screen
          options={{
            headerRight: () => (
              <BoutonEnteteCirculation
              onPress={() => router.push(ROUTES.documentsCirculationDepuis(retour, `vente:${vente.id}`) as never)}
            />
            ),
          }}
        />
      ) : null}
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
            <VenteLecture vente={vente} onModifier={() => fiche.setEditing(true)} surLeLot={jourAbattage ? ouvrirLeLot : undefined} />
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
