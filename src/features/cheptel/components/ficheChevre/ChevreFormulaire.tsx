import { View } from 'react-native';
import { SectionForm } from '@/shared/components/SectionForm';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { BoucleField } from '@/features/cheptel/components/BoucleField';
import { ChampPoids } from '@/features/cheptel/components/ChampPoids';
import { OPTIONS_SEXE } from '@/features/cheptel/utils/optionsSexe';
import type { Chevre } from '@/features/cheptel/types';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/cheptel/ChevreFormulaire.styles';
import { TEXTES } from '@/shared/textes';

interface Props {
  chevre: Chevre;
  form: Chevre;
  onChange: (form: Chevre) => void;
}

/** Formulaire de modification d'une chèvre. */
export function ChevreFormulaire({ chevre, form, onChange }: Props) {
  return (
    <View style={commonStyles.gap10}>
      {/* L'identité : le poids, le sexe et la naissance, sur une même ligne (à la ligne sur téléphone). */}
      <SectionForm titre={TEXTES.commun.formulaire.identite}>
        <View style={styles.ligne}>
          <View style={styles.champ}>
            <ChampPoids value={form.poidsKg} onChange={(poidsKg) => onChange({ ...form, poidsKg })} sansAide />
          </View>
          <View style={styles.champ}>
            <SelectField
              label={TEXTES.commun.general.sexe}
              required
              value={form.sexe}
              onChange={(v) => onChange({ ...form, sexe: v })}
              options={OPTIONS_SEXE}
            />
          </View>
          <View style={styles.champ}>
            <DateField
              label={TEXTES.commun.general.dateDeNaissance}
              required
              value={form.dateNaissance}
              onChange={(v) => onChange({ ...form, dateNaissance: v })}
            />
          </View>
        </View>
      </SectionForm>
      {/* Le bouclage : le numéro, puis les dates de pose (boucle, boucle rouge de remplacement provisoire, rebouclage) sur une même ligne. */}
      <SectionForm titre={TEXTES.commun.formulaire.bouclage}>
        <BoucleField
          label={TEXTES.commun.general.nDeBoucle}
          value={form.numeroBoucle ?? ''}
          onChangeText={(v) => onChange({ ...form, numeroBoucle: v || undefined })}
          placeholder={TEXTES.commun.general.facultatifAvantAgeMax}
        />
        <View style={styles.ligne}>
          {!!form.numeroBoucle?.trim() && (
            <View style={styles.champ}>
              <DateField
                label={TEXTES.commun.general.dateDeBouclage}
                value={form.dateBouclage ?? ''}
                onChange={(v) => onChange({ ...form, dateBouclage: v || undefined })}
              />
            </View>
          )}
          <View style={styles.champ}>
            <DateField
              label={TEXTES.cheptel.ficheChevre.dateBoucleRougeCourt}
              value={form.dateBoucleRouge ?? ''}
              onChange={(v) => onChange({ ...form, dateBoucleRouge: v || undefined })}
            />
          </View>
          <View style={styles.champ}>
            <DateField
              label={TEXTES.cheptel.ficheChevre.dateRebouclageCourt}
              value={form.dateRebouclage ?? ''}
              onChange={(v) => onChange({ ...form, dateRebouclage: v || undefined })}
            />
          </View>
        </View>
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
