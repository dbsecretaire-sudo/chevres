import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ListRow } from '@/shared/components/ListRow';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { ArticleAnnexeModal } from '@/features/annexes/components/ArticleAnnexeModal';
import {
  ajusterStockArticle,
  enregistrerArticle,
  enregistrerCategorie,
  supprimerArticle,
  supprimerCategorie,
} from '@/features/annexes/repository';
import type { ArchiveAnnexes, ArticleAnnexe, CategorieAnnexe } from '@/features/annexes/types';
import { MouvementStockModal } from '@/features/stock/components/MouvementStockModal';
import { colors } from '@/shared/theme/colors';
import { formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/trading/Trading.styles';
import { styles as stylesAnnexes } from '@/shared/styles/annexes/Annexes.styles';
import { styles as stylesStock } from '@/shared/styles/stock/Stock.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.annexes.inventaire;

interface Props {
  archive: ArchiveAnnexes;
  /** Une seule activité (celle du filtre du stock) ; absente : toutes. */
  activiteId?: string;
  /** Appelé après chaque modification (pour relire les archives). */
  onChange: () => void;
}

/** Le prix d'un article, et son stock quand on le suit. */
const detail = (a: ArticleAnnexe): string =>
  TEXTES.annexes.article.prixEtStock(formatMontant(a.prix), a.suiviStock ? a.stock : undefined);

/**
 * Les activités annexes dans l'inventaire du gîte : pour chaque activité, ses articles rangés par catégorie, avec leur prix de
 * vente et leur stock. Un appui sur un article dont on suit le stock ajoute ou retire des unités ; le crayon change son nom,
 * sa catégorie, son prix ou son suivi — le prix fixé ici est celui des ventes de l'activité. Le crayon d'une catégorie la
 * renomme ou la supprime.
 */
export function InventaireAnnexes({ archive, activiteId, onChange }: Props) {
  const [mouvement, setMouvement] = useState<{ cle: string; libelle: string } | null>(null);
  const [modifie, setModifie] = useState<ArticleAnnexe | null>(null);
  const [categorie, setCategorie] = useState<CategorieAnnexe | null>(null);

  const activites = archive.activites.filter((a) => !activiteId || a.id === activiteId);
  if (activites.length === 0) return null;

  const ligne = (a: ArticleAnnexe) => (
    <ListRow
      key={a.id}
      title={a.nom}
      subtitle={a.suiviStock && a.stock < 0 ? T.negatif : detail({ ...a, suiviStock: false })}
      trailing={
        <View style={stylesStock.fin}>
          {a.suiviStock ? (
            <Text style={[styles.resultatLigne, a.stock < 0 ? styles.perte : undefined]}>{a.stock}</Text>
          ) : null}
          <Pressable onPress={() => setModifie(a)} hitSlop={8} accessibilityLabel={T.modifier}>
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </Pressable>
        </View>
      }
      onPress={() => (a.suiviStock ? setMouvement({ cle: a.id, libelle: a.nom }) : setModifie(a))}
    />
  );

  return (
    <View style={commonStyles.gap10}>
      {activites.map((activite) => {
        const articles = archive.articles.filter((a) => a.activiteId === activite.id);
        const categories = archive.categories.filter((c) => c.activiteId === activite.id);
        const sansCategorie = articles.filter((a) => !categories.some((c) => c.id === a.categorieId));
        return (
          <View key={activite.id} style={[commonStyles.gap6, stylesAnnexes.niveauActivite]}>
            <Text style={commonStyles.lineBold}>{activite.nom}</Text>
            {articles.length === 0 && categories.length === 0 ? (
              <Text style={commonStyles.mutedItalic}>{T.aucunArticle}</Text>
            ) : null}
            {categories.map((c) => (
              <View key={c.id} style={[commonStyles.gap6, stylesAnnexes.niveauCategorie]}>
                <View style={commonStyles.rowSpaceBetween}>
                  <Text style={commonStyles.muted}>{c.nom}</Text>
                  <Pressable
                    onPress={() => setCategorie(c)}
                    hitSlop={8}
                    accessibilityLabel={T.renommerCategorie}
                  >
                    <Ionicons name="pencil" size={16} color={colors.primary} />
                  </Pressable>
                </View>
                <View style={[commonStyles.gap6, stylesAnnexes.niveauArticle]}>
                  {articles.filter((a) => a.categorieId === c.id).map(ligne)}
                </View>
              </View>
            ))}
            {sansCategorie.length > 0 ? (
              <View style={[commonStyles.gap6, categories.length > 0 && stylesAnnexes.niveauCategorie]}>
                {categories.length > 0 ? <Text style={commonStyles.muted}>{T.sansCategorie}</Text> : null}
                <View style={[commonStyles.gap6, stylesAnnexes.niveauArticle]}>
                  {sansCategorie.map(ligne)}
                </View>
              </View>
            ) : null}
          </View>
        );
      })}

      <MouvementStockModal
        article={mouvement}
        onValider={async (cle, delta) => {
          await ajusterStockArticle(cle, delta);
          setMouvement(null);
          onChange();
        }}
        onFermer={() => setMouvement(null)}
      />
      <ArticleAnnexeModal
        visible={!!modifie}
        article={modifie ?? undefined}
        categories={archive.categories.filter((c) => c.activiteId === modifie?.activiteId)}
        onValider={async (donnees) => {
          if (modifie) await enregistrerArticle({ ...modifie, ...donnees });
          setModifie(null);
          onChange();
        }}
        onSupprimer={async () => {
          if (modifie) await supprimerArticle(modifie.id);
          setModifie(null);
          onChange();
        }}
        onFermer={() => setModifie(null)}
      />
      <NomModal
        visible={!!categorie}
        titre={T.renommerCategorie}
        valeurInitiale={categorie?.nom}
        placeholder={T.categoriePlaceholder}
        onValider={async (nom) => {
          if (categorie) await enregistrerCategorie({ ...categorie, nom });
          setCategorie(null);
          onChange();
        }}
        onAnnuler={() => setCategorie(null)}
        enfants={
          categorie ? (
            <Pressable
              onPress={async () => {
                await supprimerCategorie(categorie.id);
                setCategorie(null);
                onChange();
              }}
            >
              <Text style={commonStyles.required}>{T.supprimerCategorie}</Text>
            </Pressable>
          ) : undefined
        }
      />
    </View>
  );
}
