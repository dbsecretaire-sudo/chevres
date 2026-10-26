import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { lireArchiveStock } from '@/features/stock/repository';
import { lotsDeLInventaire } from '@/features/stock/services/lots';
import { libelleArticle } from '@/features/stock/services/stock';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { ETAT_LOT } from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { formatDateFR } from '@/shared/utils/dates';

/** Le filtre « tous les lots » : les autres filtres sont les articles (fromage frais, affiné…). */
const TOUS = 'tous';

/** Un lot tel qu'on le lit en stock : les pièces d'une même fabrication (même article, même numéro) ne font qu'une ligne. */
interface LigneDeLot {
  cle: string;
  article: string;
  numero: string;
  dateFabrication: string;
  pieces: number;
}

/** Regroupe les lots en stock par article et numéro, avec leur nombre de pièces. */
function lignesDeLots(lots: LotFromage[]): LigneDeLot[] {
  const groupes = new Map<string, LigneDeLot>();
  for (const lot of lots) {
    const cle = `${lot.article}|${lot.numero}`;
    const existant = groupes.get(cle);
    if (existant) existant.pieces += 1;
    else groupes.set(cle, { cle, article: lot.article, numero: lot.numero, dateFabrication: lot.dateFabrication, pieces: 1 });
  }
  return [...groupes.values()].sort((a, b) => b.dateFabrication.localeCompare(a.dateFabrication));
}

/**
 * Le stock des lots, comme sur la maquette : le nombre de lots en stock, les filtres par article (Tous, Frais, Affiné…), puis une ligne par lot : son nom
 * et son numéro, la date de fabrication, et le nombre de pièces restant en stock.
 */
export default function StockLots() {
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [filtre, setFiltre] = useState<string>(TOUS);

  useFocusEffect(
    useCallback(() => {
      lireArchiveStock()
        .then(setArchive)
        .catch(() => undefined);
    }, []),
  );

  const lignes = useMemo(() => (archive ? lignesDeLots(lotsDeLInventaire(archive, ETAT_LOT.EN_STOCK)) : []), [archive]);
  const articles = useMemo(() => [...new Set(lignes.map((l) => l.article))], [lignes]);
  const visibles = filtre === TOUS ? lignes : lignes.filter((l) => l.article === filtre);
  if (!archive) return null;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} style={{ backgroundColor: colors.background }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{`${lignes.length} lots en stock`}</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[TOUS, ...articles].map((cle) => {
          const actif = filtre === cle;
          return (
            <Pressable
              key={cle}
              accessibilityRole="button"
              accessibilityState={{ selected: actif }}
              onPress={() => setFiltre(cle)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: actif ? colors.primary : colors.border,
                backgroundColor: actif ? colors.primary : colors.surface,
              }}
            >
              <Text style={{ fontWeight: '600', color: actif ? colors.blanc : colors.text }}>
                {cle === TOUS ? 'Tous' : libelleArticle(cle, archive)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {visibles.map((l) => (
        <View
          key={l.cle}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{`${libelleArticle(l.article, archive)} · lot ${l.numero}`}</Text>
            <Text style={{ color: colors.textMuted }}>{`Fabriqué le ${formatDateFR(l.dateFabrication)}`}</Text>
          </View>
          <Text style={{ fontWeight: '800', color: colors.primary }}>{`${l.pieces} ${l.pieces > 1 ? 'pièces' : 'pièce'}`}</Text>
        </View>
      ))}

      {visibles.length === 0 ? <Text style={{ color: colors.textMuted, textAlign: 'center' }}>Aucun lot en stock.</Text> : null}
    </ScrollView>
  );
}
