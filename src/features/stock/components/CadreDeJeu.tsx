import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarreDeNavigation } from '@/features/stock/components/BarreDeNavigation';
import { BoutonPlat } from '@/shared/components/BoutonPlat';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/** Les couleurs communes de tous les stocks (la grange, le stock de l'atelier, les boucles, l'inventaire) : le bois, le beige parchemin et le brun. */
export const COULEURS_DU_STOCK = {
  bois: '#E8892B',
  boisFonce: '#B8641A',
  parchemin: '#FAF3E1',
  brun: '#4B2D0E',
  brunMoyen: '#6B3F1B',
  brunFonce: '#3F230E',
} as const;

/**
 * Le cadre de tous les stocks, le même partout : un cadre de bois sur le fond habituel de l'application, un panneau beige parchemin, la barre de navigation à droite (le
 * rail et ses deux flèches) et, sous le cadre, le bouton « Tout le stock » quand on n'est pas déjà sur tout le stock. `haut` (les onglets, le titre) se place au-dessus
 * de la liste, dans le panneau.
 */
export function CadreDeJeu({
  haut,
  children,
  onHaut,
  onBas,
  onFermer,
  onToutLeStock,
}: {
  haut?: ReactNode;
  children: ReactNode;
  /** Les flèches de la barre de navigation : sans elles, la barre n'y est pas (une page qui défile d'elle-même). */
  onHaut?: () => void;
  onBas?: () => void;
  /** Un bouton « fermer » en haut à droite du cadre (la grange). */
  onFermer?: () => void;
  /** Quand elle est donnée : le bouton « Tout le stock » sous le cadre. */
  onToutLeStock?: () => void;
}) {
  // Le poste de comptabilité : pas de cadre de jeu (ni bois, ni rail de flèches) — le contenu se pose à plat, et « Tout le stock » est un bouton comme les autres.
  const comptable = useDispositionComptable();
  if (comptable) {
    return (
      <View style={styles.plat}>
        {haut}
        <View style={styles.defile}>{children}</View>
        {onToutLeStock ? (
          <View style={styles.barrePlate}>
            <BoutonPlat icone="list" libelle={TEXTES.production.lieux.entrepot.stockComplet} onPress={onToutLeStock} />
          </View>
        ) : null}
      </View>
    );
  }
  return (
    <View style={styles.fond}>
      <View style={styles.cadre}>
        {onFermer ? (
          <Pressable
            style={styles.fermer}
            onPress={onFermer}
            accessibilityRole="button"
            accessibilityLabel={TEXTES.production.lieux.entrepot.fermer}
          >
            <Ionicons name="close" size={30} color={colors.blanc} />
          </Pressable>
        ) : null}
        <View style={styles.panneau}>
          {haut}
          <View style={styles.corps}>
            <View style={styles.defile}>{children}</View>
            {onHaut && onBas ? <BarreDeNavigation onHaut={onHaut} onBas={onBas} /> : null}
          </View>
        </View>
      </View>
      {onToutLeStock ? (
        <Pressable style={styles.complet} onPress={onToutLeStock} accessibilityRole="button">
          <Ionicons name="list" size={18} color={colors.blanc} />
          <Text style={styles.completTexte}>{TEXTES.production.lieux.entrepot.stockComplet}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  plat: { flex: 1 },
  barrePlate: { flexDirection: 'row', paddingVertical: 8 },
  fond: { flex: 1, backgroundColor: colors.background, padding: 8, gap: 8 },
  cadre: {
    flex: 1,
    backgroundColor: COULEURS_DU_STOCK.bois,
    borderRadius: 26,
    borderWidth: 4,
    borderColor: COULEURS_DU_STOCK.boisFonce,
    padding: 6,
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
    backgroundColor: COULEURS_DU_STOCK.parchemin,
    borderRadius: 16,
    padding: 6,
    gap: 8,
  },
  corps: { flex: 1, flexDirection: 'row' },
  defile: { flex: 1 },
  complet: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COULEURS_DU_STOCK.brunMoyen,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: COULEURS_DU_STOCK.brunFonce,
  },
  completTexte: { color: colors.blanc, fontSize: 14, fontWeight: '700' },
});
