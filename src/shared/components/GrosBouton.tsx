import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '@/shared/styles/roles/Roles.styles';

/** Un très grand bouton : l'icône, le mot, rien d'autre. `clair` : un bouton moins haut et sans fond, pour ce qui n'est pas une saisie (Envoyer). */
export function GrosBouton({
  libelle,
  onPress,
  icone,
  clair = false,
  detail,
  compact = false,
}: {
  libelle: string;
  onPress: () => void;
  icone?: ReactNode;
  clair?: boolean;
  /** Une étiquette rouge sur le coin en haut à droite du bouton (« 3 à envoyer »). */
  detail?: string;
  /** Un bouton moins haut (Oui / Non sous un clavier). */
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.grosBouton,
        styles.moitie,
        clair ? [styles.grosBoutonClair, styles.grosBoutonBas] : null,
        compact ? styles.grosBoutonCompact : null,
        pressed ? styles.grosBoutonAppuye : null,
      ]}
    >
      {icone}
      <Text style={[styles.grosTexte, styles.grosTexteMoitie, clair ? styles.grosTexteClair : null, compact ? styles.grosTexteCompact : null]}>{libelle}</Text>
      {detail ? (
        <View style={styles.grosEtiquette}>
          <Text style={styles.grosEtiquetteTexte}>{detail}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
