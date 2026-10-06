import { Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import type { Vente } from '@/features/comptabilite/types';
import { ChampActivite } from '@/features/comptabilite/components/ChampActivite';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import {
  CATEGORIES_VENTE_ANIMAUX,
  CATEGORIES_VENTE_AVEC_PRECISION,
  CATEGORIES_VENTE_VIANDE,
  CATEGORIE_VENTE,
} from '@/shared/constants/comptabilite';
import { categoriesRecetteActivite, estCategorieVente } from '@/features/comptabilite/utils/recettes';
import { libelleCategorieVente } from '@/features/comptabilite/utils/ventes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Produits proposés pour l'espèce de la vente (le produit déjà enregistré y reste, même s'il n'en fait plus partie). */
function optionsProduit(vente: Vente) {
  const categories = categoriesRecetteActivite(activiteVente(vente)).filter((c): c is Vente['categorie'] =>
    estCategorieVente(c),
  );
  if (!categories.includes(vente.categorie)) categories.unshift(vente.categorie);
  return categories.map((categorie) => ({
    value: categorie,
    label: libelleCategorieVente({ categorie, activite: vente.activite }),
  }));
}

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
  const estViande = (CATEGORIES_VENTE_VIANDE as readonly string[]).includes(form.categorie);
  const estAnimal = (CATEGORIES_VENTE_ANIMAUX as readonly string[]).includes(form.categorie);
  const aPrecision = (CATEGORIES_VENTE_AVEC_PRECISION as readonly string[]).includes(form.categorie);
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
        options={optionsProduit(form)}
      />

      <DateField
        label={TEXTES.commun.general.date}
        value={form.date}
        onChange={(date) => onChange({ ...form, date })}
      />

      {!estViande && (
        <View style={commonStyles.row}>
          <View style={commonStyles.flex1}>
            <FormField
              label={TEXTES.commun.general.quantite}
              value={String(form.quantite)}
              onChangeText={(valeur) =>
                onChange({ ...form, quantite: Number(valeur.replace(',', '.')) || 0 })
              }
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </View>
          {estAnimal && (
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
      )}

      {form.categorie === CATEGORIE_VENTE.FROMAGE ? (
        <FormField
          label={TEXTES.comptabilite.nouvelleEcriture.nombreDeSacs}
          value={form.sacs !== undefined ? String(form.sacs) : ''}
          onChangeText={(valeur) =>
            onChange({ ...form, sacs: Math.round(Number(valeur.replace(',', '.'))) || undefined })
          }
          keyboardType="number-pad"
          placeholder={TEXTES.commun.general.facultatif}
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

      {aPrecision && (
        <FormField
          label={TEXTES.comptabilite.nouvelleEcriture.precision}
          value={form.precision ?? ''}
          onChangeText={(precision) => onChange({ ...form, precision })}
          placeholder={TEXTES.comptabilite.nouvelleEcriture.precisionPlaceholder}
        />
      )}

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
