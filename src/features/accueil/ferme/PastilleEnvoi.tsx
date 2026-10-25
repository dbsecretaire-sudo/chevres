import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSynchronisation } from '@/features/sync/useSynchronisation';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/**
 * La pastille « Envoyer » de la capsule : le nombre de modifications qui attendent (en rouge), et l'envoi. Sans connexion, l'appui ouvre la
 * synchronisation pour se connecter.
 */
export function PastilleEnvoi() {
  const router = useRouter();
  const sync = useSynchronisation();
  const envoyer = async () => {
    if (sync.occupe) return;
    if (!sync.connexion) return router.push(ROUTES.GOOGLE_DRIVE as never);
    await sync.envoyer();
  };
  return (
    <Pressable
      onPress={envoyer}
      accessibilityRole="button"
      accessibilityLabel={TEXTES.roles.berger.envoyer}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: colors.blanc, borderWidth: 2, borderColor: colors.primary, paddingHorizontal: 12, minHeight: 40, justifyContent: 'center' }}
    >
      <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
      {sync.enAttente > 0 ? (
        <View style={{ minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
          <Text style={{ color: colors.blanc, fontWeight: '800', fontSize: 12 }}>{sync.enAttente}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
