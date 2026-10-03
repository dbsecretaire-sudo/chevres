import { useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { OptionsModal, type Option } from '@/shared/components/OptionsModal';
import { styles } from '@/shared/styles/components/Fab.styles';

interface Props {
  options: Option[];
  /** Couleur du bouton — vert (ajout) par défaut. */
  color?: string;
  /** Icône du bouton — "+" par défaut. */
  icon?: Option['icon'];
}

/**
 * Bouton flottant en bas à gauche (vert "+" par défaut, pour l'ajout). Avec une seule
 * option, l'appui déclenche directement l'action ; avec plusieurs, il ouvre un petit
 * menu de choix. Personnalisable (couleur/icône) pour d'autres actions groupées, ex:
 * un "-" rouge pour déclarer un statut (morte/abattoir/vendue).
 */
export function Fab({ options, color = colors.primary, icon = 'add' }: Props) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Pressable
        style={[styles.fab, { backgroundColor: color }]}
        onPress={() => (options.length === 1 ? options[0].onPress() : setOuvert(true))}
      >
        <Ionicons name={icon} size={30} color="#fff" />
      </Pressable>
      <OptionsModal visible={ouvert} onClose={() => setOuvert(false)} options={options} />
    </>
  );
}
