import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  /** La ligne est offerte (d'office quand la vente l'est) : un appui l'offre ou la facture. */
  actif: boolean;
  onChange: (actif: boolean) => void;
  /** Ce que la ligne offerte désigne, pour les lecteurs d'écran (« les animaux », « les frais d'abattoir »). */
  ligne: string;
}

/** Le bouton « Cadeau » en face d'une ligne d'une vente offerte : actif, la ligne est offerte ; désactivé, elle est facturée. */
export function BoutonCadeau({ actif, onChange, ligne }: Props) {
  return (
    <Pressable
      onPress={() => onChange(!actif)}
      accessibilityRole="switch"
      accessibilityState={{ checked: actif }}
      accessibilityLabel={`${TEXTES.comptabilite.nouvelleEcriture.cadeau} : ${ligne}`}
      style={[
        commonStyles.row,
        {
          alignSelf: 'flex-start',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: actif ? colors.primary : colors.border,
          backgroundColor: actif ? colors.primary : colors.surface,
        },
      ]}
    >
      <Ionicons name={actif ? 'gift' : 'gift-outline'} size={18} color={actif ? colors.blanc : colors.textMuted} />
      <Text style={{ fontWeight: '700', color: actif ? colors.blanc : colors.textMuted }}>
        {actif ? TEXTES.comptabilite.nouvelleEcriture.cadeauOffert : TEXTES.comptabilite.nouvelleEcriture.cadeauFacture}
      </Text>
    </Pressable>
  );
}
