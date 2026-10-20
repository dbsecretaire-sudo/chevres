import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Carrelage } from '@/features/accueil/ferme/TransformationFerme';
import { RubriquesDeCartes } from '@/features/stock/components/CartesDuStock';
import { useEntrepot } from '@/features/stock/hooks/useEntrepot';
import { ROUTES } from '@/shared/constants/routes';
import { CATEGORIE_INVENTAIRE, SECTION_STOCK } from '@/shared/constants/stock';
import { noterOrigine } from '@/shared/navigation/origineRetour';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/**
 * L'intérieur de la transformation : la fromagerie et son sol carrelé, où l'on fabrique le fromage, découpe
 * la viande et prépare la charcuterie : tout ce qu'on y produit et garde, en cartes de jeu (les boutons des actions sont dans le panneau du bas,
 * `PanneauInterieur`) avec ce qu'il en reste : les produits finis (fromages, lait, charcuterie), les produits animaux (la viande), les
 * emballages (et leur conditionnement) et le matériel de la fromagerie (les immobilisations).
 */
export function TransformationInterieure() {
  const router = useRouter();
  const { categories, groupesParCategorie } = useEntrepot();
  // Les deux catégories de ce qu'on produit, et la rubrique des emballages (de la catégorie « Autres approvisionnements »).
  const categoriesMontrees = [CATEGORIE_INVENTAIRE.PRODUITS_FINIS, CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX]
    .map((cle) => categories.find((c) => c.categorie === cle))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);
  const emballages = categories
    .flatMap((c) => groupesParCategorie.get(c.categorie) ?? [])
    .filter((g) => g.cle === SECTION_STOCK.EMBALLAGES);
  // Les immobilisations de la fromagerie : le matériel (cuves, moules…), pas les bâtiments de l'exploitation.
  const immobilisations = categories.find((c) => c.categorie === CATEGORIE_INVENTAIRE.IMMOBILISATIONS);
  const materiel = (immobilisations ? (groupesParCategorie.get(immobilisations.categorie) ?? []) : []).filter(
    (g) => g.cle === SECTION_STOCK.EQUIPEMENT,
  );
  const origine = ROUTES.retourAccueil('transformation');
  const ouvrirConditionnement = () => {
    noterOrigine(origine, ROUTES.COMPTABILITE_CONDITIONNEMENT);
    router.push(ROUTES.COMPTABILITE_CONDITIONNEMENT as never);
  };
  return (
    <View style={styles.fond}>
      <Carrelage lignes={10} />
      <View style={styles.contenu}>
        {categoriesMontrees.map((c) => (
          <View key={c.categorie} style={styles.garde}>
            <Text style={styles.categorie}>{TEXTES.stock.enteteCategorie(c.classe, c.nom)}</Text>
            <RubriquesDeCartes groupes={groupesParCategorie.get(c.categorie) ?? []} clair origine={origine} />
          </View>
        ))}
        {emballages.length > 0 ? (
          <View style={styles.garde}>
            <RubriquesDeCartes groupes={emballages} clair origine={origine} />
            <Pressable
              style={styles.lien}
              onPress={ouvrirConditionnement}
              accessibilityRole="button"
              accessibilityLabel={TEXTES.production.lieux.emballages.liens.conditionnement.titre}
            >
              <Ionicons name="options" size={20} color={colors.primary} />
              <Text style={styles.lienTexte}>{TEXTES.production.lieux.emballages.liens.conditionnement.titre}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : null}
        {immobilisations && materiel.length > 0 ? (
          <View style={styles.garde}>
            <Text style={styles.categorie}>
              {TEXTES.stock.enteteCategorie(immobilisations.classe, immobilisations.nom)}
            </Text>
            <RubriquesDeCartes groupes={materiel} clair origine={origine} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { flexGrow: 1, backgroundColor: '#EBE8E1' },
  contenu: { padding: 8, gap: 10 },
  garde: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16, padding: 10, gap: 10 },
  categorie: { fontSize: 15, fontWeight: '800', color: '#3F2A0E' },
  // Un lien en bas des emballages : le réglage de ce que chaque fromage vendu consomme.
  lien: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.blanc,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  lienTexte: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
});
