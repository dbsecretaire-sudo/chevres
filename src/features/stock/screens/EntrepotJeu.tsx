import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Apparition } from '@/features/accueil/ferme/animations';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { laiterieActive } from '@/features/comptabilite/utils/recettes';
import { useNiveauxStock } from '@/features/stock/hooks/useNiveauxStock';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  carteDuLait,
  cartesDeLOnglet,
  formaterQuantite,
  nombreEnStock,
  ONGLETS_ENTREPOT,
  type CarteStock,
} from '@/features/stock/services/entrepotJeu';
import { articlesDuGenre, bilanLait, type ArticleAffiche } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { GENRE_ARTICLE } from '@/shared/constants/stock';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.lieux.entrepot;
/** De combien de points les flèches font défiler la grille. */
const PAS_DE_DEFILEMENT = 190;

/** Une carte du stock, comme une carte d'objet d'un jeu : son dessin, son nom, et en dessous une pastille avec ce qu'il en reste. */
function Carte({ carte, rang }: { carte: CarteStock; rang: number }) {
  const router = useRouter();
  const manque = carte.niveau < 0;
  return (
    <Apparition delai={rang * 35} style={styles.cellule}>
      <Pressable
        style={styles.carte}
        onPress={() => router.push(`${ROUTES.COMPTABILITE_STOCKS}?onglet=${carte.section}` as never)}
        accessibilityRole="button"
        accessibilityLabel={`${carte.titre} : ${formaterQuantite(carte.niveau)}${carte.unite ? ` ${carte.unite}` : ''}`}
      >
        <Text style={styles.dessin} accessibilityElementsHidden importantForAccessibility="no">
          {carte.emoji}
        </Text>
        <Text style={styles.nom} numberOfLines={2}>
          {carte.titre}
        </Text>
        <View style={[styles.pastille, manque ? styles.pastilleRouge : null, carte.niveau === 0 ? styles.pastilleVide : null]}>
          <View style={styles.piece}>
            <Ionicons name="cube" size={12} color="#7A5410" />
          </View>
          <Text style={styles.quantite}>
            {formaterQuantite(carte.niveau)}
            {carte.unite ? ` ${carte.unite}` : ''}
          </Text>
        </View>
      </Pressable>
    </Apparition>
  );
}

/**
 * L'entrepôt, présenté comme l'inventaire d'un jeu de ferme : un cadre de bois, des onglets d'icônes (ce qui se vend, les aliments, les
 * consommables, le matériel), une grille de cartes avec la quantité en dessous, des flèches pour défiler et une croix pour fermer. Chaque carte
 * ouvre la rubrique du stock qui la détaille.
 */
