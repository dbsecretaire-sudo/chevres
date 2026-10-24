import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuProduit, etatDuLot, trierLots } from '@/features/stock/services/lots';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { ETAT_LOT, PRODUIT_A_LOTS, TRI_LOT } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { styles as stylesRoles } from '@/shared/styles/roles/Roles.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.production.lotsProduitSimple;

/** Le produit dont on regarde les lots : fromage, charcuterie, plat ou savon. */
export type ProduitDesLots = ValeurDe<typeof PRODUIT_A_LOTS>;

/** Un lot et le nom de son article (« Frais », « Saucisson »…). */
interface LotAffiche {
  lot: LotFromage;
  article: string;
}

/**
 * Les lots d'un produit, en lecture seule (le mode normal) : chaque lot avec son numéro, sa date de fabrication et où il en est — en stock, vendu ou rappelé. Les plus
 * récents d'abord ; les lignes ne s'ouvrent pas. Le contrôle, les dates et les rappels se font dans le mode avancé.
 */
export function LotsProduitSimple({ produit, titre }: { produit: ProduitDesLots; titre: string }) {
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  useFocusEffect(
    useCallback(() => {
      lireArchiveStock()
        .then(setArchive)
        .catch(() => undefined);
    }, []),
  );

  const articles = archive ? articlesDuProduit(produit, archive, espece) : [];
  const lots: LotAffiche[] = archive
    ? trierLots(
        (archive.lots ?? []).filter((l) => articles.some((a) => a.cle === l.article)),
        TRI_LOT.NUMERO,
        false,
      ).map((lot) => ({ lot, article: articles.find((a) => a.cle === lot.article)?.libelle ?? '' }))
    : [];
  const enStock = lots.filter(({ lot }) => etatDuLot(lot) === ETAT_LOT.EN_STOCK).length;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={stylesRoles.titre}>{titre}</Text>
      {archive ? <Text style={stylesRoles.detail}>{T.resume(enStock, lots.length)}</Text> : null}
      {archive && lots.length === 0 ? <Text style={stylesRoles.detail}>{T.aucun}</Text> : null}
      {lots.map(({ lot, article }) => {
        const etat = etatDuLot(lot);
        return (
          <View key={lot.id} style={styles.ligne}>
            <View style={styles.texte}>
              <Text style={styles.titre}>{`${article} · ${T.numero(lot.numero)}`}</Text>
              <Text style={styles.detail}>{T.fabrique(formatDateFR(lot.dateFabrication))}</Text>
              <Text style={[styles.mention, etat === ETAT_LOT.EN_STOCK ? styles.enStock : etat === ETAT_LOT.RAPPELE ? styles.rappele : styles.vendu]}>
                {etat === ETAT_LOT.EN_STOCK
                  ? T.enStock
                  : etat === ETAT_LOT.RAPPELE
                    ? T.rappele(lot.dateRappel ? formatDateFR(lot.dateRappel) : '')
                    : T.vendu(lot.dateVente ? formatDateFR(lot.dateVente) : '')}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blanc,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3DFD3',
    padding: 14,
  },
  texte: { flex: 1, gap: 2 },
  titre: { fontSize: 17, fontWeight: '700', color: colors.text },
  detail: { fontSize: 14, color: colors.textMuted },
  mention: { fontSize: 14, fontWeight: '700' },
  enStock: { color: colors.primary },
  vendu: { color: colors.textMuted },
  rappele: { color: colors.danger },
});
