import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { Checkbox } from '@/shared/components/Checkbox';
import { Fab } from '@/shared/components/Fab';
import { Screen } from '@/shared/components/ScreenList';
import { SelectModal } from '@/shared/components/SelectModal';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  articlesDuGenre,
  cleArticle,
  conditionnementDe,
  definirConditionnement,
  libelleArticle,
  retirerConditionnement,
  type ArticleAffiche,
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
 * Organisation › Inventaire › Conditionnement : pour chaque fromage, et pour chaque autre produit fini ou produit animal qu'on y
 * ajoute (le bouton +, avec la liste de l'inventaire), les emballages qu'une vente consomme (un crayon les modifie un par un). À
 * chaque vente, le produit et ses emballages baissent tout seuls au stock.
 */
export default function Conditionnement() {
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  /** L'élément dont on modifie le conditionnement. */
  const [enEdition, setEnEdition] = useState<string | null>(null);
  const [choixOuvert, setChoixOuvert] = useState(false);

  const charger = useCallback(async () => setArchive(await lireArchiveStock()), []);
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  if (!archive) return null;
  const emballages = articlesDuGenre(GENRE_ARTICLE.EMBALLAGE, archive, FILTRE_STOCK_TOUT);
  const fromages = articlesDuGenre(GENRE_ARTICLE.FROMAGE, archive, FILTRE_STOCK_TOUT);
  /** Les produits finis (viande, charcuterie) et les produits animaux de l'inventaire : ceux qu'on peut ajouter ici. */
  const produits = articlesDuGenre(GENRE_ARTICLE.VIANDE, archive, FILTRE_STOCK_TOUT);
  const ajoutes = produits.filter((p) => codeDe(p.cle) in archive.conditionnements);
  const proposes = produits.filter((p) => !(codeDe(p.cle) in archive.conditionnements));
  const lignes: { article: ArticleAffiche; retirable: boolean }[] = [
    ...fromages.map((article) => ({ article, retirable: false })),
    ...ajoutes.map((article) => ({ article, retirable: true })),
  ];

  const basculer = async (code: string, emballage: string) => {
    const actuels = conditionnementDe(code, archive);
    await definirConditionnement(
      code,
      actuels.includes(emballage) ? actuels.filter((c) => c !== emballage) : [...actuels, emballage],
    );
    charger();
  };

  const retirer = (code: string) =>
    Alert.alert(T.retirer, '', [
      { text: TEXTES.commun.general.annuler, style: 'cancel' },
      {
        text: TEXTES.commun.general.supprimer,
        style: 'destructive',
        onPress: async () => {
          await retirerConditionnement(code);
          setEnEdition(null);
          charger();
        },
      },
    ]);

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        <Text style={commonStyles.note}>{T.aide}</Text>
        <BlocLignes>
          {lignes.map(({ article, retirable }) => {
            const code = codeDe(article.cle);
            const codes = conditionnementDe(code, archive);
            const edition = enEdition === code;
            return (
              <ListRow
                key={article.cle}
                title={article.libelle}
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
                      {retirable ? (
                        <Pressable onPress={() => retirer(code)} hitSlop={8}>
                          <Text style={commonStyles.required}>{T.retirer}</Text>
                        </Pressable>
                      ) : null}
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
      </ScrollView>

      <Fab
        options={[
          {
            label: T.ajouter,
            icon: 'add-circle',
            onPress: () => (proposes.length > 0 ? setChoixOuvert(true) : Alert.alert(T.tousAjoutes)),
          },
        ]}
      />
      {/* La liste de l'inventaire : un produit fini ou un produit animal qui n'a pas encore de conditionnement. */}
      <SelectModal<string>
        visible={choixOuvert}
        titre={T.element}
        value=""
        options={proposes.map((p) => ({ value: p.cle, label: p.libelle }))}
        onSelect={async (cle) => {
          // Il est ajouté sans emballage et s'ouvre aussitôt pour qu'on choisisse les siens.
          await definirConditionnement(codeDe(cle), []);
          setEnEdition(codeDe(cle));
          setChoixOuvert(false);
          charger();
        }}
        onClose={() => setChoixOuvert(false)}
        searchable
      />
    </Screen>
  );
}
