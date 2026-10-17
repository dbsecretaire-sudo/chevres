import { View } from 'react-native';
import { SectionForm } from '@/shared/components/SectionForm';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { useMeresPossibles } from '@/features/cheptel/hooks/useMeresPossibles';
import { BoucleField } from '@/features/cheptel/components/BoucleField';
import { ChampPoids } from '@/features/cheptel/components/ChampPoids';
import { OPTIONS_SEXE } from '@/features/cheptel/utils/optionsSexe';
import type { Chevre } from '@/features/cheptel/types';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  chevre: Chevre;
  form: Chevre;
  onChange: (form: Chevre) => void;
}

/** Formulaire de modification d'une chèvre. */
export function ChevreFormulaire({ chevre, form, onChange }: Props) {
  const meres = useMeresPossibles(form.dateNaissance, form.mereNumeroBoucle);
  return (
    <View style={commonStyles.gap10}>
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
      <SectionForm>
        <ChampPoids value={form.poidsKg} onChange={(poidsKg) => onChange({ ...form, poidsKg })} />
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
    </View>
  );
}
