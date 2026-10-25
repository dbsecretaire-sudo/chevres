import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/** Combien de chiffres au plus (un numéro de boucle en a au plus une quinzaine). */
const LONGUEUR_MAX = 15;

const RANGEES = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

/**
 * Un clavier de gros chiffres pour taper un numéro avec des gants : 1 2 3, 4 5 6, 7 8 9, puis « tout supprimer », 0 et « retour en arrière ». Le numéro s'affiche dessous, centré,
 * et ne se modifie qu'avec ces touches (pas de clavier du téléphone).
 */
export function ClavierNumerique({
  valeur,
  onChange,
  lettres,
}: {
  valeur: string;
  onChange: (valeur: string) => void;
  /** Des lettres en plus des chiffres (le numéro d'un lot en a) : une touche chacune, au-dessus des chiffres. */
  lettres?: readonly string[];
}) {
  const T = TEXTES.roles.berger;
  const ajouter = (chiffre: string) => valeur.length < LONGUEUR_MAX && onChange(valeur + chiffre);
  const touche = (chiffre: string) => (
    <Pressable
      key={chiffre}
      accessibilityRole="button"
      accessibilityLabel={chiffre}
      onPress={() => ajouter(chiffre)}
      style={({ pressed }) => [styles.petitChoix, pressed ? styles.grosBoutonAppuye : null]}
    >
      <Text style={styles.petitChoixTexte}>{chiffre}</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 10, alignItems: 'center' }}>
      {lettres && lettres.length > 0 ? (
        <View style={styles.lettresRangee}>
          {lettres.map((lettre) => (
            <Pressable
              key={lettre}
              accessibilityRole="button"
              accessibilityLabel={lettre}
              onPress={() => ajouter(lettre)}
              style={({ pressed }) => [styles.lettreChoix, pressed ? styles.grosBoutonAppuye : null]}
            >
              <Text style={styles.lettreChoixTexte}>{lettre}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {RANGEES.map((rangee) => (
        <View key={rangee.join('')} style={styles.petitsRangee}>
          {rangee.map(touche)}
        </View>
      ))}
      <View style={styles.petitsRangee}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.toutSupprimer}
          onPress={() => onChange('')}
          style={({ pressed }) => [styles.petitChoix, pressed ? styles.grosBoutonAppuye : null]}
        >
          <Ionicons name="close" size={36} color={colors.primary} />
        </Pressable>
        {touche('0')}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.retourEnArriere}
          onPress={() => onChange(valeur.slice(0, -1))}
          style={({ pressed }) => [styles.petitChoix, pressed ? styles.grosBoutonAppuye : null]}
        >
          <Ionicons name="chevron-back" size={36} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}
