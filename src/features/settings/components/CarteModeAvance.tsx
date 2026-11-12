import { Switch, Text, View } from 'react-native';
import { useRole } from '@/features/roles/context/RoleContext';
import { ROLE } from '@/shared/constants/roles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/**
 * Le mode avancé, en interrupteur : tout l'application (la navigation complète) ou le mode normal. Éteint, on passe au mode normal.
 */
export function CarteModeAvance() {
  const { role, choisir } = useRole();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{TEXTES.roles.choix.secretaire}</Text>
        <Text style={{ color: colors.textMuted }}>{TEXTES.roles.choix.secretaireAide}</Text>
      </View>
      <Switch
        value={role === ROLE.SECRETAIRE}
        onValueChange={(avance) => choisir(avance ? ROLE.SECRETAIRE : ROLE.BERGER)}
        trackColor={{ true: colors.primary }}
      />
    </View>
  );
}
