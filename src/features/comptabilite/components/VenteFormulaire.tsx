import { Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import type { Vente } from '@/features/comptabilite/types';
import { ChampActivite } from '@/features/comptabilite/components/ChampActivite';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import { CATEGORIE_VENTE, UNITE_VENTE } from '@/shared/constants/comptabilite';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const OPTIONS_PRODUIT = [
  { value: CATEGORIE_VENTE.LAIT, label: TEXTES.comptabilite.ficheVente.lait },
  { value: CATEGORIE_VENTE.FROMAGE, label: TEXTES.comptabilite.ficheVente.fromage },
  {
    value: CATEGORIE_VENTE.CABRIS,
    get label() {
      return TEXTES.commun.general.cabris;
    },
  },
];

const OPTIONS_UNITE = [
  { value: UNITE_VENTE.KG, label: TEXTES.commun.general.kg },
  { value: UNITE_VENTE.PIECE, label: TEXTES.commun.general.piece },
];

interface Props {
  form: Vente;
  onChange: (form: Vente) => void;
  onChangerCategorie: (categorie: Vente['categorie']) => void;
  /** Texte tel que saisi pour le prix (évite de perdre la virgule en cours de frappe). */
  montantTexte: string;
  onChangerMontant: (valeur: string) => void;
  onAnnuler: () => void;
  onEnregistrer: () => void;
}

/** Formulaire de modification d'une vente de production. */
export function VenteFormulaire({
  form,
  onChange,
  onChangerCategorie,
  montantTexte,
  onChangerMontant,
  onAnnuler,
  onEnregistrer,
}: Props) {
  const estLait = form.categorie === CATEGORIE_VENTE.LAIT;
  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{TEXTES.comptabilite.ficheVente.modifierLaVente}</Text>

      <ChampActivite
        value={activiteVente(form)}
        onChange={(activite) => onChange({ ...form, activite })}
        avecCommun={false}
      />

      <SelectField
        label={TEXTES.comptabilite.ficheVente.produit}
        value={form.categorie}
        onChange={onChangerCategorie}
        options={OPTIONS_PRODUIT}
      />

      <DateField
        label={TEXTES.commun.general.date}
        value={form.date}
        onChange={(date) => onChange({ ...form, date })}
      />

      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.commun.general.quantite}
            value={String(form.quantite)}
            onChangeText={(valeur) => onChange({ ...form, quantite: Number(valeur.replace(',', '.')) || 0 })}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </View>
        {form.categorie === CATEGORIE_VENTE.CABRIS && (
          <View style={commonStyles.flex1}>
            <FormField
              label={TEXTES.commun.general.poidsKg}
              value={form.poidsKg !== undefined ? String(form.poidsKg) : ''}
              onChangeText={(valeur) =>
                onChange({ ...form, poidsKg: Number(valeur.replace(',', '.')) || undefined })
              }
              keyboardType="decimal-pad"
              placeholder={TEXTES.commun.general.facultatif}
            />
          </View>
        )}
      </View>

      {form.categorie === CATEGORIE_VENTE.FROMAGE ? (
        <SelectField
          label={TEXTES.commun.general.unite}
          value={form.unite ?? ''}
          onChange={(valeur) => onChange({ ...form, unite: valeur as Vente['unite'] })}
          options={OPTIONS_UNITE}
        />
      ) : null}

      <FormField
        label={TEXTES.comptabilite.ficheVente.prixTotal}
        required={!estLait}
        value={montantTexte}
        onChangeText={onChangerMontant}
        keyboardType="decimal-pad"
        placeholder={estLait ? TEXTES.commun.general.facultatif : '0,00'}
      />

      <FormField
        label={TEXTES.commun.general.client}
        value={form.client ?? ''}
        onChangeText={(client) => onChange({ ...form, client })}
        placeholder={TEXTES.commun.general.facultatif}
      />

      <View style={commonStyles.row}>
        <Button
          style={commonStyles.flex1}
          variant="secondary"
          label={TEXTES.commun.general.annuler}
          onPress={onAnnuler}
        />
        <Button
          style={commonStyles.flex1}
          label={TEXTES.commun.general.enregistrer}
          onPress={onEnregistrer}
        />
      </View>
    </Card>
  );
}
