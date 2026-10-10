import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { Checkbox } from '@/shared/components/Checkbox';
import { Screen } from '@/shared/components/Screen';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  articlesDuGenre,
  cleArticle,
  conditionnementDe,
  definirConditionnement,
  libelleArticle,
} from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { FILTRE_STOCK_TOUT, GENRE_ARTICLE } from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.conditionnement;

/** Le code d'un article (« fromage:frais » → « frais »). */
const codeDe = (cle: string): string => cle.split(':')[1];

/**
 * Organisation › Inventaire › Conditionnement : pour chaque fromage, les emballages qu'une vente consomme (un crayon les
 * modifie un par un). À chaque vente d'un fromage, le fromage et ses emballages baissent tout seuls au stock.
 */
export default function Conditionnement() {
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  /** Le fromage dont on modifie le conditionnement. */
  const [enEdition, setEnEdition] = useState<string | null>(null);

  const charger = useCallback(async () => setArchive(await lireArchiveStock()), []);
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  if (!archive) return null;
  const emballages = articlesDuGenre(GENRE_ARTICLE.EMBALLAGE, archive, FILTRE_STOCK_TOUT);
  const fromages = articlesDuGenre(GENRE_ARTICLE.FROMAGE, archive, FILTRE_STOCK_TOUT);

  const basculer = async (fromage: string, code: string) => {
    const actuels = conditionnementDe(fromage, archive);
    await definirConditionnement(
      fromage,
      actuels.includes(code) ? actuels.filter((c) => c !== code) : [...actuels, code],
    );
    charger();
  };

  return (
    <Screen>
      <Text style={commonStyles.note}>{T.aide}</Text>
      <BlocLignes>
        {fromages.map((f) => {
          const code = codeDe(f.cle);
          const codes = conditionnementDe(code, archive);
          const edition = enEdition === code;
          return (
            <ListRow
              key={f.cle}
              title={f.libelle}
              subtitle={
                edition ? (
                  <View style={commonStyles.gap6}>
                    <Text style={commonStyles.note}>{T.choisirLesEmballages}</Text>
                    {emballages.map((e) => (
                      <Checkbox
                        key={e.cle}
                        label={e.libelle}
                        value={codes.includes(codeDe(e.cle))}
                        onChange={() => basculer(code, codeDe(e.cle))}
                      />
                    ))}
                  </View>
                ) : codes.length === 0 ? (
                  T.aucun
                ) : (
                  codes
                    .map((c) => libelleArticle(cleArticle(GENRE_ARTICLE.EMBALLAGE, c), archive))
                    .join(' + ')
                )
              }
              trailing={
                <Pressable
                  onPress={() => setEnEdition(edition ? null : code)}
                  hitSlop={8}
                  accessibilityLabel={T.modifier}
                >
                  <Ionicons name={edition ? 'checkmark' : 'pencil'} size={20} color={colors.primary} />
                </Pressable>
              }
            />
          );
        })}
      </BlocLignes>
    </Screen>
  );
}
