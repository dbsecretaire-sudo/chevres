import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { useViandesDuStock } from '@/features/stock/hooks/useViandesDuStock';
import { lireArchiveStock } from '@/features/stock/repository';
import type { ArchiveStock } from '@/features/stock/types';
import { roleDeLaViande, totalDeLaVente, type FiltreStock } from '@/features/stock/services/stock';
import { ROUTES } from '@/shared/constants/routes';
import { SECTION_STOCK } from '@/shared/constants/stock';
import type { Vente } from '@/features/comptabilite/types';
import { ChampActivite } from '@/features/comptabilite/components/ChampActivite';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import {
  CATEGORIES_VENTE_ANIMAUX,
  CATEGORIES_VENTE_PRIX_INVENTAIRE,
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
  const estViande = (CATEGORIES_VENTE_VIANDE as readonly string[]).includes(form.categorie);
  const estAnimal = (CATEGORIES_VENTE_ANIMAUX as readonly string[]).includes(form.categorie);
  const router = useRouter();
  const retour = useAdresseCourante();
  const activite = activiteVente(form);
  /** Les détails de la vente de viande : les lignes de l'inventaire de l'espèce (le détail déjà enregistré y reste). */
  const viandes = useViandesDuStock(activite as FiltreStock);
  const detailsVente = viandes
    .filter((v) => (roleDeLaViande(v.cle) !== undefined) === (form.categorie === CATEGORIE_VENTE.VIANDE))
    .map((v) => ({ value: v.libelle, label: v.libelle }));
  if (form.precision && !detailsVente.some((d) => d.value === form.precision))
    detailsVente.unshift({ value: form.precision, label: form.precision });
  /** L'inventaire (prix de vente) : il fait le prix total de la vente, jamais saisi. */
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  useFocusEffect(
    useCallback(() => {
      lireArchiveStock().then(setArchive);
    }, []),
  );
  const prixInventaire = (CATEGORIES_VENTE_PRIX_INVENTAIRE as readonly string[]).includes(form.categorie);
  const totalInventaire = archive ? totalDeLaVente(form, archive) : undefined;
  const animalEntier = form.categorie === CATEGORIE_VENTE.VIANDE;
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

      {estViande && detailsVente.length > 0 ? (
        <SelectFieldEditable<string>
          label={TEXTES.comptabilite.nouvelleEcriture.detailDeLaVente}
          required
          searchable
          placeholder={TEXTES.comptabilite.nouvelleEcriture.choixDuDetail}
          value={form.precision ?? ''}
          onChange={(precision) => onChange({ ...form, precision })}
          options={detailsVente}
          onEdit={() =>
            router.push(
              ROUTES.stockDepuis(
                retour,
                animalEntier ? SECTION_STOCK.ANIMAUX : SECTION_STOCK.VIANDE,
                activite as FiltreStock,
              ),
            )
          }
        />
      ) : estViande ? (
        <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.aucuneViandeAuStock}</Text>
      ) : null}

      {animalEntier ? (
        <FormField
          label={TEXTES.commun.general.poidsKg}
          required
          value={form.poidsKg !== undefined ? String(form.poidsKg) : ''}
          onChangeText={(valeur) =>
            onChange({ ...form, poidsKg: Number(valeur.replace(',', '.')) || undefined })
          }
          keyboardType="decimal-pad"
          placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
        />
      ) : (
        <View style={commonStyles.row}>
          <View style={commonStyles.flex1}>
            <FormField
              label={TEXTES.commun.general.quantite}
              required
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

      {/* Le prix total vient de l'inventaire (prix défini × quantité ou × poids) : on ne le saisit pas. */}
      <FormField
        label={TEXTES.comptabilite.ficheVente.prixTotal}
        required
        value={
          prixInventaire
            ? totalInventaire !== undefined
              ? String(totalInventaire).replace('.', ',')
              : ''
            : montantTexte
        }
        onChangeText={onChangerMontant}
        editable={!prixInventaire}
        style={prixInventaire ? commonStyles.verrouille : undefined}
        keyboardType="decimal-pad"
        placeholder="0,00"
      />
      {prixInventaire && totalInventaire === undefined ? (
        <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.aucunPrixInventaire}</Text>
      ) : null}

      <FormField
        label={TEXTES.commun.general.client}
        required
        value={form.client ?? ''}
        onChangeText={(client) => onChange({ ...form, client })}
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
