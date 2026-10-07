import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { ListRow } from '@/shared/components/ListRow';
import { ListeReordonnable } from '@/shared/components/ListeReordonnable';
import { ArticleStockModal } from '@/features/stock/components/ArticleStockModal';
import { MouvementStockModal } from '@/features/stock/components/MouvementStockModal';
import {
  ajouterMouvementManuel,
  articlesDuGenre,
  niveauxDeStock,
  positionnerArticle,
  renommerArticle,
  supprimerArticle,
  type ArticleAffiche,
} from '@/features/stock/services/stock';
import type { ArchiveStock, ListeInventaire } from '@/features/stock/types';
import { FILTRE_STOCK_TOUT, GENRE_ARTICLE, ORIGINE_MOUVEMENT } from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { todayISO } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/trading/Trading.styles';
import { styles as stylesStock } from '@/shared/styles/stock/Stock.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock;

interface Props {
  liste: ListeInventaire;
  /** L'inventaire (articles, mouvements, listes) dont cette liste fait partie. */
  archive: ArchiveStock;
  /** Appelé après chaque changement (un mouvement, un nom, une suppression) : l'écran recharge l'inventaire. */
  onChange: () => void;
  /** Vrai pendant qu'on fait glisser une ligne : la page ne défile alors pas. */
  onGlisse: (glisse: boolean) => void;
}

/**
 * Les articles d'une liste ajoutée dans la structure des listes : chaque ligne montre sa quantité, un appui y ajoute ou en
 * retire (+1, −1), un crayon renomme (ou supprime) l'article et une poignée le déplace. L'ajout d'un article se fait depuis le
 * bouton « + » de l'écran.
 */
export function ListePersonnalisee({ liste, archive, onChange, onGlisse }: Props) {
  const [mouvement, setMouvement] = useState<ArticleAffiche | null>(null);
  const [renomme, setRenomme] = useState<ArticleAffiche | null>(null);
  const [aSupprimer, setASupprimer] = useState<ArticleAffiche | null>(null);
  const niveaux = niveauxDeStock(archive.mouvements);
  const elements = articlesDuGenre(GENRE_ARTICLE.PERSONNALISE, archive, FILTRE_STOCK_TOUT, liste.id);

  if (elements.length === 0) {
    return <Text style={commonStyles.mutedItalic}>{T.ajouter.listeVide}</Text>;
  }

  const valider = async (cle: string, delta: number) => {
    // Retirer, c'est consommer (ou sortir) : le mouvement le dit dans l'historique.
    await ajouterMouvementManuel(
      cle,
      delta,
      todayISO(),
      undefined,
      delta < 0 ? ORIGINE_MOUVEMENT.CONSOMMATION : ORIGINE_MOUVEMENT.MANUEL,
    );
    setMouvement(null);
    onChange();
  };

  return (
    <>
      <ListeReordonnable
        elements={elements}
        cle={(a) => a.cle}
        onGlisse={onGlisse}
        ligne={(a, poignee) => {
          const niveau = niveaux.get(a.cle) ?? 0;
          return (
            <ListRow
              key={a.cle}
              title={a.libelle}
              subtitle={niveau < 0 ? T.negatif : undefined}
              trailing={
                <View style={stylesStock.fin}>
                  <Text style={[styles.resultatLigne, niveau < 0 ? styles.perte : undefined]}>
                    {T.unites(niveau)}
                  </Text>
                  <Pressable
                    onPress={() => setRenomme(a)}
                    hitSlop={8}
                    accessibilityLabel={T.renommer.modifier}
                  >
                    <Ionicons name="pencil" size={18} color={colors.primary} />
                  </Pressable>
                  {poignee}
                </View>
              }
              onPress={() => setMouvement(a)}
            />
          );
        }}
        onDeplacer={async (cle, index) => {
          // On place la ligne là où se trouve celle qu'elle remplace dans la liste de tous les articles personnalisés.
          const autres = elements.filter((a) => a.cle !== cle);
          const complet = articlesDuGenre(GENRE_ARTICLE.PERSONNALISE, archive)
            .map((a) => a.cle)
            .filter((c) => c !== cle);
          const cible = autres[index];
          const indexComplet = cible ? complet.indexOf(cible.cle) : complet.length;
          await positionnerArticle(GENRE_ARTICLE.PERSONNALISE, cle, indexComplet, FILTRE_STOCK_TOUT);
          onChange();
        }}
      />

      <MouvementStockModal
        article={mouvement}
        consommable
        niveau={mouvement ? niveaux.get(mouvement.cle) : undefined}
        onValider={valider}
        onSupprimer={() => {
          setASupprimer(mouvement);
          setMouvement(null);
        }}
        onFermer={() => setMouvement(null)}
      />
      <ArticleStockModal
        visible={!!renomme}
        titre={T.renommer.titre}
        nom={renomme?.libelle}
        avecPrix={false}
        onValider={async (nom) => {
          if (renomme) await renommerArticle(renomme.cle, nom);
          setRenomme(null);
          onChange();
        }}
        onSupprimer={() => {
          setASupprimer(renomme);
          setRenomme(null);
        }}
        onAnnuler={() => setRenomme(null)}
      />
      <ConfirmModal
        visible={!!aSupprimer}
        title={T.suppression.titre}
        message={T.suppression.message(aSupprimer?.libelle ?? '')}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setASupprimer(null)}
        onConfirm={async () => {
          if (aSupprimer?.id) await supprimerArticle(aSupprimer.id);
          setASupprimer(null);
          onChange();
        }}
      />
    </>
  );
}
