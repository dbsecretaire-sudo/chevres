import { Text, View } from 'react-native';
import { styles } from '@/shared/styles/components/LigneInfo.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Une information en lecture : son nom en petit, sa valeur dessous (« Non renseigné » si vide). */
export function LigneInfo({ label, valeur }: { label: string; valeur?: string }) {
  return (
    <View style={styles.ligne}>
      <Text style={commonStyles.labelMuted}>{label}</Text>
      {valeur ? (
        <Text style={commonStyles.line}>{valeur}</Text>
      ) : (
        <Text style={commonStyles.mutedItalic}>{TEXTES.commun.general.nonRenseigne}</Text>
      )}
    </View>
  );
}
