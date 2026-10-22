import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { lireArchiveStock } from '@/features/stock/repository';
import { libelleOrigineMouvement } from '@/features/stock/services/stock';
import type { MouvementStock } from '@/features/stock/types';
import { Button } from '@/shared/components/Button';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.stock.historiqueArticle;

/** Un nombre avec la virgule décimale. */
const nombreFR = (n: number): string => String(Math.round(n * 100) / 100).replace('.', ',');

/** L'historique d'un article de la grange : ses mouvements (achats, ventes, consommations…), du plus récent au plus ancien. */
export function HistoriqueArticleModal({
  article,
  onOuvrirLeStock,
  onAjuster,
  onFermer,
}: {
  article: { cle: string; titre: string; emoji: string; unite?: string } | null;
  /** Ouvre l'article dans l'inventaire (là où l'on saisit ses quantités) : absent dans l'inventaire même. */
  onOuvrirLeStock?: () => void;
  /** Ouvre la saisie de la quantité de l'article (dans l'inventaire). */
  onAjuster?: () => void;
  onFermer: () => void;
}) {
  // Les mouvements sont lus à chaque ouverture, avec la clé de l'article pour lequel ils l'ont été.
  const [lus, setLus] = useState<{ cle: string; mouvements: MouvementStock[] } | null>(null);
  const cle = article?.cle;
  useEffect(() => {
    if (!cle) return;
    lireArchiveStock()
      .then((archive) =>
        setLus({
          cle,
          mouvements: archive.mouvements
            .filter((m) => m.article === cle)
            .sort((a, b) => b.date.localeCompare(a.date)),
        }),
      )
      .catch(() => undefined);
  }, [cle]);
  const mouvements = lus && lus.cle === cle ? lus.mouvements : null;
  const unite = article?.unite ? ` ${article.unite}` : '';
  return (
    <Modal visible={!!article} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>
            {article?.emoji} {article?.titre}
          </Text>
          <Text style={commonStyles.note}>{T.titre}</Text>
          <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={commonStyles.gap6}>
            {mouvements && mouvements.length === 0 ? (
              <Text style={commonStyles.mutedItalic}>{T.aucun}</Text>
            ) : null}
            {(mouvements ?? []).map((m) => (
              <View key={m.id} style={commonStyles.rowSpaceBetween}>
                <Text style={commonStyles.muted}>
                  {formatDateFR(m.date)} · {libelleOrigineMouvement(m)}
                </Text>
                <Text style={commonStyles.lineBold}>
                  {m.delta > 0 ? '+' : ''}
                  {nombreFR(m.delta)}
                  {unite}
                </Text>
              </View>
            ))}
          </ScrollView>
          <View style={commonStyles.row}>
            {onAjuster ? (
              <Button style={commonStyles.flex1} variant="secondary" label={T.ajuster} onPress={onAjuster} />
            ) : null}
            {onOuvrirLeStock ? (
              <Button style={commonStyles.flex1} variant="secondary" label={T.ouvrirLeStock} onPress={onOuvrirLeStock} />
            ) : null}
            <Button style={commonStyles.flex1} label={TEXTES.commun.general.fermer} onPress={onFermer} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
