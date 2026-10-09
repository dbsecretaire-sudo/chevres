import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { ListRow } from '@/shared/components/ListRow';
import { Card } from '@/shared/components/Card';
import type { BilanLait } from '@/features/stock/services/stock';
import type { LaitJour } from '@/features/stock/types';
import { NOMS_MOIS } from '@/shared/textes/libelles';
import { formatDateFR } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/stock/Stock.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.laitJour;

/** Un nombre de litres à l'écran : au plus deux décimales, virgule comme séparateur. */
const enLitres = (nombre: number): string => String(Math.round(nombre * 100) / 100).replace('.', ',');

/**
 * Le lait produit, jour par jour : les plus récents d'abord, avec le total de chaque mois au-dessus de ses jours. Un appui
 * sur un jour le modifie.
 */
export function JournalLait({
  lait,
  bilan,
  prix,
  onModifierPrix,
  onOuvrir,
}: {
  lait: LaitJour[];
  /** Le bilan du lait : produit, utilisé, vendu et restant. */
  bilan: BilanLait;
  /** Le prix de vente du lait (€ le litre), quand il est défini : c'est lui qui fait le prix des ventes de lait. */
  prix?: number;
  onModifierPrix: () => void;
  onOuvrir: (entree: LaitJour) => void;
}) {
  const carteBilan = (
    <Card>
      {/* Le libellé garde sa place, le prix passe à la ligne plutôt que de déborder de la carte. */}
      <View style={styles.ligneDuPrix}>
        <Text style={[commonStyles.muted, styles.libelleDuPrix]}>{T.prixDuLitre}</Text>
        <Pressable
          style={styles.prixDuLitre}
          onPress={onModifierPrix}
          hitSlop={8}
          accessibilityLabel={T.modifierLePrix}
        >
          <Text style={[commonStyles.lineBold, styles.texteDuPrix]}>
            {prix ? T.prixLitre(enLitres(prix)) : T.prixAFixer}
          </Text>
          <Ionicons name="pencil" size={18} color={colors.ajout} />
        </Pressable>
      </View>
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={commonStyles.cardTitle}>{T.restant}</Text>
        <Text style={commonStyles.cardTitle}>{T.ligne(enLitres(bilan.restant))}</Text>
      </View>
      {[
        [T.produit, bilan.produit],
        [T.utilise, -bilan.utilise],
        [T.vendu, -bilan.vendu],
      ].map(([libelle, litres]) => (
        <View key={libelle as string} style={commonStyles.rowSpaceBetween}>
          <Text style={commonStyles.muted}>{libelle}</Text>
          <Text style={commonStyles.muted}>{T.ligne(enLitres(litres as number))}</Text>
        </View>
      ))}
    </Card>
  );
  if (lait.length === 0)
    return (
      <View style={commonStyles.gap10}>
        {carteBilan}
        <Text style={commonStyles.mutedItalic}>{T.aucun}</Text>
      </View>
    );

  const tries = [...lait].sort((a, b) => b.date.localeCompare(a.date));
  const mois = [...new Set(tries.map((l) => l.date.slice(0, 7)))];

  return (
    <View style={commonStyles.gap10}>
      {carteBilan}
      {mois.map((m) => {
        const duMois = tries.filter((l) => l.date.startsWith(m));
        const total = duMois.reduce((somme, l) => somme + l.litres, 0);
        return (
          <View key={m} style={commonStyles.gap10}>
            <Text style={commonStyles.cardTitle}>
              {T.totalDuMois(`${NOMS_MOIS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`, enLitres(total))}
            </Text>
            {duMois.map((l) => (
              <ListRow
                key={l.id}
                title={formatDateFR(l.date)}
                trailing={<Text style={commonStyles.lineBold}>{T.ligne(enLitres(l.litres))}</Text>}
                onPress={() => onOuvrir(l)}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}
