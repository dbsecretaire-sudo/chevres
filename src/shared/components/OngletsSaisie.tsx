import { Pressable, Text, View } from 'react-native';
import { colors } from '@/shared/theme/colors';

export interface OngletSaisie<T extends string> {
  value: T;
  label: string;
}

/** Les onglets d'une saisie en plusieurs volets (Général, Détails, Coût) : celui qui est ouvert est sur fond clair. */
export function OngletsSaisie<T extends string>({
  onglets,
  valeur,
  onChange,
}: {
  onglets: OngletSaisie<T>[];
  valeur: T;
  onChange: (valeur: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.badgeBg, borderRadius: 10, padding: 3, marginBottom: 10 }}>
      {onglets.map((onglet) => {
        const actif = onglet.value === valeur;
        return (
          <Pressable
            key={onglet.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: actif }}
            onPress={() => onChange(onglet.value)}
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: 'center',
              borderRadius: 8,
              backgroundColor: actif ? colors.surface : 'transparent',
            }}
          >
            <Text style={{ fontWeight: actif ? '700' : '500', color: colors.text }}>{onglet.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
