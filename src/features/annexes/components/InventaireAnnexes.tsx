import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { ArticleAnnexeModal } from '@/features/annexes/components/ArticleAnnexeModal';
import { ajusterStockArticle, enregistrerArticle, supprimerArticle } from '@/features/annexes/repository';
import type { ArchiveAnnexes, ArticleAnnexe } from '@/features/annexes/types';
import { MouvementStockModal } from '@/features/stock/components/MouvementStockModal';
import { colors } from '@/shared/theme/colors';
import { formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/trading/Trading.styles';
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

  const articles = archive.articles.filter((a) => activites.some((x) => x.id === a.activiteId));

  return (
    <View style={commonStyles.gap10}>
      {/* Les articles de toutes les activités annexes, en un seul bloc : le filtre du stock choisit l'activité. */}
      {articles.length === 0 ? (
        <Text style={commonStyles.mutedItalic}>{T.aucunArticle}</Text>
      ) : (
        <BlocLignes>{articles.map(ligne)}</BlocLignes>
      )}

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
    </View>
  );
}
