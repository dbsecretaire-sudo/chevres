import { Text, View } from 'react-native';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** La progression d'une saisie en plusieurs étapes : un trait par étape, en couleur jusqu'à l'étape en cours. */
export function BarreEtapes({ etape, total }: { etape: number; total: number }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.etapeSur(etape, total)}</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: total }, (_, rang) => (
          <View
            key={rang}
            style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: rang < etape ? colors.primary : colors.border }}
          />
        ))}
      </View>
    </View>
  );
}
