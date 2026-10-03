import { View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { BoucleField } from '@/features/cheptel/components/BoucleField';
import { categorieAnimal } from '@/features/cheptel/utils/chevreLabel';
import { OPTIONS_SEXE } from '@/features/cheptel/utils/optionsSexe';
import type { Chevre } from '@/features/cheptel/types';
import { currentYear } from '@/shared/utils/dates';
import { CATEGORIE_ANIMAL, SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  chevre: Chevre;
  form: Chevre;
  onChange: (form: Chevre) => void;
  onAnnuler: () => void;
  onEnregistrer: () => void;
  /** Enregistre la fiche puis ouvre la déclaration d'une naissance pour cette mère. */
  onAjouterCabri: () => void;
}

/** Formulaire de modification d'une chèvre. */
export function ChevreFormulaire({
  chevre,
  form,
  onChange,
  onAnnuler,
  onEnregistrer,
  onAjouterCabri,
}: Props) {
  const peutAvoirDesCabris =
    chevre.sexe === SEXE.FEMELLE &&
    chevre.statut === STATUT_CHEVRE.VIVANTE &&
    categorieAnimal(chevre) === CATEGORIE_ANIMAL.CHEVRE;

  return (
    <Card>
      <Checkbox
        label={TEXTES.commun.general.designeEPourLeRenouvellement}
        value={!!form.renouvellement}
        onChange={(v) =>
          onChange({
            ...form,
            renouvellement: v,
            renouvellementAnnee: v ? (form.renouvellementAnnee ?? currentYear()) : undefined,
          })
        }
      />
      {form.renouvellement && (
        <FormField
          label={TEXTES.commun.general.anneeDeDesignation}
          value={form.renouvellementAnnee !== undefined ? String(form.renouvellementAnnee) : ''}
          onChangeText={(v) => onChange({ ...form, renouvellementAnnee: Number(v) || undefined })}
          keyboardType="number-pad"
          placeholder={String(currentYear())}
        />
      )}
      {peutAvoirDesCabris && (
        <Button
          label={TEXTES.cheptel.ficheChevre.ajouterUnCabriNouvelleNaissance}
          variant="secondary"
          onPress={onAjouterCabri}
        />
      )}
      <BoucleField
        label={TEXTES.commun.general.nDeBoucle}
        value={form.numeroBoucle ?? ''}
        onChangeText={(v) => onChange({ ...form, numeroBoucle: v || undefined })}
        placeholder={TEXTES.commun.general.facultatifAvantAgeMax}
      />
      {!!form.numeroBoucle?.trim() && (
        <DateField
          label={TEXTES.commun.general.dateDeBouclage}
          value={form.dateBouclage ?? ''}
          onChange={(v) => onChange({ ...form, dateBouclage: v || undefined })}
        />
      )}
      <FormField
        label={TEXTES.commun.general.nom}
        value={form.nom ?? ''}
        onChangeText={(v) => onChange({ ...form, nom: v })}
      />
      <SelectField
        label={TEXTES.commun.general.sexe}
        required
        value={form.sexe}
        onChange={(v) => onChange({ ...form, sexe: v })}
        options={OPTIONS_SEXE}
      />
      <DateField
        label={TEXTES.commun.general.dateDeNaissance}
        required
        value={form.dateNaissance}
        onChange={(v) => onChange({ ...form, dateNaissance: v })}
      />
      <BoucleField
        label={TEXTES.commun.general.nDeBoucleDeLa}
        value={form.mereNumeroBoucle ?? ''}
        onChangeText={(v) => onChange({ ...form, mereNumeroBoucle: v })}
      />
      <FormField
        label={TEXTES.commun.general.notes}
        value={form.notes ?? ''}
        onChangeText={(v) => onChange({ ...form, notes: v })}
        multiline
        style={commonStyles.textarea}
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