export default function EntrepotJeu() {
  const router = useRouter();
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  // Les litres de lait vendus : le bilan du lait en a besoin pour dire ce qu'il en reste.
  const [litresVendus, setLitresVendus] = useState(0);
  // Le niveau de chaque article, y compris les lignes qui suivent le cheptel (cabris, animal sur pied, animal vivant).
  const niveauxDuCheptel = useNiveauxStock();
  const [onglet, setOnglet] = useState<(typeof ONGLETS_ENTREPOT)[number]['cle']>('vente');
  const defilement = useRef<ScrollView>(null);
  const position = useRef(0);

  useFocusEffect(
    useCallback(() => {
      lireArchiveStock()
        .then(setArchive)
        .catch(() => undefined);
      listToutesVentes()
        .then((ventes) => setLitresVendus(ventes.filter((v) => v.categorie === CATEGORIE_VENTE.LAIT).reduce((total, v) => total + (v.quantite ?? 0), 0)))
        .catch(() => undefined);
    }, []),
  );

  // Les cartes de chaque onglet : les articles de l'espèce active, avec ce qu'il en reste d'après les mouvements du stock.
  const parOnglet = useMemo(() => {
    if (!archive) return null;
    // Le lait n'est pas un article : sa carte vient du bilan du lait, pour les espèces qui ont une laiterie.
    const lait = laiterieActive(espece) ? [carteDuLait(T.lait, bilanLait(archive, litresVendus).restant)] : [];
    const articles = new Map<(typeof GENRE_ARTICLE)[keyof typeof GENRE_ARTICLE], ArticleAffiche[]>();
    for (const genre of Object.values(GENRE_ARTICLE)) articles.set(genre, articlesDuGenre(genre, archive, espece));
    return new Map(ONGLETS_ENTREPOT.map((o) => [o.cle, cartesDeLOnglet(o, articles, niveauxDuCheptel, () => false, lait)]));
  }, [archive, espece, litresVendus, niveauxDuCheptel]);

  const cartes = parOnglet?.get(onglet) ?? [];
  const defiler = (pas: number) => {
    position.current = Math.max(0, position.current + pas);
    defilement.current?.scrollTo({ y: position.current, animated: true });
  };
  const choisir = (cle: (typeof ONGLETS_ENTREPOT)[number]['cle']) => {
    setOnglet(cle);
    position.current = 0;
    defilement.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <View style={styles.fond}>
      <View style={styles.cadre}>
        <Pressable style={styles.fermer} onPress={() => router.replace('/')} accessibilityRole="button" accessibilityLabel={T.fermer}>
          <Ionicons name="close" size={30} color={colors.blanc} />
        </Pressable>
        <View style={styles.panneau}>
          <View style={styles.tetes}>
            {ONGLETS_ENTREPOT.map((o) => {
              const actif = o.cle === onglet;
              const enStock = parOnglet ? nombreEnStock(parOnglet.get(o.cle) ?? []) : 0;
              return (
                <Pressable
                  key={o.cle}
                  style={[styles.onglet, actif ? styles.ongletActif : null]}
                  onPress={() => choisir(o.cle)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: actif }}
                  accessibilityLabel={T.onglets[o.cle]}
                >
                  <Text style={styles.ongletEmoji}>{o.emoji}</Text>
                  {enStock > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeTexte}>{enStock}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
            <Text style={styles.titre} numberOfLines={2}>
              {T.onglets[onglet]}
            </Text>
          </View>
          <View style={styles.corps}>
            <ScrollView
              ref={defilement}
              style={styles.defile}
              contentContainerStyle={styles.grille}
              showsVerticalScrollIndicator={false}
              onScroll={(e) => {
                position.current = e.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={64}
            >
              {cartes.map((c, i) => (
                <Carte key={c.cle} carte={c} rang={i} />
              ))}
              {parOnglet && cartes.length === 0 ? <Text style={styles.vide}>{T.vide}</Text> : null}
            </ScrollView>
            <View style={styles.fleches}>
              <Pressable style={styles.fleche} onPress={() => defiler(-PAS_DE_DEFILEMENT)} accessibilityRole="button" accessibilityLabel="↑">
                <Ionicons name="chevron-up" size={22} color={colors.blanc} />
              </Pressable>
              <View style={styles.piste}>
                <View style={styles.curseur} />
              </View>
              <Pressable style={styles.fleche} onPress={() => defiler(PAS_DE_DEFILEMENT)} accessibilityRole="button" accessibilityLabel="↓">
                <Ionicons name="chevron-down" size={22} color={colors.blanc} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
      <Pressable style={styles.complet} onPress={() => router.push(ROUTES.COMPTABILITE_STOCKS as never)} accessibilityRole="button">
        <Ionicons name="list" size={18} color={colors.blanc} />
        <Text style={styles.completTexte}>{T.stockComplet}</Text>
      </Pressable>
    </View>
  );
}

const BOIS = '#E8892B';
const BOIS_FONCE = '#B8641A';
const VERT = '#8DBA3F';
const PARCHEMIN = '#F4E7C8';

const styles = StyleSheet.create({
  fond: { flex: 1, backgroundColor: '#35541F', padding: 12, gap: 10 },
  cadre: { flex: 1, backgroundColor: BOIS, borderRadius: 26, borderWidth: 4, borderColor: BOIS_FONCE, padding: 10 },
  fermer: {
    position: 'absolute',
    top: -10,
    right: -6,
    zIndex: 5,
    width: 50,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E8602B',
    borderWidth: 3,
    borderColor: '#8E3A12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panneau: { flex: 1, backgroundColor: VERT, borderRadius: 18, borderWidth: 3, borderColor: BOIS_FONCE, padding: 10, gap: 10 },
  tetes: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 40 },
  onglet: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#F4DE9A', borderWidth: 3, borderColor: '#C98A2B', alignItems: 'center', justifyContent: 'center' },
  ongletActif: { backgroundColor: '#6B3F1B', borderColor: '#3F230E' },
  ongletEmoji: { fontSize: 26 },
  badge: { position: 'absolute', top: -7, right: -7, minWidth: 20, borderRadius: 10, backgroundColor: colors.danger, paddingHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: colors.blanc },
  badgeTexte: { color: colors.blanc, fontSize: 11, fontWeight: '800' },
  titre: { flex: 1, marginLeft: 6, fontSize: 16, fontWeight: '900', color: '#4B2D0E', letterSpacing: 1, textTransform: 'uppercase' },
  corps: { flex: 1, flexDirection: 'row', gap: 8 },
  defile: { flex: 1 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 10 },
  cellule: { width: '31%' },
  carte: { backgroundColor: PARCHEMIN, borderRadius: 8, borderWidth: 3, borderColor: '#9A6B3C', paddingTop: 8, alignItems: 'center', gap: 2, overflow: 'hidden' },
  dessin: { fontSize: 46 },
  nom: { fontSize: 12, fontWeight: '700', color: '#4B2D0E', textAlign: 'center', minHeight: 30, paddingHorizontal: 4 },
  pastille: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#5F9330', borderTopWidth: 3, borderTopColor: '#3F6B1E', paddingHorizontal: 8, paddingVertical: 4 },
  pastilleRouge: { backgroundColor: '#B8402A', borderTopColor: '#7E2616' },
  pastilleVide: { backgroundColor: '#8E9A7C', borderTopColor: '#6B7660' },
  piece: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F2C94C', borderWidth: 1, borderColor: '#B58B1A', alignItems: 'center', justifyContent: 'center' },
  quantite: { flex: 1, textAlign: 'right', color: colors.blanc, fontSize: 15, fontWeight: '900' },
  vide: { width: '100%', textAlign: 'center', color: '#2F4A1E', fontSize: 14, fontWeight: '700', paddingVertical: 30 },
  fleches: { width: 34, alignItems: 'center', justifyContent: 'space-between' },
  fleche: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#3F6B1E', borderWidth: 2, borderColor: '#2B4C13', alignItems: 'center', justifyContent: 'center' },
  piste: { flex: 1, width: 14, marginVertical: 6, borderRadius: 7, backgroundColor: '#3F6B1E', borderWidth: 2, borderColor: '#E8B13B', overflow: 'hidden' },
  curseur: { flex: 1, margin: 2, borderRadius: 4, backgroundColor: '#6FB52E' },
  complet: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#6B3F1B', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 2, borderColor: '#3F230E' },
  completTexte: { color: colors.blanc, fontSize: 14, fontWeight: '700' },
});
