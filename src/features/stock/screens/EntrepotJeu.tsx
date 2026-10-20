import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RubriquesDeCartes } from '@/features/stock/components/CartesDuStock';
import { useEntrepot } from '@/features/stock/hooks/useEntrepot';
import { emojiDeLaCategorie, nombreEnStock } from '@/features/stock/services/entrepotJeu';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.lieux.entrepot;
/** De combien de points les flèches font défiler la grille. */
const PAS_DE_DEFILEMENT = 190;

/**
 * L'entrepôt, présenté comme l'inventaire d'un jeu de ferme : un cadre de bois, un onglet d'icône par catégorie du stock (35. Produits finis,
 * 33. Produits animaux, 31. Matières premières…), puis les rubriques de la catégorie comme dans le stock, chacune avec ses cartes et leur
 * quantité en dessous. Il lit le stock lui-même : tout changement du stock s'y retrouve, et chaque carte ouvre sa rubrique du stock.
 */
export default function EntrepotJeu() {
  const router = useRouter();
  const { categories, groupesParCategorie } = useEntrepot();
  const [onglet, setOnglet] = useState<string | null>(null);
  const defilement = useRef<ScrollView>(null);
  const position = useRef(0);

  const actuelle = categories.find((c) => c.categorie === onglet) ?? categories[0];
  const groupes = actuelle ? (groupesParCategorie.get(actuelle.categorie) ?? []) : [];
  const defiler = (pas: number) => {
    position.current = Math.max(0, position.current + pas);
    defilement.current?.scrollTo({ y: position.current, animated: true });
  };
  const choisir = (categorie: string) => {
    setOnglet(categorie);
    position.current = 0;
    defilement.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <View style={styles.fond}>
      <View style={styles.cadre}>
        <Pressable
          style={styles.fermer}
          onPress={() => router.replace('/')}
          accessibilityRole="button"
          accessibilityLabel={T.fermer}
        >
          <Ionicons name="close" size={30} color={colors.blanc} />
        </Pressable>
        <View style={styles.panneau}>
          <View style={styles.tetes}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.onglets}
              style={styles.ongletsDefile}
            >
              {categories.map((c) => {
                const actif = c.categorie === actuelle?.categorie;
                const enStock = nombreEnStock(groupesParCategorie.get(c.categorie) ?? []);
                return (
                  <Pressable
                    key={c.categorie}
                    style={[styles.onglet, actif ? styles.ongletActif : null]}
                    onPress={() => choisir(c.categorie)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: actif }}
                    accessibilityLabel={TEXTES.stock.enteteCategorie(c.classe, c.nom)}
                  >
                    <Text style={styles.ongletEmoji}>{emojiDeLaCategorie(c.categorie)}</Text>
                    {enStock > 0 ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeTexte}>{enStock}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
          {actuelle ? (
            <Text style={styles.titre} numberOfLines={1}>
              {TEXTES.stock.enteteCategorie(actuelle.classe, actuelle.nom)}
            </Text>
          ) : null}
          <View style={styles.corps}>
            <ScrollView
              ref={defilement}
              style={styles.defile}
              contentContainerStyle={styles.rubriques}
              showsVerticalScrollIndicator={false}
              onScroll={(e) => {
                position.current = e.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={64}
            >
              <RubriquesDeCartes groupes={groupes} />
            </ScrollView>
            <View style={styles.fleches}>
              <Pressable
                style={styles.fleche}
                onPress={() => defiler(-PAS_DE_DEFILEMENT)}
                accessibilityRole="button"
                accessibilityLabel="↑"
              >
                <Ionicons name="chevron-up" size={22} color={colors.blanc} />
              </Pressable>
              <View style={styles.piste}>
                <View style={styles.curseur} />
              </View>
              <Pressable
                style={styles.fleche}
                onPress={() => defiler(PAS_DE_DEFILEMENT)}
                accessibilityRole="button"
                accessibilityLabel="↓"
              >
                <Ionicons name="chevron-down" size={22} color={colors.blanc} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
      <Pressable
        style={styles.complet}
        onPress={() => router.push(ROUTES.COMPTABILITE_STOCKS as never)}
        accessibilityRole="button"
      >
        <Ionicons name="list" size={18} color={colors.blanc} />
        <Text style={styles.completTexte}>{T.stockComplet}</Text>
      </Pressable>
    </View>
  );
}

const BOIS = '#E8892B';
const BOIS_FONCE = '#B8641A';
const VERT = '#8DBA3F';

const styles = StyleSheet.create({
  fond: { flex: 1, backgroundColor: '#35541F', padding: 12, gap: 10 },
  cadre: {
    flex: 1,
    backgroundColor: BOIS,
    borderRadius: 26,
    borderWidth: 4,
    borderColor: BOIS_FONCE,
    padding: 10,
  },
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
  panneau: {
    flex: 1,
    backgroundColor: VERT,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: BOIS_FONCE,
    padding: 10,
    gap: 8,
  },
  tetes: { flexDirection: 'row', alignItems: 'center', paddingRight: 44 },
  ongletsDefile: { flexGrow: 0 },
  onglets: { gap: 8, paddingTop: 8, paddingRight: 8 },
  onglet: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F4DE9A',
    borderWidth: 3,
    borderColor: '#C98A2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ongletActif: { backgroundColor: '#6B3F1B', borderColor: '#3F230E' },
  ongletEmoji: { fontSize: 26 },
  badge: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 20,
    borderRadius: 10,
    backgroundColor: colors.danger,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.blanc,
  },
  badgeTexte: { color: colors.blanc, fontSize: 11, fontWeight: '800' },
  titre: { fontSize: 15, fontWeight: '900', color: '#4B2D0E', letterSpacing: 0.5 },
  corps: { flex: 1, flexDirection: 'row', gap: 8 },
  defile: { flex: 1 },
  rubriques: { gap: 14, paddingBottom: 10 },
  fleches: { width: 34, alignItems: 'center', justifyContent: 'space-between' },
  fleche: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#3F6B1E',
    borderWidth: 2,
    borderColor: '#2B4C13',
    alignItems: 'center',
    justifyContent: 'center',
  },
  piste: {
    flex: 1,
    width: 14,
    marginVertical: 6,
    borderRadius: 7,
    backgroundColor: '#3F6B1E',
    borderWidth: 2,
    borderColor: '#E8B13B',
    overflow: 'hidden',
  },
  curseur: { flex: 1, margin: 2, borderRadius: 4, backgroundColor: '#6FB52E' },
  complet: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6B3F1B',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#3F230E',
  },
  completTexte: { color: colors.blanc, fontSize: 14, fontWeight: '700' },
});
