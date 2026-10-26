import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { ArticleStockModal } from '@/features/stock/components/ArticleStockModal';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  ajouterArticle,
  articlesDuGenre,
  definirPrixArticle,
  niveauxDeStock,
  prixDesOeufs,
} from '@/features/stock/services/stock';
import type { ArchiveStock, GenreArticle } from '@/features/stock/types';
import { useRole } from '@/features/roles/context/RoleContext';
import { ROLE } from '@/shared/constants/roles';
import { ROUTES } from '@/shared/constants/routes';
import { CLE_PRIX_OEUFS, GENRE_ARTICLE } from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatMontant } from '@/shared/utils/dates';

const T = TEXTES.stock;

/** L'onglet des œufs : ils n'ont pas d'article, seulement un prix (celui de l'inventaire). */
const ONGLET_OEUFS = 'oeufs';

type Onglet = typeof ONGLET_OEUFS | GenreArticle;

/**
 * Les onglets du stock : une pastille par catégorie, comme sur la maquette. `ajout` est le bouton d'ajout de la catégorie (absent quand on ne
 * l'ajoute pas à la main : les boucles entrent par un achat, les œufs n'ont pas d'article). `unite` est celle de la quantité (le kilo des aliments).
 */
const ONGLETS: { cle: Onglet; titre: string; ajout?: string; unite?: string }[] = [
  { cle: GENRE_ARTICLE.FROMAGE, titre: 'Fromages', ajout: 'Ajouter un fromage' },
  { cle: ONGLET_OEUFS, titre: 'Œufs' },
  { cle: GENRE_ARTICLE.VIANDE, titre: 'Viande', ajout: 'Ajouter une viande' },
  { cle: GENRE_ARTICLE.PLAT, titre: 'Plats', ajout: 'Ajouter un plat' },
  { cle: GENRE_ARTICLE.SAVON, titre: 'Savons', ajout: 'Ajouter un savon' },
  { cle: GENRE_ARTICLE.EMBALLAGE, titre: 'Emballages', ajout: 'Ajouter un emballage' },
  { cle: GENRE_ARTICLE.ALIMENT, titre: 'Aliments', ajout: 'Ajouter un aliment', unite: 'kg' },
  { cle: GENRE_ARTICLE.BOUCLE, titre: 'Boucles' },
  { cle: GENRE_ARTICLE.ENTRETIEN, titre: 'Entretien', ajout: 'Ajouter un produit d’entretien' },
  { cle: GENRE_ARTICLE.MATERIEL, titre: 'Matériel', ajout: 'Ajouter un matériel' },
  { cle: GENRE_ARTICLE.BATIMENT, titre: 'Bâtiment', ajout: 'Ajouter un matériel de bâtiment' },
  { cle: GENRE_ARTICLE.EQUIPEMENT, titre: 'Équipement', ajout: 'Ajouter un équipement' },
];

/**
 * Le stock sur le téléphone, comme sur la maquette : une pastille par catégorie du stock (fromages, viande, aliments, boucles…), une carte par
 * article avec son prix et son nombre en stock, un bouton pour ajouter, puis les rubriques avancées (structure des listes, historique, statistiques).
 */
