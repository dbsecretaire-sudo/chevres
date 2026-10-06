import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SelectModal, type SelectOption } from '@/shared/components/SelectModal';
import { useAccentColor } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/etablissements/SelecteurEspece.styles';

interface Props<T extends string> {
  /** Titre de la liste qui s'ouvre. */
  titre: string;
  valeur: T;
  options: SelectOption<T>[];
  onChoisir: (valeur: T) => void;
}

/**
 * Un choix (une année, un animal…) présenté comme une seule puce, celle de la valeur choisie : un appui ouvre la liste des
 * autres valeurs. Elle suit la couleur d'accent de l'écran (bleue dans un ajout).
 */
export function ChoixDeroulant<T extends string>({ titre, valeur, options, onChoisir }: Props<T>) {
  const accent = useAccentColor();
  const [ouvert, setOuvert] = useState(false);
  const courant = options.find((o) => o.value === valeur);

  return (
    <>
      <Pressable
        style={[styles.puce, styles.puceListe, { backgroundColor: accent, borderColor: accent }]}
        onPress={() => setOuvert(true)}
      >
        <Text style={[styles.texte, { color: colors.blanc }]}>
          {courant?.shortLabel ?? courant?.label ?? ''}
        </Text>
        <Ionicons name="pencil" size={14} color={colors.blanc} />
      </Pressable>
      <SelectModal
        visible={ouvert}
        titre={titre}
        value={valeur}
        options={options}
        onSelect={onChoisir}
        onClose={() => setOuvert(false)}
      />
    </>
  );
}
