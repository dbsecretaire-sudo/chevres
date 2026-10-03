import { Text, View } from 'react-native';
import { BoucleField } from '@/features/cheptel/components/BoucleField';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { DateField } from '@/shared/components/DateField';
import { SelectField } from '@/shared/components/SelectField';
import type { EtatNouvelleChevre } from '@/features/cheptel/hooks/useNouvelleChevre';
import { OPTIONS_SEXE } from '@/features/cheptel/utils/optionsSexe';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/cheptel/NouvelleChevre.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Mise bas de la chèvre en cours de création : date et un bloc par cabri. */
export function CabritsChevreForm({ e }: { e: EtatNouvelleChevre }) {
  return (
    <Card style={styles.cabritsCard}>
      <Text style={commonStyles.cardTitle}>{TEXTES.commun.general.cabris}</Text>
      <DateField
        label={TEXTES.commun.general.dateDeLaMiseBas}
        required
        value={e.dateMiseBas}
        onChange={e.setDateMiseBas}
      />
      {e.cabrits.map((cabrit, index) => (
        <Card key={cabrit.key} style={commonStyles.gap10}>
          <View style={commonStyles.rowSpaceBetween}>
            <Text style={commonStyles.lineBold}>
              {TEXTES.commun.general.cabriEspace}
              {index + 1}
            </Text>
            {e.cabrits.length > 1 && (
              <Button
                label={TEXTES.commun.general.retirer}
                variant="danger"
                onPress={() => e.supprimerCabrit(cabrit.key)}
              />
            )}
          </View>
          <BoucleField
            label={TEXTES.commun.general.nDeBoucle}
            value={cabrit.numeroBoucle}
            onChangeText={(v) => e.majCabrit(cabrit.key, { numeroBoucle: v })}
            placeholder={TEXTES.commun.general.facultatifAvant6Mois}
          />
          <SelectField
            label={TEXTES.commun.general.sexe}
            required
            value={cabrit.sexe}
            onChange={(v) => e.majCabrit(cabrit.key, { sexe: v })}
            options={OPTIONS_SEXE}
          />
          <Checkbox
            label={TEXTES.commun.general.mortNe}
            value={cabrit.mortNe}
            onChange={(v) => e.majCabrit(cabrit.key, { mortNe: v })}
            activeColor={colors.danger}
          />
        </Card>
      ))}
      <Button label={TEXTES.commun.general.ajouterUnCabri} variant="secondary" onPress={e.ajouterCabrit} />
    </Card>
  );
}