export default function StockLots() {
  const router = useRouter();
  const { role } = useRole();
  // Le mode normal regarde seulement : les rubriques avancées ne s'affichent pas.
  const simple = role === ROLE.BERGER;
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [onglet, setOnglet] = useState<Onglet>(ONGLETS[0].cle);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [prixOeufsOuvert, setPrixOeufsOuvert] = useState(false);

  const charger = useCallback(() => {
    lireArchiveStock()
      .then(setArchive)
      .catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const articles = useMemo(
    () => (archive && onglet !== ONGLET_OEUFS ? articlesDuGenre(onglet, archive) : []),
    [archive, onglet],
  );
  const niveaux = useMemo(() => (archive ? niveauxDeStock(archive.mouvements) : new Map<string, number>()), [archive]);
  if (!archive) return null;
  const ongletCourant = ONGLETS.find((o) => o.cle === onglet) ?? ONGLETS[0];

  const ajouter = async (nom: string) => {
    if (onglet === ONGLET_OEUFS) return;
    await ajouterArticle(onglet, nom);
    setAjoutOuvert(false);
    charger();
  };

  const avance = (
    <View style={styles.trailing}>
      <Badge label="Avancé" color={colors.text} />
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.contenu} style={styles.fond}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.onglets}>
        {ONGLETS.map((o) => {
          const actif = o.cle === onglet;
          return (
            <Pressable
              key={o.cle}
              accessibilityRole="button"
              accessibilityState={{ selected: actif }}
              onPress={() => setOnglet(o.cle)}
              style={[styles.onglet, actif && styles.ongletActif]}
            >
              <Text style={[styles.ongletTexte, actif && styles.ongletTexteActif]}>{o.titre}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.entete}>
        <Text style={styles.enteteTexte}>{ongletCourant.titre}</Text>
      </View>

      {onglet === ONGLET_OEUFS ? (
        <>
          <View style={styles.carte}>
            <View style={styles.carteTexte}>
              <Text style={styles.nom}>{T.oeufs.prixDeLOeuf}</Text>
              <Text style={styles.prix}>{T.oeufs.prixOeuf(formatMontant(prixDesOeufs(archive)))}</Text>
            </View>
            <Pressable onPress={() => setPrixOeufsOuvert(true)} hitSlop={8} accessibilityLabel={T.oeufs.modifierLePrix}>
              <Ionicons name="pencil" size={20} color={colors.ajout} />
            </Pressable>
          </View>
          <Text style={styles.note}>{T.oeufs.note}</Text>
        </>
      ) : (
        <>
          {articles.length === 0 ? <Text style={styles.vide}>Aucun article pour le moment.</Text> : null}
          {articles.map((a) => {
            const niveau = niveaux.get(a.cle) ?? 0;
            return (
              <View key={a.cle} style={styles.carte}>
                <View style={styles.carteTexte}>
                  <Text style={styles.nom}>{a.libelle}</Text>
                  {a.prix ? (
                    <Text style={styles.prix}>{`${formatMontant(a.prix)} ${ongletCourant.unite ? 'le kilo' : 'la pièce'}`}</Text>
                  ) : null}
                </View>
                <Text style={styles.quantite}>
                  {ongletCourant.unite ? `${niveau} ${ongletCourant.unite}` : `${niveau} en stock`}
                </Text>
              </View>
            );
          })}
          {ongletCourant.ajout ? <Button label={ongletCourant.ajout} onPress={() => setAjoutOuvert(true)} /> : null}
        </>
      )}

      {simple ? null : (
        <BlocLignes>
          <ListRow
            title="Structure des listes"
            icone="list"
            trailing={avance}
            onPress={() => router.push(ROUTES.STOCK_STRUCTURE)}
          />
          <ListRow
            title="Historique"
            icone="time"
            trailing={avance}
            onPress={() => router.push(ROUTES.stockHistorique())}
          />
          <ListRow
            title="Statistiques"
            icone="stats-chart"
            trailing={avance}
            onPress={() => router.push(ROUTES.STOCK_STATISTIQUES)}
          />
        </BlocLignes>
      )}

      <NomModal
        visible={ajoutOuvert}
        titre={ongletCourant.ajout ?? ''}
        onValider={ajouter}
        onAnnuler={() => setAjoutOuvert(false)}
      />

      <ArticleStockModal
        visible={prixOeufsOuvert}
        titre={T.oeufs.modifierLePrix}
        prix={prixDesOeufs(archive)}
        avecPrix
        libellePrix={T.oeufs.prixLabel}
        onValider={async (_nom, prix) => {
          await definirPrixArticle(CLE_PRIX_OEUFS, prix);
          setPrixOeufsOuvert(false);
          charger();
        }}
        onAnnuler={() => setPrixOeufsOuvert(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1, backgroundColor: colors.background },
  contenu: { padding: 16, gap: 12 },
  onglets: { gap: 8, paddingVertical: 4 },
  onglet: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ongletActif: { backgroundColor: colors.primary, borderColor: colors.primary },
  ongletTexte: { fontWeight: '600', color: colors.text },
  ongletTexteActif: { color: colors.blanc },
  entete: { backgroundColor: colors.badgeBg, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  enteteTexte: { fontWeight: '700', color: colors.primary },
  vide: { color: colors.textMuted, textAlign: 'center' },
  note: { color: colors.textMuted, fontSize: 13 },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  carteTexte: { flex: 1, gap: 2 },
  nom: { fontSize: 16, fontWeight: '700', color: colors.text },
  prix: { color: colors.textMuted },
  quantite: { fontSize: 16, fontWeight: '800', color: colors.text },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
