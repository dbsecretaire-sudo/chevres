import { StyleSheet, Text, View } from 'react-native';
import { Carrelage } from '@/features/accueil/ferme/TransformationFerme';
import { RubriquesDeCartes } from '@/features/stock/components/CartesDuStock';
import { useEntrepot } from '@/features/stock/hooks/useEntrepot';
import { ROUTES } from '@/shared/constants/routes';
import { CATEGORIE_INVENTAIRE, SECTION_STOCK } from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/**
 * L'intérieur de la transformation : le sol carrelé, où l'on fabrique le fromage, découpe la viande et prépare la charcuterie : tout ce qu'on y
 * produit et garde, en cartes de jeu (les boutons des actions sont dans le panneau du bas, `PanneauInterieur`)
 * avec ce qu'il en reste : les produits finis (fromages, lait, charcuterie), les produits animaux (la viande) et les emballages. Un autre
 * décor que celui de la chèvrerie.
 */
export function TransformationInterieure() {
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
        {categoriesMontrees.map((c) => (
          <View key={c.categorie} style={styles.garde}>
            <Text style={styles.categorie}>{TEXTES.stock.enteteCategorie(c.classe, c.nom)}</Text>
            <RubriquesDeCartes
              groupes={groupesParCategorie.get(c.categorie) ?? []}
              clair
              origine={ROUTES.retourAccueil('transformation')}
            />
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
  garde: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16, padding: 10, gap: 10 },
  categorie: { fontSize: 15, fontWeight: '800', color: '#3F2A0E' },
});
