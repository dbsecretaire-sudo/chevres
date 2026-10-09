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
        variant === 'secondary' && [styles.secondaire, { backgroundColor: accentSoft, borderColor: accent }],
        variant === 'danger' && styles.danger,
        style,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressedLight,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.blanc : variant === 'danger' ? colors.danger : accent}
        />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'secondary' && { color: accent },
            variant === 'danger' && styles.texteDanger,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
