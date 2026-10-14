import { View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { SectionForm } from '@/shared/components/SectionForm';
import { Checkbox } from '@/shared/components/Checkbox';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { useMeresPossibles } from '@/features/cheptel/hooks/useMeresPossibles';
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
  onEnregistrer: () => void;
  /** Enregistre la fiche puis ouvre la déclaration d'une naissance pour cette mère. */
  onAjouterCabri: () => void;
}

/** Formulaire de modification d'une chèvre. */
export function ChevreFormulaire({ chevre, form, onChange, onEnregistrer, onAjouterCabri }: Props) {
  const meres = useMeresPossibles(form.dateNaissance, form.mereNumeroBoucle);
  const peutAvoirDesCabris =
    chevre.sexe === SEXE.FEMELLE &&
    chevre.statut === STATUT_CHEVRE.VIVANTE &&
    categorieAnimal(chevre) === CATEGORIE_ANIMAL.CHEVRE;

  return (
    <View style={commonStyles.gap10}>
      <SectionForm titre={TEXTES.commun.formulaire.suivi}>
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
      </SectionForm>
      <SectionForm titre={TEXTES.commun.formulaire.identite}>
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
        <View style={commonStyles.row}>
          <View style={commonStyles.flex1}>
            <SelectField
              label={TEXTES.commun.general.sexe}
              required
              value={form.sexe}
              onChange={(v) => onChange({ ...form, sexe: v })}
              options={OPTIONS_SEXE}
            />
          </View>
          <View style={commonStyles.flex1}>
            <DateField
              label={TEXTES.commun.general.dateDeNaissance}
              required
              value={form.dateNaissance}
              onChange={(v) => onChange({ ...form, dateNaissance: v })}
            />
          </View>
        </View>
      </SectionForm>
      {/* La boucle rouge (remplacement provisoire) et la boucle de rebouclage : seulement leur date de pose, elles n'ont pas de numéro. */}
      <SectionForm>
        <DateField
          label={TEXTES.cheptel.ficheChevre.dateBouclageRouge}
          value={form.dateBoucleRouge ?? ''}
          onChange={(v) => onChange({ ...form, dateBoucleRouge: v || undefined })}
        />
        <DateField
          label={TEXTES.cheptel.ficheChevre.dateRebouclage}
          value={form.dateRebouclage ?? ''}
          onChange={(v) => onChange({ ...form, dateRebouclage: v || undefined })}
        />
      </SectionForm>
      <SectionForm titre={TEXTES.commun.formulaire.filiation}>
        <SelectField
          label={TEXTES.commun.general.nDeBoucleDeLa}
          searchable
          value={form.mereNumeroBoucle ?? ''}
          onChange={(v) => onChange({ ...form, mereNumeroBoucle: v })}
          options={[{ value: '', label: TEXTES.cheptel.nouvelleChevre.mereInconnue }, ...meres]}
          placeholder={TEXTES.commun.general.facultatif}
        />
      </SectionForm>
      <SectionForm>
        <FormField
          label={TEXTES.commun.general.notes}
          value={form.notes ?? ''}
          onChangeText={(v) => onChange({ ...form, notes: v })}
          multiline
          style={commonStyles.textarea}
        />
      </SectionForm>
      <Button label={TEXTES.commun.general.enregistrer} onPress={onEnregistrer} />
    </View>
  );
}
