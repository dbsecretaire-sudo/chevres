import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROLE } from '@/shared/constants/roles';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { useRole } from '@/features/roles/context/RoleContext';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.roles.choix;

/**
 * « Quel mode ? », demandé une fois l'établissement choisi (le mode vaut pour cet établissement : en changer redemande le mode) — le mode normal (ses saisies simples) d'abord,
 * puis le mode avancé (toute l'application). Un lien ramène au choix de l'établissement.
 */
export function ChoixDuRole() {
  const { choisir } = useRole();
  const { actif, ouvrirSelecteur } = useEtablissement();
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.contenu}>
        <Text style={styles.detail}>{actif.nom}</Text>
        <Text style={styles.titre}>{T.titre}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => choisir(ROLE.BERGER)}
          style={({ pressed }) => [styles.grosBouton, pressed ? styles.grosBoutonAppuye : null]}
        >
          <Ionicons name="paw" size={52} color={colors.blanc} />
          <Text style={styles.grosTexte}>{T.berger}</Text>
          <Text style={styles.aide}>{T.bergerAide}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => choisir(ROLE.SECRETAIRE)}
          style={({ pressed }) => [styles.grosBouton, styles.grosBoutonClair, pressed ? styles.grosBoutonAppuye : null]}
        >
          <Ionicons name="briefcase" size={52} color={colors.primary} />
          <Text style={[styles.grosTexte, styles.grosTexteClair]}>{T.secretaire}</Text>
          <Text style={[styles.aide, styles.aideClaire]}>{T.secretaireAide}</Text>
        </Pressable>
        <Pressable style={styles.discret} onPress={ouvrirSelecteur} accessibilityRole="link">
          <Text style={styles.discretTexte}>{T.changerEtablissement}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
