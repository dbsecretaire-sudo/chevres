import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { lireArchiveStock, reglerMouvementAutomatique } from '@/features/stock/repository';
import { Checkbox } from '@/shared/components/Checkbox';
import { GENRE_ARTICLE } from '@/shared/constants/stock';
import { CLE_LAIT, mouvementsDuLait } from '@/features/stock/services/historiqueLait';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { libelleOrigineMouvement } from '@/features/stock/services/stock';
import type { MouvementStock, SansAutomatique } from '@/features/stock/types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
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
  onAutomatiqueChange,
}: {
  article: { cle: string; titre: string; emoji: string; unite?: string } | null;
  /** Ouvre l'article dans l'inventaire (là où l'on saisit ses quantités) : absent dans l'inventaire même. */
  onOuvrirLeStock?: () => void;
  /** Ouvre la saisie de la quantité de l'article (dans l'inventaire). */
  onAjuster?: () => void;
  onFermer: () => void;
  /** Appelé quand un mouvement automatique est activé ou désactivé : les quantités affichées derrière changent. */
  onAutomatiqueChange?: () => void;
}) {
  // Les mouvements sont lus à chaque ouverture, avec la clé de l'article pour lequel ils l'ont été.
  const [lus, setLus] = useState<{ cle: string; mouvements: MouvementStock[]; sans: SansAutomatique } | null>(null);
  /** Un changement d'interrupteur relit l'historique. */
  const [version, setVersion] = useState(0);
  const cle = article?.cle;
  useEffect(() => {
    if (!cle) return;
    Promise.all([lireArchiveStock(), cle === CLE_LAIT ? listToutesVentes() : Promise.resolve([])])
      .then(([archive, ventes]) =>
        setLus({
          cle,
          sans: archive.sansAutomatique ?? {},
          // Le lait n'est pas un article du stock : son historique vient du journal de lait, des fabrications et des ventes.
          mouvements: (cle === CLE_LAIT
            ? mouvementsDuLait(
                archive,
                ventes
                  .filter((v) => v.categorie === CATEGORIE_VENTE.LAIT && v.quantite)
                  .map((v) => ({ id: v.id, date: v.date, litres: v.quantite ?? 0 })),
              )
            : archive.mouvements.filter((m) => m.article === cle)
          ).sort((a, b) => b.date.localeCompare(a.date)),
        }),
      )
      .catch(() => undefined);
  }, [cle, version]);
  const mouvements = lus && lus.cle === cle ? lus.mouvements : null;
  /** Le mouvement automatique de cet article : celui du lait, ou celui des aliments (ce sont les seuls à en avoir). */
  const automatique = cle === CLE_LAIT ? 'lait' : cle?.startsWith(`${GENRE_ARTICLE.ALIMENT}:`) ? 'aliments' : null;
  const depuis = automatique && lus && lus.cle === cle ? lus.sans[automatique] : undefined;
  const regler = async (actif: boolean) => {
    if (!automatique) return;
    await reglerMouvementAutomatique(automatique, actif);
    setVersion((v) => v + 1);
    onAutomatiqueChange?.();
  };
  const unite = article?.unite ? ` ${article.unite}` : '';
  return (
    <Modal visible={!!article} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          {/* En haut à droite : la quantité (le poids), l'inventaire (dans la grange) et la fermeture, en boutons ronds. */}
          <View style={styles.entete}>
            <Text style={[commonStyles.subheading, styles.titre]}>
              {article?.emoji} {article?.titre}
            </Text>
            {onAjuster ? (
              <Pressable style={[styles.rond, styles.brun]} onPress={onAjuster} accessibilityRole="button" accessibilityLabel={T.ajuster}>
                <MaterialCommunityIcons name="weight-kilogram" size={20} color={colors.blanc} />
              </Pressable>
            ) : null}
            {onOuvrirLeStock ? (
              <Pressable style={[styles.rond, styles.brun]} onPress={onOuvrirLeStock} accessibilityRole="button" accessibilityLabel={T.ouvrirLeStock}>
                <Ionicons name="list" size={18} color={colors.blanc} />
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.rond, styles.rouge]}
              onPress={onFermer}
              accessibilityRole="button"
              accessibilityLabel={TEXTES.commun.general.fermer}
            >
              <Ionicons name="close" size={22} color={colors.blanc} />
            </Pressable>
          </View>
          <Text style={commonStyles.note}>{T.titre}</Text>
          {automatique && lus && lus.cle === cle ? (
            <>
              <Checkbox
                label={automatique === 'lait' ? T.automatiqueLait : T.automatiqueAliments}
                value={!depuis}
                onChange={regler}
              />
              <Text style={commonStyles.mutedItalic}>{depuis ? T.automatiqueDepuis(formatDateFR(depuis)) : T.automatiqueAide}</Text>
            </>
          ) : null}
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  entete: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titre: { flex: 1 },
  rond: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  brun: { backgroundColor: '#6B3F1B', borderColor: '#3F230E' },
  rouge: { backgroundColor: '#8B0016', borderColor: '#5C000E' },
});
