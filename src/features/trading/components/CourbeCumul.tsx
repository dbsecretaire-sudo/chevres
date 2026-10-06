import { useState } from 'react';
import { Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import { resultatTrade, tradesClos } from '@/features/trading/services/calculs';
import type { Trade } from '@/features/trading/types';
import { colors } from '@/shared/theme/colors';
import { formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/trading/Trading.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Hauteur du dessin et marge intérieure (px). */
const HAUTEUR = 150;
const MARGE = 12;

/**
 * La courbe du cumul des résultats : après chaque trade clos (dans l'ordre de leur clôture), où en est le total.
 * Elle est tracée avec de simples segments, vert au-dessus de zéro et rouge en dessous.
 */
export function CourbeCumul({ trades }: { trades: Trade[] }) {
  const T = TEXTES.trading.courbe;
  const [largeur, setLargeur] = useState(0);

  // Le point de départ (zéro), puis le cumul après chaque trade clos.
  const cumuls = [0];
  for (const t of tradesClos(trades)) cumuls.push(cumuls[cumuls.length - 1] + resultatTrade(t)!);

  const plusHaut = Math.max(...cumuls);
  const plusBas = Math.min(...cumuls);
  const ecart = plusHaut - plusBas || 1;
  const utile = Math.max(largeur - 2 * MARGE, 1);
  const x = (i: number) => MARGE + (i / (cumuls.length - 1)) * utile;
  const y = (valeur: number) => HAUTEUR - MARGE - ((valeur - plusBas) / ecart) * (HAUTEUR - 2 * MARGE);

  const final = cumuls[cumuls.length - 1];

  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{T.titre}</Text>
      {cumuls.length < 3 ? (
        <Text style={commonStyles.mutedItalic}>{T.aucune}</Text>
      ) : (
        <>
          <View
            style={[styles.courbe, { height: HAUTEUR }]}
            onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
          >
            {largeur > 0 ? (
              <>
                <View style={[styles.ligneZero, { top: y(0) }]} />
                {cumuls.slice(1).map((valeur, i) => {
                  const [x1, y1, x2, y2] = [x(i), y(cumuls[i]), x(i + 1), y(valeur)];
                  const longueur = Math.hypot(x2 - x1, y2 - y1);
                  return (
                    <View
                      key={`segment-${i}`}
                      style={[
                        styles.segment,
                        {
                          width: longueur,
                          left: (x1 + x2) / 2 - longueur / 2,
                          top: (y1 + y2) / 2 - 1,
                          backgroundColor: valeur >= 0 ? colors.success : colors.danger,
                          transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad` }],
                        },
                      ]}
                    />
                  );
                })}
                {cumuls.map((valeur, i) => (
                  <View
                    key={`point-${i}`}
                    style={[
                      styles.pointCourbe,
                      {
                        left: x(i) - 3,
                        top: y(valeur) - 3,
                        backgroundColor: valeur >= 0 ? colors.success : colors.danger,
                      },
                    ]}
                  />
                ))}
              </>
            ) : null}
          </View>
          <Text style={[styles.resultatLigne, final >= 0 ? styles.gain : styles.perte]}>
            {T.cumulFinal(formatMontant(final))}
          </Text>
          <Text style={commonStyles.note}>{T.aide(formatMontant(plusHaut), formatMontant(plusBas))}</Text>
        </>
      )}
    </Card>
  );
}
