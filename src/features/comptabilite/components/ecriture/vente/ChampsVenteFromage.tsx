import { Text, View } from 'react-native';
import { formatMontant } from '@/shared/utils/dates';
import { useRouter } from 'expo-router';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { ChampPrixPersonnalise } from '@/features/comptabilite/components/ecriture/ChampPrixPersonnalise';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { AvertissementDelais } from '@/features/exploitation/components/AvertissementDelais';
import { LotsVendusEdition } from '@/features/comptabilite/components/LotsVendusEdition';
import { FormField } from '@/shared/components/FormField';
import { ChampMontantTtc } from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import { useFromagesDuStock } from '@/features/stock/hooks/useFromagesDuStock';
import { CATEGORIE_VENTE, TYPE_FROMAGE } from '@/shared/constants/comptabilite';
import {
  fromageAjouteChoisi,
  optionsFromages,
  typeDuChoix,
  valeurFromage,
} from '@/features/comptabilite/utils/fromages';
import { SECTION_STOCK } from '@/shared/constants/stock';
import { styles } from '@/shared/styles/comptabilite/NouvelleEcriture.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { useTotalVerrouille, usePrixSelonLeContact, ChampTauxTvaVente, type Props } from '@/features/comptabilite/components/ecriture/vente/outilsVente';

/** Vente de fromage (à la pièce) : type, quantité, prix et TVA. */
export function ChampsVenteFromage({ e }: Props) {
  // Les types de fromage viennent du stock : un fromage ajouté là se vend ici, à sa place dans la liste.
  const fromages = useFromagesDuStock();
  const options = optionsFromages(fromages);
  const router = useRouter();
  const retour = useAdresseCourante();
  const ajouteChoisi = fromageAjouteChoisi(fromages, e.typeFromage, e.typeFromageLibre);
  /** Le prix de vente défini au stock pour le fromage choisi (le premier par défaut), s'il y en a un. */
  const prixSelonLeContact = usePrixSelonLeContact(e);
  const fromageChoisi = fromages.find(
    (f) => valeurFromage(f) === (ajouteChoisi ? valeurFromage(ajouteChoisi) : e.typeFromage),
  );
  const prixDuChoix = prixSelonLeContact(fromageChoisi?.cle, fromageChoisi?.prix);
  // Le prix total est celui de l'inventaire × la quantité : recalculé dès que le fromage, son prix ou la quantité change.
  useTotalVerrouille(e, prixDuChoix, e.quantite);
  /** Un fromage ajouté se note comme « autre » avec son nom : c'est ainsi que la vente retrouve son stock. */
  const choisirFromage = (valeur: string) => {
    const choix = typeDuChoix(fromages, valeur);
    e.setTypeFromage(choix.typeFromage);
    e.setTypeFromageLibre(choix.typeFromageLibre);
    // Les lots choisis sont ceux d'un autre fromage.
    e.setFromages([]);
  };

  return (
    <>
      <AvertissementDelais type="lait" date={e.date} />
      <SelectFieldEditable
        label={TEXTES.comptabilite.nouvelleEcriture.typeDeFromage}
        required
        value={ajouteChoisi ? valeurFromage(ajouteChoisi) : e.typeFromage}
        onChange={choisirFromage}
        options={options}
        onEdit={() =>
          router.push(
            ROUTES.stockDepuis(
              retour,
              SECTION_STOCK.FROMAGES,
              e.activite === ACTIVITE_COMMUNE ? undefined : e.activite,
            ),
          )
        }
      />
      {e.typeFromage === TYPE_FROMAGE.AUTRE && !ajouteChoisi && (
        <FormField
          label={TEXTES.comptabilite.nouvelleEcriture.preciserLeType}
          value={e.typeFromageLibre}
          onChangeText={(texte) => {
            e.setTypeFromageLibre(texte);
            e.setFromages([]);
          }}
        />
      )}
      {/* Un fromage qui a des lots se vend lot par lot : le nombre de fromages est celui des lots choisis. */}
      <LotsVendusEdition
        vente={{
          categorie: CATEGORIE_VENTE.FROMAGE,
          typeFromage: e.typeFromage,
          typeFromageLibre: e.typeFromageLibre,
          activite: e.activite,
        }}
        ids={e.fromages}
        onChange={(ids) => {
          e.setFromages(ids);
          if (ids.length > 0) e.setQuantite(String(ids.length));
        }}
      />
      <View style={styles.row3}>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.commun.general.quantite}
            required
            value={e.quantite}
            onChangeText={e.setQuantite}
            editable={e.fromages.length === 0}
            keyboardType="decimal-pad"
            placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            value={e.montant}
            onChange={e.setMontant}
            // Le prix défini à l'inventaire fait le total (quantité × prix) : on ne le saisit pas, sauf prix personnalisé.
            editable={e.prixLibre || e.prixPersonnalise}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxTvaVente e={e} />
        </View>
      </View>
      <ChampPrixPersonnalise e={e} unite="piece" prixInventaire={prixDuChoix} />
      {e.prixLibre ? (
        <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.prixLibreRecolteur}</Text>
      ) : (
        <Text style={commonStyles.note}>
          {prixDuChoix
            ? TEXTES.comptabilite.nouvelleEcriture.prixDuStock(formatMontant(prixDuChoix))
            : TEXTES.comptabilite.nouvelleEcriture.aucunPrixInventaire}
        </Text>
      )}
    </>
  );
}
