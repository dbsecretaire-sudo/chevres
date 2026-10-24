import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import { styles } from '@/shared/styles/roles/Roles.styles';

/** Un très grand bouton : l'icône, le mot, rien d'autre. `clair` : un bouton moins haut et sans fond, pour ce qui n'est pas une saisie (Envoyer). */
export function GrosBouton({
  libelle,
  onPress,
  icone,
  clair = false,
}: {
  libelle: string;
  onPress: () => void;
  icone?: ReactNode;
  clair?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.grosBouton,
        clair ? [styles.grosBoutonClair, styles.grosBoutonBas] : null,
        pressed ? styles.grosBoutonAppuye : null,
      ]}
    >
      {icone}
      <Text style={[styles.grosTexte, clair ? styles.grosTexteClair : null]}>{libelle}</Text>
    </Pressable>
  );
}
