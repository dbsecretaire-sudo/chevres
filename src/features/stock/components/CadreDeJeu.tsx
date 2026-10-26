import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BoutonPlat } from '@/shared/components/BoutonPlat';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { useRole } from '@/features/roles/context/RoleContext';
import { ROLE } from '@/shared/constants/roles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/**
 * Le cadre de tous les stocks, le même partout, comme sur la maquette du stock : un fond clair, les onglets et le titre au-dessus de la liste,
 * puis les rubriques en cartes blanches, et le bouton « Tout le stock » sous la liste quand on n'est pas déjà sur tout le stock. `haut` (les onglets,
 * le titre) se place au-dessus de la liste.
 */
export function CadreDeJeu({
  haut,
  children,
  onToutLeStock,
}: {
  haut?: ReactNode;
  children: ReactNode;
  /** Quand elle est donnée : le bouton « Tout le stock » sous la liste. */
  onToutLeStock?: () => void;
}) {
  // Le poste de comptabilité : le contenu se pose à plat, et « Tout le stock » est un bouton comme les autres.
  const comptable = useDispositionComptable();
  // Le mode normal n'a pas le stock complet : pas de bouton « Tout le stock ».
  const { role } = useRole();
  const toutLeStock = role === ROLE.BERGER ? undefined : onToutLeStock;
  if (comptable) {
    return (
      <View style={styles.plat}>
        {haut}
        <View style={styles.defile}>{children}</View>
        {toutLeStock ? (
          <View style={styles.barrePlate}>
            <BoutonPlat icone="list" libelle={TEXTES.production.lieux.entrepot.stockComplet} onPress={toutLeStock} />
          </View>
        ) : null}
      </View>
    );
  }
  return (
    <View style={styles.fond}>
      {haut}
      <View style={styles.defile}>{children}</View>
      {toutLeStock ? (
        <Pressable style={styles.complet} onPress={toutLeStock} accessibilityRole="button">
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
  fond: { flex: 1, backgroundColor: colors.background, padding: 16, gap: 12 },
  defile: { flex: 1 },
  complet: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  completTexte: { color: colors.blanc, fontSize: 14, fontWeight: '700' },
});
