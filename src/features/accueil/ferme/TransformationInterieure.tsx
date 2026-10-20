import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColonneFerme, type AncreBouton, type EntreeDeColonne } from '@/features/accueil/ferme/ColonneFerme';
import { Carrelage } from '@/features/accueil/ferme/TransformationFerme';
import { RubriquesDeCartes } from '@/features/stock/components/CartesDuStock';
import { useEntrepot } from '@/features/stock/hooks/useEntrepot';
import { CATEGORIE_INVENTAIRE, SECTION_STOCK } from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme.transformation;

interface Props {
  onSortir: () => void;
  /** Les boutons de la transformation (fromagerie, viande, charcuterie, stock) et ce que fait un appui sur l'un d'eux. */
  boutons: readonly EntreeDeColonne[];
  onAppuiBouton: (cle: string, ancre: AncreBouton) => void;
}

/**
 * L'intérieur de la transformation : le sol carrelé, où l'on fabrique le fromage, découpe la viande et prépare la charcuterie. En haut, les
 * boutons des actions (fabriquer, lots, rappels, qualité du lait, réserver) ; dessous, tout ce qu'on y produit et garde, en cartes de jeu
 * avec ce qu'il en reste : les produits finis (fromages, lait, charcuterie), les produits animaux (la viande) et les emballages. Un autre
 * décor que celui de la chèvrerie.
 */
export function TransformationInterieure({ onSortir, boutons, onAppuiBouton }: Props) {
  const { categories, groupesParCategorie } = useEntrepot();
  // Les deux catégories de ce qu'on produit, et la rubrique des emballages (de la catégorie « Autres approvisionnements »).
  const categoriesMontrees = [CATEGORIE_INVENTAIRE.PRODUITS_FINIS, CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX]
    .map((cle) => categories.find((c) => c.categorie === cle))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);
  const emballages = categories
    .flatMap((c) => groupesParCategorie.get(c.categorie) ?? [])
    .filter((g) => g.cle === SECTION_STOCK.EMBALLAGES);
  return (
    <View style={styles.fond}>
      <Carrelage lignes={10} />
      <View style={styles.contenu}>
        <View style={styles.tete}>
          <Pressable
            style={styles.sortir}
            onPress={onSortir}
            accessibilityRole="button"
            accessibilityLabel={TEXTES.accueil.ferme.chevrerie.sortir}
          >
            <Text style={styles.sortirEmoji}>🚪</Text>
            <Text style={styles.sortirTexte}>{TEXTES.accueil.ferme.chevrerie.sortir}</Text>
          </Pressable>
          <Text style={styles.titre}>{T.titre}</Text>
        </View>
        <View style={styles.boutons}>
          <ColonneFerme entrees={boutons} onAppui={onAppuiBouton} grille compacte />
        </View>
        {categoriesMontrees.map((c) => (
          <View key={c.categorie} style={styles.garde}>
            <Text style={styles.categorie}>{TEXTES.stock.enteteCategorie(c.classe, c.nom)}</Text>
            <RubriquesDeCartes groupes={groupesParCategorie.get(c.categorie) ?? []} clair />
          </View>
        ))}
        {emballages.length > 0 ? (
          <View style={styles.garde}>
            <RubriquesDeCartes groupes={emballages} clair />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { flexGrow: 1, backgroundColor: '#EBE8E1' },
  contenu: { padding: 8, gap: 10 },
  tete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sortir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.blanc,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#A9794A',
  },
  sortirEmoji: { fontSize: 20 },
  sortirTexte: { fontSize: 13, fontWeight: '700', color: colors.text },
  titre: { fontSize: 16, fontWeight: '700', color: '#1F1F1F' },
  boutons: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16, padding: 6 },
  garde: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16, padding: 10, gap: 10 },
  categorie: { fontSize: 15, fontWeight: '800', color: '#3F2A0E' },
});
