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
import { TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import { formatTotalEuros } from '@/shared/utils/nombres';
import { nomComplet } from '@/shared/utils/personne';
import { styles } from '@/shared/styles/comptabilite/FicheFacture.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

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
