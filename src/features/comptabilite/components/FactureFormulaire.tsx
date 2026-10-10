import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { ChampActivite } from '@/features/comptabilite/components/ChampActivite';
import { LignesMarchandisesEditor } from '@/features/comptabilite/components/LignesMarchandisesEditor';
import { LignesAlimentationEditor } from '@/features/comptabilite/components/LignesAlimentationEditor';
import { LignesCarburantEditor } from '@/features/comptabilite/components/LignesCarburantEditor';
import type { EtatFicheFacture } from '@/features/comptabilite/hooks/useFicheFacture';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { ChampNatureUrssaf } from '@/features/comptabilite/components/ChampNatureUrssaf';
import {
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  TYPE_AIDE,
  TYPE_FACTURE,
} from '@/shared/constants/comptabilite';
import { CATEGORIES_RECETTE_AVEC_NATURE_URSSAF } from '@/shared/constants/entreprise';
import { ROUTES } from '@/shared/constants/routes';
import { formatTotalEuros } from '@/shared/utils/nombres';
import { nomComplet } from '@/shared/utils/personne';
import { estArticleBoucle } from '@/features/stock/services/boucles';
import { ChampStockProduction } from '@/features/comptabilite/components/ecriture/ChampStockProduction';
import { styles } from '@/shared/styles/comptabilite/FicheFacture.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_TYPE_AIDE } from '@/shared/textes/libelles';
import type { TypeAide } from '@/features/comptabilite/types';

