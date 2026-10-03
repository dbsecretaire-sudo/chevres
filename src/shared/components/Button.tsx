import { ActivityIndicator, Pressable, Text, type ViewStyle } from 'react-native';

import { useAccentColor, useAccentSoftColor } from '@/shared/theme/AccentColorContext';
import { styles } from '@/shared/styles/components/Button.styles';
import { colors } from '@/shared/theme/colors';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const accent = useAccentColor();
  const accentSoft = useAccentSoftColor();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && { backgroundColor: accent },
        variant === 'secondary' && { backgroundColor: accentSoft },
        variant === 'danger' && styles.danger,
        style,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressedLight,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? accent : colors.blanc} />
      ) : (
        <Text style={[styles.text, variant === 'secondary' && { color: accent }]}>{label}</Text>
      )}
    </Pressable>
  );
}
