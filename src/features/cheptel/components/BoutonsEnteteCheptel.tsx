import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BoutonBilanCheptel } from '@/features/cheptel/components/BoutonBilanCheptel';
import { FenetreSuiviMouvements } from '@/features/cheptel/components/FenetreSuiviMouvements';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { especeDuSuivi } from '@/features/export/suiviMouvementsPdf';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/**
 * Les boutons de l'en-tête de la liste du cheptel : le document de suivi des mouvements (brebis et chèvres seulement) et le bilan
 * annuel.
 */
export function BoutonsEnteteCheptel() {
  const { espece } = useEtablissement();
  const [ouvert, setOuvert] = useState(false);
  return (
    <View style={commonStyles.row}>
      {especeDuSuivi(espece) ? (
        <Pressable
          style={commonStyles.boutonEnteteDroite}
          onPress={() => setOuvert(true)}
          hitSlop={10}
          accessibilityLabel={TEXTES.cheptel.suiviMouvements.bouton}
        >
          <Ionicons name="document-text" size={24} color={colors.blanc} />
        </Pressable>
      ) : null}
      <BoutonBilanCheptel />
      <FenetreSuiviMouvements visible={ouvert} onClose={() => setOuvert(false)} />
    </View>
  );
}
