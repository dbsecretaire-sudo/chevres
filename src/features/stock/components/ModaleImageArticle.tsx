import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { ChampImageArticle } from '@/features/stock/components/ChampImageArticle';
import { definirImageArticle, type ChoixImage } from '@/features/stock/services/imagesArticles';
import { Button } from '@/shared/components/Button';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Une petite fenêtre pour changer l'image d'une carte du stock (là où le nom ne se modifie pas : la grange, les lots de fromages). */
export function ModaleImageArticle({
  article,
  onFermer,
}: {
  article: { cle: string; titre: string; emoji: string } | null;
  onFermer: () => void;
}) {
  const [choix, setChoix] = useState<ChoixImage | null>(null);
  const fermer = () => {
    setChoix(null);
    onFermer();
  };
  return (
    <Modal visible={!!article} transparent animationType="fade" onRequestClose={fermer}>
      <Pressable style={commonStyles.backdrop} onPress={fermer}>
        <Pressable style={[commonStyles.modalSheet, { maxHeight: '92%' }]} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{article?.titre}</Text>
          <ScrollView style={{ flexShrink: 1 }}>
            {article ? (
              <ChampImageArticle cle={article.cle} emoji={article.emoji} choix={choix} onChoix={setChoix} />
            ) : null}
          </ScrollView>
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={fermer}
            />
            <Button
              style={commonStyles.flex1}
              label={TEXTES.commun.general.enregistrer}
              onPress={async () => {
                if (article && choix) await definirImageArticle(article.cle, choix);
                fermer();
              }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
