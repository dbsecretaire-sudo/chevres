import type { PropsWithChildren } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { texteDeBalance } from '@/features/comptabilite/services/balanceDesEcritures';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/GroupeAccueil.styles';

/**
 * Un groupe de l'accueil d'un onglet (Cheptel, Production, Comptabilité) : son titre en petites capitales, puis son bloc de lignes. `espace` : de la place autour du titre (au-dessus et en dessous).
 * `onBasculer` : le titre se replie et se déplie d'un appui ; le bloc n'est visible que si `ouvert` est vrai.
 */
export function GroupeAccueil({
  titre,
  balance,
  espace = false,
  ouvert = false,
  onBasculer,
  children,
}: PropsWithChildren<{ titre: string; balance?: number; espace?: boolean; ouvert?: boolean; onBasculer?: () => void }>) {
  // La balance des écritures du groupe, en chiffres seulement, sur la même ligne que le titre.
  const contenuTitre = (
    <>
      <Text style={styles.titre}>{titre}</Text>
      {balance !== undefined ? (
        <Text style={[styles.balance, { color: balance < 0 ? colors.danger : colors.text }]}>{texteDeBalance(balance)}</Text>
      ) : null}
      {onBasculer ? <Ionicons name={ouvert ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} /> : null}
    </>
  );
  return (
    <View style={[styles.groupe, espace && styles.groupeAere]}>
      {onBasculer ? (
        <Pressable
          onPress={onBasculer}
          accessibilityRole="button"
          accessibilityState={{ expanded: ouvert }}
          style={[styles.ligneTitre, espace && styles.titreAere]}
        >
          {contenuTitre}
        </Pressable>
      ) : (
        <View style={[styles.ligneTitre, espace && styles.titreAere]}>{contenuTitre}</View>
      )}
      {onBasculer && !ouvert ? null : children}
    </View>
  );
}
