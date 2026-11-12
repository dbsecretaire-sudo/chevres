import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Fab } from '@/shared/components/Fab';
import { ROUTES } from '@/shared/constants/routes';
import { DessinDeCarte } from '@/features/stock/components/DessinDeCarte';
import { lireArchiveStock } from '@/features/stock/repository';
import { emojiDeLArticle } from '@/features/stock/services/entrepotJeu';
import { supprimerRecette } from '@/features/stock/services/lots';
import { libelleArticle } from '@/features/stock/services/stock';
import type { ArchiveStock, GenreArticle, RecetteDeFabrication } from '@/features/stock/types';
import { libelleIngredientDeRecette } from '@/features/production/services/ingredientsPlat';
import { Card } from '@/shared/components/Card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { GroupeAccueil } from '@/features/accueil/components/GroupeAccueil';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { Screen } from '@/shared/components/Screen';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.recettes;
const P = T.page;

/** L'ordre des produits dans la bibliothèque. */
const PRODUITS = ['fromage', 'charcuterie', 'plat', 'savon'] as const;

/**
 * La bibliothèque de recettes de l'atelier (Atelier › Recettes) : celles des fromages, de la charcuterie, des plats préparés et des savons, chacune en carte avec
 * l'image de son article au stock et ses ingrédients. Le nom d'une recette est celui de son article : on ne le renomme pas. Le crayon de chaque carte la modifie
 * ou la supprime ; une recette se crée depuis une fabrication (« Enregistrer comme recette ») ou avec le « + ».
 */
export default function RecettesDeFabrication() {
  const router = useRouter();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  // La recette dont le crayon est ouvert (son menu Modifier / Supprimer), puis celle à supprimer après confirmation.
  const [menuDe, setMenuDe] = useState<RecetteDeFabrication | null>(null);
  const [aSupprimer, setASupprimer] = useState<RecetteDeFabrication | null>(null);
  const charger = useCallback(
    () =>
      lireArchiveStock()
        .then(setArchive)
        .catch(() => undefined),
    [],
  );
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const toutes = archive?.recettes ?? [];

  return (
    // Le « + » reste en bas de l'écran, comme partout : il est hors de la liste qui défile.
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        <Text style={commonStyles.note}>{P.intro}</Text>
        {toutes.length === 0 ? <Text style={commonStyles.mutedItalic}>{P.aucune}</Text> : null}
        {PRODUITS.map((produit) => {
          const recettes = toutes.filter((r) => r.produit === produit).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
          if (recettes.length === 0 || !archive) return null;
          return (
            <GroupeAccueil key={produit} titre={P.produit[produit]}>
              <View style={styles.grille}>
                {recettes.map((r) => {
                  const libelle = r.article ? libelleArticle(r.article, archive) : undefined;
                  return (
                    <Card key={r.id} style={styles.carte}>
                      <Pressable
                        style={styles.crayon}
                        onPress={() => setMenuDe(r)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Modifier ou supprimer ${r.nom}`}
                      >
                        <Ionicons name="pencil" size={14} color={colors.primary} />
                      </Pressable>
                      <View style={styles.entete}>
                        {r.article && libelle ? (
                          <DessinDeCarte emoji={emojiDeLArticle(r.article.split(':')[0] as GenreArticle, libelle)} cle={r.article} />
                        ) : null}
                        <View style={styles.texte}>
                          <Text style={commonStyles.cardTitle}>{r.nom}</Text>
                          {libelle && libelle !== r.nom ? <Text style={commonStyles.muted}>{libelle}</Text> : null}
                        </View>
                      </View>
                      {r.ingredients.length === 0 ? (
                        <Text style={commonStyles.mutedItalic}>{P.sansIngredient}</Text>
                      ) : (
                        <View style={commonStyles.gap6}>
                          {r.ingredients.map((i, n) => (
                            <Text key={`${i.article}-${n}`} style={commonStyles.line}>
                              {libelleIngredientDeRecette(i, archive)}
                            </Text>
                          ))}
                        </View>
                      )}
                    </Card>
                  );
                })}
              </View>
            </GroupeAccueil>
          );
        })}
      </ScrollView>
      <OptionsModal
        visible={!!menuDe}
        onClose={() => setMenuDe(null)}
        title={menuDe?.nom}
        options={[
          {
            label: T.edition.modifier,
            icon: 'create-outline',
            onPress: () => {
              if (menuDe) router.push(ROUTES.productionRecette(menuDe.id) as never);
            },
          },
          {
            label: T.supprimer,
            icon: 'trash-outline',
            color: colors.danger,
            onPress: () => setASupprimer(menuDe),
          },
        ]}
      />
      <ConfirmModal
        visible={!!aSupprimer}
        title={T.supprimerQuestion(aSupprimer?.nom ?? '')}
        message={T.supprimerMessage}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setASupprimer(null)}
        onConfirm={async () => {
          const r = aSupprimer;
          setASupprimer(null);
          if (r) {
            await supprimerRecette(r.id);
            await charger();
          }
        }}
      />
      <Fab
        options={PRODUITS.map((p) => ({
          label: `${T.edition.ajouter} · ${P.produit[p]}`,
          icon: 'add-circle' as const,
          onPress: () => router.push(ROUTES.productionRecette(undefined, p) as never),
        }))}
      />
    </Screen>
  );
}

/**
 * Les cartes se rangent en grille, trois par ligne sur un écran large ; sur un téléphone, une carte pleine largeur (la largeur minimale la fait passer seule).
 */
const styles = StyleSheet.create({
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  carte: { width: '32%', minWidth: 260, gap: 10 },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 32 },
  texte: { flex: 1, gap: 2 },
  crayon: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
