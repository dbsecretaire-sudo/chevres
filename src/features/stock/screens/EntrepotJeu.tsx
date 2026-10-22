import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { RubriquesDeCartes } from '@/features/stock/components/CartesDuStock';
import { CadreDeJeu } from '@/features/stock/components/CadreDeJeu';
import { useEntrepot } from '@/features/stock/hooks/useEntrepot';
import { emojiDeLaCategorie, nombreEnStock } from '@/features/stock/services/entrepotJeu';
import { COMPTE_PAR_SECTION_INVENTAIRE } from '@/shared/constants/planComptable';
import { ROUTES } from '@/shared/constants/routes';
import { noterOrigine } from '@/shared/navigation/origineRetour';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/** De combien de points les flèches font défiler la grille. */
const PAS_DE_DEFILEMENT = 190;

/**
 * L'entrepôt, présenté comme l'inventaire d'un jeu de ferme : un cadre de bois, un onglet d'icône par catégorie du stock (35. Produits finis,
 * 33. Produits animaux, 31. Matières premières…), puis les rubriques de la catégorie comme dans le stock, chacune avec ses cartes et leur
 * quantité en dessous. Il lit le stock lui-même : tout changement du stock s'y retrouve, et chaque carte ouvre sa rubrique du stock.
 */
export default function EntrepotJeu({
  seulement,
  titre,
  sauf,
  sections,
  lieu,
  avecCompte,
  sansFermer,
}: {
  seulement?: string;
  titre?: string;
  /** Les rubriques du stock (leur section) qu'on ne montre pas : la grange n'a pas le stock de boucles. */
  sauf?: readonly string[];
  /** Seulement ces rubriques du stock (leur section), de toutes les catégories, dans cet ordre : le stock de boucles, le stock de l'atelier. Sans onglets. */
  sections?: readonly string[];
  /** La page où l'on est (le lieu) : la flèche de retour des pages qu'elle ouvre y ramène. */
  lieu?: string;
  /** Vrai : chaque rubrique porte en titre son compte du plan comptable (« 601100 Achats stockés — Aliments du bétail »). */
  avecCompte?: boolean;
  /** Vrai : l'entrepôt est dans une autre page (le stock de la page Boucles) : pas de croix rouge qui ferme tout. */
  sansFermer?: boolean;
}) {
  const router = useRouter();
  const { categories: toutes, groupesParCategorie } = useEntrepot();
  // La grange ne montre qu'une catégorie (les matières premières), sans onglets, sous son propre titre.
  // La page où l'on est : la grange ou l'entrepôt ; la flèche de retour des pages qu'elle ouvre y ramène.
  const origine = ROUTES.lieu(lieu ?? (seulement ? 'grange' : 'entrepot'));
  /** Une page sans onglets : une seule catégorie (la grange) ou des rubriques choisies. */
  const sansOnglets = !!seulement || !!sections;
  const categories = seulement ? toutes.filter((c) => c.categorie === seulement) : toutes;
  const [onglet, setOnglet] = useState<string | null>(null);
  const defilement = useRef<ScrollView>(null);
  const position = useRef(0);

  const actuelle = categories.find((c) => c.categorie === onglet) ?? categories[0];
  const groupesDeLaCategorie = sections
    ? sections.flatMap((s) =>
        toutes.flatMap((c) => groupesParCategorie.get(c.categorie) ?? []).filter((g) => g.cle === s),
      )
    : actuelle
      ? (groupesParCategorie.get(actuelle.categorie) ?? [])
      : [];
  const sansExclues = sauf
    ? groupesDeLaCategorie
        .map((g) => ({ ...g, cartes: g.cartes.filter((c) => !sauf.includes(c.section)) }))
        .filter((g) => g.cartes.length > 0)
    : groupesDeLaCategorie;
  // Le compte du plan comptable de la rubrique, en titre : « 601500 Boucles d'identification ».
  const groupes = avecCompte
    ? sansExclues.map((g) => {
        const compte = COMPTE_PAR_SECTION_INVENTAIRE[g.cle as keyof typeof COMPTE_PAR_SECTION_INVENTAIRE];
        return compte ? { ...g, titre: `${compte.numero} ${compte.libelle}` } : g;
      })
    : sansExclues;
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
    <CadreDeJeu
      onFermer={sansFermer ? undefined : () => router.replace('/')}
      onHaut={() => defiler(-PAS_DE_DEFILEMENT)}
      onBas={() => defiler(PAS_DE_DEFILEMENT)}
      onToutLeStock={() => {
        noterOrigine(origine, ROUTES.COMPTABILITE_STOCKS);
        router.push(ROUTES.COMPTABILITE_STOCKS as never);
      }}
      haut={
        <>
          {sansOnglets ? null : (
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
          )}
          {actuelle || sections ? (
            <Text style={[styles.titre, sansOnglets ? { paddingRight: 44 } : null]} numberOfLines={1}>
              {titre ?? (actuelle ? TEXTES.stock.enteteCategorie(actuelle.classe, actuelle.nom) : '')}
            </Text>
          ) : null}
        </>
      }
    >
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
        <RubriquesDeCartes groupes={groupes} origine={origine} />
      </ScrollView>
    </CadreDeJeu>
  );
}

const styles = StyleSheet.create({
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
  defile: { flex: 1 },
  rubriques: { gap: 14, paddingBottom: 10 },
});