/** Formulaire de modification d'une facture (le type, lui, n'est pas modifiable). */
export function FactureFormulaire({ f }: { f: EtatFicheFacture }) {
  const router = useRouter();
  const { settings } = useAppSettings();
  const { form, fournisseurs, clients } = f;
  if (!form) return null;

  // Une entreprise non assujettie à la TVA n'a pas de taux à saisir.
  const sansTva = modeEntreprise() && !settings.exploitation?.entreprise?.tvaApplicable;
  const champTauxTva = sansTva ? null : (
    <SelectField
      label={TEXTES.commun.general.tauxDeTva}
      value={form.tauxTva?.toString() ?? ''}
      onChange={f.changerTauxTva}
      options={OPTIONS_TAUX_TVA}
    />
  );

  const OPTIONS_TYPE_AIDE = Object.entries(LABEL_TYPE_AIDE).map(([value, label]) => ({
    value: value as TypeAide,
    label,
  }));

  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{TEXTES.commun.general.modifierLaFacture}</Text>

      <Text style={commonStyles.labelMuted}>{TEXTES.commun.general.type}</Text>
      <Text style={commonStyles.body}>
        {form.type === TYPE_FACTURE.EMISE
          ? TEXTES.commun.general.factureEmise
          : TEXTES.commun.general.factureRecue}
      </Text>
      <Text style={commonStyles.note}>{TEXTES.comptabilite.ficheFacture.nonModifiableLaCategorieLe}</Text>

      <ChampActivite value={f.activiteForm} onChange={f.changerActivite} avecCommun={!f.estAlimentation} />

      <View style={commonStyles.rowFin}>
        <View style={commonStyles.flex1}>
          <DateField
            label={TEXTES.commun.general.date}
            value={form.date}
            onChange={(date) => f.setForm({ ...form, date })}
          />
        </View>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.comptabilite.ficheFacture.nFacture}
            value={form.description ?? ''}
            onChangeText={(description) => f.setForm({ ...form, description })}
            placeholder={TEXTES.comptabilite.ficheFacture.nFacture}
          />
        </View>
      </View>

      {form.type === TYPE_FACTURE.RECUE ? (
        <SelectFieldEditable
          label={TEXTES.commun.general.fournisseur}
          required
          searchable
          placeholder={TEXTES.commun.general.choixDuFournisseur}
          value={fournisseurs.find((x) => x.nomEntreprise === form.tiers)?.id ?? ''}
          onChange={f.choisirFournisseur}
          options={fournisseurs.map((x) => ({ value: x.id, label: x.nomEntreprise }))}
          onEdit={() => router.push(ROUTES.FOURNISSEURS)}
        />
      ) : (
        <SelectFieldEditable
          label={TEXTES.commun.general.client}
          required
          searchable
          placeholder={TEXTES.commun.general.choixDuClient}
          value={clients.find((c) => nomComplet(c) === form.tiers)?.id ?? ''}
          onChange={f.choisirClient}
          options={clients.map((c) => ({ value: c.id, label: nomComplet(c) }))}
          onEdit={() => router.push(ROUTES.CLIENTS)}
        />
      )}

      {modeEntreprise() &&
      ((form.type === TYPE_FACTURE.EMISE &&
        form.categorieRecette &&
        (CATEGORIES_RECETTE_AVEC_NATURE_URSSAF as readonly string[]).includes(form.categorieRecette)) ||
        (form.type === TYPE_FACTURE.RECUE &&
          form.categorieDepense === CATEGORIE_DEPENSE.REMBOURSEMENT_CLIENT)) ? (
        <ChampNatureUrssaf
          value={form.natureUrssaf ?? ''}
          onChange={(valeur) =>
            f.setForm({ ...form, natureUrssaf: (valeur || undefined) as typeof form.natureUrssaf })
          }
        />
      ) : null}

      {form.type === TYPE_FACTURE.EMISE && form.categorieRecette === CATEGORIE_RECETTE.AIDE && (
        <>
          <SelectField
            label={TEXTES.comptabilite.nouvelleEcriture.typeDAide}
            value={form.typeAide ?? ''}
            onChange={(typeAide) =>
              f.setForm({
                ...form,
                typeAide: typeAide as typeof form.typeAide,
              })
            }
            options={OPTIONS_TYPE_AIDE}
          />

          {form.typeAide === TYPE_AIDE.AUTRE && (
            <FormField
              label={TEXTES.comptabilite.nouvelleEcriture.preciserLeTypeDAide}
              value={form.typeAideLibre ?? ''}
              onChangeText={(typeAideLibre) =>
                f.setForm({
                  ...form,
                  typeAideLibre,
                })
              }
              placeholder={TEXTES.comptabilite.nouvelleEcriture.exAideGnrGuerreUkrainePoints}
            />
          )}
        </>
      )}

      {f.estAlimentation ? (
        <>
          <LignesAlimentationEditor lignes={f.lignes} onChange={f.setLignes} activite={f.activiteForm} />
          <Text style={styles.total}>
            {TEXTES.commun.general.totalFactureTtcDeuxPoints}
            {formatTotalEuros(f.totalAlimentation)}
          </Text>
          {champTauxTva}
        </>
      ) : f.estMarchandises ? (
        <>
          <LignesMarchandisesEditor lignes={f.lignesMarchandises} onChange={f.setLignesMarchandises} />
          <Text style={styles.total}>
            {TEXTES.commun.general.totalFactureTtcDeuxPoints}
            {formatTotalEuros(f.totalMarchandises)}
          </Text>
          {champTauxTva}
        </>
      ) : f.estCarburant ? (
        <>
          <LignesCarburantEditor lignes={f.lignesCarburant} onChange={f.setLignesCarburant} />
          <Text style={styles.total}>
            {TEXTES.commun.general.totalFactureTtcDeuxPoints}
            {formatTotalEuros(f.totalCarburant)}
          </Text>
          {champTauxTva}
        </>
      ) : (
        <View style={commonStyles.row}>
          <View style={commonStyles.flex1}>
            <FormField
              label={TEXTES.comptabilite.ficheFacture.montant}
              value={f.montantTexte}
              onChangeText={f.changerMontant}
              keyboardType="decimal-pad"
              placeholder="0,00"
            />
          </View>
          <View style={commonStyles.flex1}>{champTauxTva}</View>
        </View>
      )}

      {(form.categorieDepense === CATEGORIE_DEPENSE.PRODUCTION ||
        form.categorieDepense === CATEGORIE_DEPENSE.AUTRE) && (
        <ChampStockProduction
          compte={form.categorieDepense === CATEGORIE_DEPENSE.AUTRE ? form.compteManuel : undefined}
          article={form.stockArticle ?? ''}
          quantite={form.stockQuantite}
          debut={form.bouclesDebut}
          onChangeDebut={(debut) => f.setForm({ ...form, bouclesDebut: debut || undefined })}
          onChange={(article, quantite) =>
            f.setForm({
              ...form,
              stockArticle: article || undefined,
              stockQuantite: article ? quantite : undefined,
              bouclesDebut: estArticleBoucle(article) ? form.bouclesDebut : undefined,
            })
          }
        />
      )}

      <View style={commonStyles.row}>
        <Button
          style={commonStyles.flex1}
          variant="secondary"
          label={TEXTES.commun.general.annuler}
          onPress={f.annulerModifications}
        />
        <Button
          style={commonStyles.flex1}
          label={TEXTES.commun.general.enregistrer}
          onPress={f.enregistrerModifications}
        />
      </View>
    </Card>
  );
}
