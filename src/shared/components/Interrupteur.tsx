import { Pressable, Switch, Text, View } from 'react-native';
import { colors } from '@/shared/theme/colors';
import { useAccentColor } from '@/shared/theme/AccentColorContext';
import { commonStyles } from '@/shared/styles/commonStyles';

interface Props {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  /** Une précision sous le libellé, dans la carte (ce que le choix change). */
  note?: string;
}

/** Un choix oui ou non, en carte : le libellé à gauche, l'interrupteur à droite. */
export function Interrupteur({ label, value, onChange, note }: Props) {
  const accent = useAccentColor();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 12,
        backgroundColor: colors.surface,
        gap: 4,
      }}
    >
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        onPress={() => onChange(!value)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        <Text style={[commonStyles.lineSemiBold, { flex: 1 }]}>{label}</Text>
        <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.border, true: accent }} />
      </Pressable>
      {note ? <Text style={commonStyles.note}>{note}</Text> : null}
    </View>
  );
}
