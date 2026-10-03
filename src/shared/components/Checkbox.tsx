import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { useAccentColor } from '@/shared/theme/AccentColorContext';
import { styles } from '@/shared/styles/components/Checkbox.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

interface Props {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  activeColor?: string;
}

export function Checkbox({ label, value, onChange, activeColor }: Props) {
  const accent = useAccentColor();
  const couleurActive = activeColor ?? accent;
  return (
    <Pressable style={styles.rowCheckbox} onPress={() => onChange(!value)}>
      <Ionicons
        name={value ? 'checkbox' : 'square-outline'}
        size={22}
        color={value ? couleurActive : colors.textMuted}
      />
      <Text style={commonStyles.lineSemiBold}>{label}</Text>
    </Pressable>
  );
}
