import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';

/**
 * Une petite tuile « Rappels » : le nombre à valider (en rouge quand il y en a), et un appui ouvre la page des rappels. Remplace la longue liste de rappels
 * sur l'accueil et sur la page Chèvres.
 */
export function TuileRappels({ nombre }: { nombre: number }) {
  const router = useRouter();
  const alerte = nombre > 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={alerte ? `Rappels : ${nombre} à valider` : 'Rappels'}
      onPress={() => router.push(ROUTES.RAPPELS as never)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 }}
    >
      <Ionicons name="notifications-outline" size={24} color={alerte ? colors.danger : colors.primary} />
      <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: colors.text }}>Rappels</Text>
      {alerte ? (
        <View style={{ minWidth: 26, height: 26, borderRadius: 13, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
          <Text style={{ color: colors.blanc, fontWeight: '800', fontSize: 13 }}>{nombre}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}
