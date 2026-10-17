import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import { ChampsTarifsParCategorie } from '@/features/commercial/components/ChampsTarifsParCategorie';
import type { ArchiveCommercial } from '@/features/commercial/types';
import { useRentabilite } from '@/features/comptabilite/hooks/useRentabilite';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuGenre, type ArticleAffiche } from '@/features/stock/services/stock';
import { GENRE_ARTICLE } from '@/shared/constants/stock';
import { LOCALE } from '@/shared/constants/format';
import { categoriesClient } from '@/shared/dictionnaire/categoriesClient';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/commercial/Commercial.styles';
import { TEXTES } from '@/shared/textes';
import { formatMontant } from '@/shared/utils/dates';

const T = TEXTES.commercial.tarifs;

/**
 * La grille de tarifs : pour chaque fromage de l'inventaire, son prix de base (celui de l'inventaire), le prix de chaque catégorie de
 * client, et la marge qu'il laisse au prix de base (le lait et les emballages déduits).
 */
export default function GrilleTarifs() {
  const [fromages, setFromages] = useState<ArticleAffiche[]>([]);
  const [viandes, setViandes] = useState<ArticleAffiche[]>([]);
  const [prix, setPrix] = useState<Record<string, number>>({});
  const [commercial, setCommercial] = useState<ArchiveCommercial | null>(null);
  const { plan } = useRentabilite();
  const categories = categoriesClient();

  useFocusEffect(
    useCallback(() => {
      Promise.all([lireArchiveStock(), lireArchiveCommercial()]).then(([stock, archive]) => {
        setFromages(articlesDuGenre(GENRE_ARTICLE.FROMAGE, stock));
        setViandes(articlesDuGenre(GENRE_ARTICLE.VIANDE, stock));
        setPrix(stock.prix);
        setCommercial(archive);
      });
    }, []),
  );

  const prixLait = plan?.valorisation?.prixLait;
  const ligneDe = (cle: string) => plan?.valorisation?.lignes.find((l) => l.cle === cle);

  return (
    <Screen>
      <Text style={commonStyles.muted}>{T.aide}</Text>
      {fromages.length === 0 || !commercial ? (
        <EmptyState title={T.aucunFromage} />
      ) : (
        fromages.map((f) => {
          const base = prix[f.cle];
          const ligne = ligneDe(f.cle);
          const marge =
            base !== undefined && ligne && ligne.litresParFromage > 0 && prixLait !== undefined
              ? base - ligne.coutEmballage - ligne.litresParFromage * prixLait
              : undefined;
          return (
            <View key={f.cle} style={styles.carte}>
              <Text style={commonStyles.subheading}>{f.libelle}</Text>
              <Text style={commonStyles.muted}>
                {base !== undefined ? T.inventaire(formatMontant(base)) : T.sansPrixInventaire}
              </Text>
              <ChampsTarifsParCategorie
                article={f.cle}
                categories={categories}
                valeurs={commercial.tarifs[f.cle] ?? {}}
                prixInventaire={base}
              />
              {base !== undefined ? (
                <View style={commonStyles.gap2}>
                  <Text style={commonStyles.lineBold}>{T.marge.titre}</Text>
                  {marge !== undefined && ligne && prixLait !== undefined ? (
                    <>
                      <Text style={commonStyles.line}>
                        {T.marge.emballage(formatMontant(ligne.coutEmballage))}
                      </Text>
                      <Text style={commonStyles.line}>
                        {T.marge.lait(
                          ligne.litresParFromage.toLocaleString(LOCALE, { maximumFractionDigits: 2 }),
                          formatMontant(ligne.litresParFromage * prixLait),
                        )}
                      </Text>
                      <Text style={commonStyles.lineBold}>
                        {T.marge.brute(formatMontant(marge))} (
                        {T.marge.pourcent(
                          `${((marge / base) * 100).toLocaleString(LOCALE, { maximumFractionDigits: 0 })} %`,
                        )}
                        )
                      </Text>
                    </>
                  ) : (
                    <Text style={commonStyles.note}>{T.marge.incomplete}</Text>
                  )}
                </View>
              ) : null}
            </View>
          );
        })
      )}
      <Text style={commonStyles.note}>{T.marge.aide}</Text>
      {/* La viande et les animaux : un prix au kilo par catégorie de contact, comme les fromages. */}
      <Text style={commonStyles.subheading}>{T.viande}</Text>
      {viandes.length === 0 || !commercial ? (
        <EmptyState title={T.aucuneViande} />
      ) : (
        viandes.map((v) => (
          <View key={v.cle} style={styles.carte}>
            <Text style={commonStyles.subheading}>{v.libelle}</Text>
            <Text style={commonStyles.muted}>
              {prix[v.cle] !== undefined ? T.inventaire(formatMontant(prix[v.cle])) : T.sansPrixInventaire}
            </Text>
            <ChampsTarifsParCategorie
              article={v.cle}
              categories={categories}
              valeurs={commercial.tarifs[v.cle] ?? {}}
              prixInventaire={prix[v.cle]}
              parKg
            />
          </View>
        ))
      )}
    </Screen>
  );
}
