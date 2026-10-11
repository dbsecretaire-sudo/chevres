import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiltresBoucles, TableauBoucles } from '@/features/stock/components/TableauBoucles';
import type { ListeBoucles } from '@/features/stock/hooks/useListeBoucles';
import { libelleDeLaSorte } from '@/features/stock/services/boucles';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  /** La liste à montrer (celle d'une sorte de boucles), avec son état et son tri. */
  liste: ListeBoucles;
  visible: boolean;
  onFermer: () => void;
}

/** Une liste de boucles en pleine page : son titre, ses filtres et tout le tableau, sans la hauteur limitée de la section. */
export function ListeBouclesPleinePage({ liste, visible, onFermer }: Props) {
  const T = TEXTES.stock.boucles;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onFermer}>
      <SafeAreaView style={commonStyles.screenBg} edges={['top', 'bottom']}>
        <View style={commonStyles.fenetre}>
          <View style={commonStyles.rowSpaceBetween}>
            <Text style={commonStyles.heading}>{libelleDeLaSorte(liste.article)}</Text>
            <Pressable onPress={onFermer} hitSlop={8} accessibilityLabel={T.reduire}>
              <Ionicons name="close" size={28} color={colors.text} />
            </Pressable>
          </View>
          <FiltresBoucles liste={liste} />
          <ScrollView style={commonStyles.flex1}>
            <TableauBoucles liste={liste} pleinePage />
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
