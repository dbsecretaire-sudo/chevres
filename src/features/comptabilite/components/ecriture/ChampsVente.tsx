import { Text, View } from 'react-native';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { ChampMontantTtc } from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import type { EtatNouvelleEcriture } from '@/features/comptabilite/hooks/useNouvelleEcriture';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import type { TypeAide, TypeFromage } from '@/features/comptabilite/types';
import { useFromagesDuStock } from '@/features/stock/hooks/useFromagesDuStock';
import { TYPE_AIDE, TYPE_FROMAGE } from '@/shared/constants/comptabilite';
import { PREFIXE_FROMAGE_AJOUTE } from '@/shared/constants/stock';
import { styles } from '@/shared/styles/comptabilite/NouvelleEcriture.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_TYPE_AIDE, LABEL_TYPE_FROMAGE } from '@/shared/textes/libelles';

type Props = { e: EtatNouvelleEcriture };

const OPTIONS_TYPE_AIDE = Object.entries(LABEL_TYPE_AIDE).map(([value, label]) => ({
  value: value as TypeAide,
  label,
}));
const OPTIONS_TYPE_FROMAGE = Object.entries(LABEL_TYPE_FROMAGE).map(([value, label]) => ({
  value: value as TypeFromage,
  label,
}));

function ChampTauxTvaVente({ e }: Props) {
  return (
    <SelectField
      label={TEXTES.commun.general.tauxDeTva}
      value={e.tauxTvaVente}
      onChange={e.setTauxTvaVente}
      options={OPTIONS_TAUX_TVA}
    />
  );
}

/** Type d'aide (DPB, écorégime, ICHN…) : remplace le numéro de facture pour une aide / subvention. */
export function ChampTypeAide({ e }: Props) {
  return (
    <>
      <SelectField
        label={TEXTES.comptabilite.nouvelleEcriture.typeDAide}
        required
        value={e.typeAide}
        onChange={e.changerTypeAide}
        options={OPTIONS_TYPE_AIDE}
      />
      {e.typeAide === TYPE_AIDE.AUTRE && (
        <FormField
          label={TEXTES.comptabilite.nouvelleEcriture.preciserLeTypeDAide}
          value={e.typeAideLibre}
          onChangeText={e.setTypeAideLibre}
          placeholder={TEXTES.comptabilite.nouvelleEcriture.exAideGnrGuerreUkrainePoints}
        />
      )}
    </>
  );
}

/** Montant et taux d'imposition d'une aide / subvention (son type se choisit en haut du formulaire). */
export function ChampsAide({ e }: Props) {
  return (
    <>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc value={e.montant} onChange={e.setMontant} />
        </View>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.comptabilite.nouvelleEcriture.tauxDImposition}
            value={e.tauxImpositionLibre}
            onChangeText={e.setTauxImpositionLibre}
            keyboardType="decimal-pad"
            placeholder="0-100"
          />
        </View>
      </View>
      <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.partDuMontantIncluseDans}</Text>
    </>
  );
}

/** Vente de lait : litrage, prix (facultatif) et TVA. */
export function ChampsVenteLait({ e }: Props) {
  return (
    <>
      <FormField
        label={TEXTES.comptabilite.nouvelleEcriture.litrage}
        required
        value={e.quantite}
        onChangeText={e.setQuantite}
        keyboardType="decimal-pad"
        placeholder={TEXTES.comptabilite.nouvelleEcriture.ex125}
      />
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            value={e.montant}
            onChange={e.setMontant}
            required={false}
            placeholder={TEXTES.commun.general.facultatif}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxTvaVente e={e} />
        </View>
      </View>
    </>
  );
}

