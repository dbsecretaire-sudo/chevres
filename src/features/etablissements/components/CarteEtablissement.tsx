import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import type { Etablissement } from '@/features/etablissements/repository';
import { libelleTypesEtablissement } from '@/features/etablissements/utils/typesEtablissement';
import { styles } from '@/shared/styles/etablissements/SelecteurEtablissement.styles';
import { TEXTES } from '@/shared/textes';

interface Props {
  etablissement: Etablissement;
  /** Dernier établissement utilisé. */
  actif: boolean;
  onChoisir: () => void;
  onModifier: () => void;
}

/**
 * Carte d'un établissement. Toucher la carte l'ouvre ; le bouton crayon (en haut à droite, sur sa propre ligne
 * pour ne jamais gêner le nom) permet de le modifier. Puis : nom, « Dernier utilisé », type.
 */
export function CarteEtablissement({ etablissement, actif, onChoisir, onModifier }: Props) {
  const types = libelleTypesEtablissement(etablissement);

  return (
    <Pressable style={[styles.carte, actif && styles.carteActive]} onPress={onChoisir}>
      <View style={styles.carteBarre}>
        <Pressable
          style={styles.carteCrayon}
          hitSlop={6}
          onPress={onModifier}
          accessibilityLabel={TEXTES.etablissements.selecteurEtablissement.modifier}
        >
          <Ionicons name="pencil" size={16} color={colors.blanc} />
        </Pressable>
      </View>
      <Text style={styles.carteNom} numberOfLines={3}>
        {etablissement.nom}
      </Text>
      {actif && (
        <Text style={styles.carteSousTitre}>
          {TEXTES.etablissements.selecteurEtablissement.dernierUtilise}
        </Text>
      )}
      <Text style={types ? styles.carteType : styles.carteSousTitre}>
        {types || TEXTES.etablissements.selecteurEtablissement.typeNonRenseigne}
      </Text>
    </Pressable>
  );
}
