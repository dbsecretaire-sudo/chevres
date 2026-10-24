import { ActivityIndicator, Pressable, Text, type ViewStyle } from 'react-native';

import { BadgeAlerte } from '@/shared/components/BadgeAlerte';
import { useAccentColor, useAccentSoftColor } from '@/shared/theme/AccentColorContext';
import { styles } from '@/shared/styles/components/Button.styles';
import { colors } from '@/shared/theme/colors';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  /** Un « ! » rouge sur le bouton : c'est ici qu'on fait ce qui est à faire. */
  badge?: boolean;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, style, badge }: Props) {
  const accent = useAccentColor();
  const accentSoft = useAccentSoftColor();
  const isDisabled = disabled || loading;
  // Le poste de comptabilité : des boutons compacts, de la taille de leur texte, pas de grandes barres.
  const comptable = useDispositionComptable();
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && { backgroundColor: accent },
        variant === 'secondary' && [styles.secondaire, { backgroundColor: accentSoft, borderColor: accent }],
        variant === 'danger' && styles.danger,
        comptable && styles.compact,
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
            comptable && styles.texteCompact,
            variant === 'secondary' && { color: accent },
            variant === 'danger' && styles.texteDanger,
          ]}
        >
          {label}
        </Text>
      )}
      {badge ? <BadgeAlerte style={{ position: 'absolute', right: 12, top: '50%', marginTop: -12 }} /> : null}
    </Pressable>
  );
}
