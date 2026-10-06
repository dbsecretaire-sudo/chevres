import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import { YearPicker } from '@/shared/components/YearPicker';
import { articlesDuGenre, statistiqueLait } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { GENRE_ARTICLE } from '@/shared/constants/stock';
import { currentYear } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/stock/Stock.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.lait;
const MOIS = Array.from({ length: 12 }, (_, i) => i + 1);

/** Un nombre de litres à l'écran, virgule comme séparateur. */
const enLitres = (nombre: number): string => String(nombre).replace('.', ',');

/**
 * Les statistiques de lait de l'année : pour chaque fromage fabriqué, les litres de lait par fromage — et, en dessous, le
 * même chiffre mois par mois (le lait est plus gras en début de saison qu'en fin). Elles viennent des litres notés quand
 * on ajoute des fromages fabriqués ; pour le brocciu, ce sont les litres versés dans le lactosérum.
 */
export function LaitParFromage({ archive }: { archive: ArchiveStock }) {
  const [annee, setAnnee] = useState(currentYear());
  /** Les fromages dont le détail (total et mois par mois) est déroulé ; il est caché par défaut. */
  const [deroules, setDeroules] = useState<string[]>([]);
  const basculer = (cle: string) =>
    setDeroules((actuels) => (actuels.includes(cle) ? actuels.filter((c) => c !== cle) : [...actuels, cle]));

  const annees = Array.from(
    new Set([
      currentYear(),
      ...archive.mouvements.filter((m) => (m.litres ?? 0) > 0).map((m) => Number(m.date.slice(0, 4))),
    ]),
  );

  const lignes = articlesDuGenre(GENRE_ARTICLE.FROMAGE, archive)
    .map((fromage) => ({ fromage, stat: statistiqueLait(archive.mouvements, fromage.cle, annee) }))
    .filter((l) => l.stat !== undefined);

  return (
    <View style={commonStyles.gap10}>
      <Text style={commonStyles.cardTitle}>{T.titre}</Text>
      <YearPicker annees={annees} value={annee} onChange={setAnnee} />
      {lignes.length === 0 ? (
        <Text style={commonStyles.mutedItalic}>{T.aucune}</Text>
      ) : (
        lignes.map(({ fromage, stat }) => {
          const deroule = deroules.includes(fromage.cle);
          return (
            <Card key={fromage.cle}>
              <View style={styles.enteteCarte}>
                <Text style={[commonStyles.lineSemiBold, commonStyles.flex1]}>
                  {T.ligne(fromage.cle.split(':')[1], fromage.libelle, enLitres(stat!.litresParFromage))}
                </Text>
                <Pressable onPress={() => basculer(fromage.cle)} hitSlop={8}>
                  <Text style={commonStyles.strongPrimary}>
                    {deroule ? T.detailMasquer : T.detailAfficher}
                  </Text>
                </Pressable>
              </View>
              {deroule ? (
                <>
                  <Text style={commonStyles.note}>{T.detail(enLitres(stat!.litres), stat!.fromages)}</Text>
                  <View style={styles.tableauMois}>
                    <View style={styles.ligneMois}>
                      <Text style={styles.etiquetteMois}>{T.mois}</Text>
                      {MOIS.map((mois) => (
                        <Text key={mois} style={[styles.celluleMois, styles.celluleMoisTitre]}>
                          {mois}
                        </Text>
                      ))}
                    </View>
                    <View style={styles.ligneMois}>
                      <Text style={styles.etiquetteMois}>{T.litres}</Text>
                      {stat!.parMois.map((litres, i) => (
                        <Text
                          key={i}
                          style={[styles.celluleMois, litres === undefined && styles.celluleMoisVide]}
                        >
                          {litres === undefined ? '–' : enLitres(Math.round(litres * 10) / 10)}
                        </Text>
                      ))}
                    </View>
                  </View>
                  <Text style={commonStyles.note}>{T.legende}</Text>
                </>
              ) : null}
            </Card>
          );
        })
      )}
    </View>
  );
}