/** Vente de fromage (à la pièce) : type, nombre de sacs, quantité, prix et TVA. */
export function ChampsVenteFromage({ e }: Props) {
  // Les types de fromage viennent du stock : un fromage ajouté là se vend ici, à sa place dans la liste.
  const fromages = useFromagesDuStock();
  const options =
    fromages.length > 0
      ? fromages.map((f) => ({
          value: f.id ? `${PREFIXE_FROMAGE_AJOUTE}${f.id}` : f.cle.split(':')[1],
          label: f.libelle,
        }))
      : OPTIONS_TYPE_FROMAGE;
  const ajouteChoisi = fromages.find(
    (f) =>
      f.id &&
      e.typeFromage === TYPE_FROMAGE.AUTRE &&
      e.typeFromageLibre.trim().toLowerCase() === f.libelle.trim().toLowerCase(),
  );
  /** Un fromage ajouté se note comme « autre » avec son nom : c'est ainsi que la vente retrouve son stock. */
  const choisirFromage = (valeur: string) => {
    if (valeur.startsWith(PREFIXE_FROMAGE_AJOUTE)) {
      const ajoute = fromages.find((f) => f.id === valeur.slice(PREFIXE_FROMAGE_AJOUTE.length));
      e.setTypeFromage(TYPE_FROMAGE.AUTRE);
      e.setTypeFromageLibre(ajoute?.libelle ?? '');
    } else {
      e.setTypeFromage(valeur as TypeFromage);
      e.setTypeFromageLibre('');
    }
  };

  return (
    <>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <SelectField
            label={TEXTES.comptabilite.nouvelleEcriture.typeDeFromage}
            required
            value={ajouteChoisi ? `${PREFIXE_FROMAGE_AJOUTE}${ajouteChoisi.id}` : e.typeFromage}
            onChange={choisirFromage}
            options={options}
          />
        </View>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.comptabilite.nouvelleEcriture.nombreDeSacs}
            value={e.sacs}
            onChangeText={e.setSacs}
            keyboardType="number-pad"
            placeholder={TEXTES.commun.general.facultatif}
          />
        </View>
      </View>
      {e.typeFromage === TYPE_FROMAGE.AUTRE && !ajouteChoisi && (
        <FormField
          label={TEXTES.comptabilite.nouvelleEcriture.preciserLeType}
          value={e.typeFromageLibre}
          onChangeText={e.setTypeFromageLibre}
        />
      )}
      <View style={styles.row3}>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.commun.general.quantite}
            required
            value={e.quantite}
            onChangeText={e.setQuantite}
            keyboardType="decimal-pad"
            placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            value={e.montant}
            onChange={e.setMontant}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxTvaVente e={e} />
        </View>
      </View>
    </>
  );
}

/** Vente de cabris : nombre, poids (facultatif), prix et TVA. */
export function ChampsVenteCabris({ e }: Props) {
  return (
    <>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.comptabilite.nouvelleEcriture.nombreDeCabris}
            required
            value={e.quantite}
            onChangeText={e.setQuantite}
            keyboardType="decimal-pad"
            placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
          />
        </View>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.commun.general.poidsKg}
            value={e.poidsKg}
            onChangeText={e.setPoidsKg}
            keyboardType="decimal-pad"
            placeholder={TEXTES.commun.general.facultatif}
          />
        </View>
      </View>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            value={e.montant}
            onChange={e.setMontant}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxTvaVente e={e} />
        </View>
      </View>
    </>
  );
}

/** Commentaire facultatif pour préciser de quoi il s'agissait. */
function ChampPrecision({ e }: Props) {
  return (
    <FormField
      label={TEXTES.comptabilite.nouvelleEcriture.precision}
      value={e.precision}
      onChangeText={e.setPrecision}
      placeholder={TEXTES.comptabilite.nouvelleEcriture.precisionPlaceholder}
    />
  );
}

/** Vente de viande ou de charcuterie : montant, TVA et précision facultative. */
export function ChampsVenteViande({ e }: Props) {
  return (
    <>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            value={e.montant}
            onChange={e.setMontant}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxTvaVente e={e} />
        </View>
      </View>
      <ChampPrecision e={e} />
    </>
  );
}

/** Vente d'œufs : nombre d'œufs, prix et TVA. */
export function ChampsVenteOeufs({ e }: Props) {
  return (
    <>
      <FormField
        label={TEXTES.comptabilite.nouvelleEcriture.nombreDOeufs}
        required
        value={e.quantite}
        onChangeText={e.setQuantite}
        keyboardType="decimal-pad"
        placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
      />
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            value={e.montant}
            onChange={e.setMontant}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxTvaVente e={e} />
        </View>
      </View>
    </>
  );
}

/** Vente d'un animal sur pied ou vivant : nombre de têtes, poids (facultatif), prix, TVA et précision facultative. */
export function ChampsVenteAnimal({ e }: Props) {
  return (
    <>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.comptabilite.nouvelleEcriture.nombreDeTetes}
            required
            value={e.quantite}
            onChangeText={e.setQuantite}
            keyboardType="decimal-pad"
            placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
          />
        </View>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.commun.general.poidsKg}
            value={e.poidsKg}
            onChangeText={e.setPoidsKg}
            keyboardType="decimal-pad"
            placeholder={TEXTES.commun.general.facultatif}
          />
        </View>
      </View>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            value={e.montant}
            onChange={e.setMontant}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxTvaVente e={e} />
        </View>
      </View>
      <ChampPrecision e={e} />
    </>
  );
}
