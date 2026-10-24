import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROLE } from '@/shared/constants/roles';
import { useRole } from '@/features/roles/context/RoleContext';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.roles.choix;

/** Le premier écran du téléphone : « Qui êtes-vous ? » — la secrétaire entre dans toute l'application, le berger dans ses saisies simples. */
export function ChoixDuRole() {
  const { choisir } = useRole();
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.contenu}>
        <Text style={styles.titre}>{T.titre}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => choisir(ROLE.SECRETAIRE)}
          style={({ pressed }) => [styles.grosBouton, pressed ? styles.grosBoutonAppuye : null]}
        >
          <Ionicons name="briefcase" size={52} color={colors.blanc} />
          <Text style={styles.grosTexte}>{T.secretaire}</Text>
          <Text style={styles.aide}>{T.secretaireAide}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => choisir(ROLE.BERGER)}
          style={({ pressed }) => [styles.grosBouton, styles.grosBoutonClair, pressed ? styles.grosBoutonAppuye : null]}
        >
          <Ionicons name="paw" size={52} color={colors.primary} />
          <Text style={[styles.grosTexte, styles.grosTexteClair]}>{T.berger}</Text>
          <Text style={[styles.aide, styles.aideClaire]}>{T.bergerAide}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
