import { Text, View } from 'react-native';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { ChampMontantTtc } from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import type { EtatNouvelleEcriture } from '@/features/comptabilite/hooks/useNouvelleEcriture';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import type { TypeAide, TypeFromage } from '@/features/comptabilite/types';
import { TYPE_AIDE, TYPE_FROMAGE, UNITE_VENTE } from '@/shared/constants/comptabilite';
import { styles } from '@/shared/styles/comptabilite/NouvelleEcriture.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_TYPE_AIDE, LABEL_TYPE_FROMAGE, LABEL_UNITE_VENTE } from '@/shared/textes/libelles';

type Props = { e: EtatNouvelleEcriture };

const OPTIONS_TYPE_AIDE = Object.entries(LABEL_TYPE_AIDE).map(([value, label]) => ({
  value: value as TypeAide,
  label,
}));
const OPTIONS_TYPE_FROMAGE = Object.entries(LABEL_TYPE_FROMAGE).map(([value, label]) => ({
  value: value as TypeFromage,
  label,
}));
const OPTIONS_UNITE_FROMAGE = [UNITE_VENTE.PIECE, UNITE_VENTE.KG].map((value) => ({
  value,
  label: LABEL_UNITE_VENTE[value],
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

/** Champs d'une aide / subvention : type d'aide, montant et taux d'imposition. */
export function ChampsAide({ e }: Props) {
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

/** Vente de fromage : type, unité, quantité, prix et TVA. */
export function ChampsVenteFromage({ e }: Props) {
  return (
    <>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <SelectField
            label={TEXTES.comptabilite.nouvelleEcriture.typeDeFromage}
            required
            value={e.typeFromage}
            onChange={e.setTypeFromage}
            options={OPTIONS_TYPE_FROMAGE}
          />
        </View>
        <View style={commonStyles.flex1}>
          <SelectField
            label={TEXTES.commun.general.unite}
            required
            value={e.unite}
            onChange={e.setUnite}
            options={OPTIONS_UNITE_FROMAGE}
          />
        </View>
      </View>
      {e.typeFromage === TYPE_FROMAGE.AUTRE && (
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
