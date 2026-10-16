import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DateEtNombre } from '@/features/cheptel/services/bilanCheptel';
import { formatDateFR } from '@/shared/utils/dates';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/cheptel/BilanAnnuel.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { estBureau } from '@/shared/utils/plateforme';

/** Lien « Voir plus / Voir moins » qui bascule l'état ouvert du détail d'une carte. */
export function useDetailsOuverts() {
  // Sur ordinateur, le détail est toujours déroulé : il y a la place, et pas de « Voir plus ».
  const [ouvert, setOuvert] = useState(estBureau());
  return { ouvert, basculer: () => setOuvert((v) => !v) };
}

export function VoirPlus({ ouvert, onToggle }: { ouvert: boolean; onToggle: () => void }) {
  if (estBureau()) return null;
  return (
    <Pressable onPress={onToggle}>
      <Text style={styles.voirPlus}>
        {ouvert ? TEXTES.commun.general.voirMoins : TEXTES.commun.general.voirPlus}
      </Text>
    </Pressable>
  );
}

/** Liste les dates de sortie sous la ligne Abattoir, une par ligne, décalées et avec le nombre aligné à droite. */
export function DatesAbattoir({ dates }: { dates: DateEtNombre[] }) {
  if (dates.length === 0) return null;
  return (
    <View style={styles.datesAbattoir}>
      {dates.map((d) => (
        <View key={d.date} style={styles.ligneDateAbattoir}>
          <Text style={commonStyles.caption}>{formatDateFR(d.date)}</Text>
          <Text style={styles.dateAbattoirNombre}>{d.nombre}</Text>
        </View>
      ))}
    </View>
  );
}

/** Ligne libellé / valeur, avec la valeur de l'année précédente entre parenthèses. */
export function Ligne({
  label,
  valeur,
  comparaison,
}: {
  label: string;
  valeur: number;
  comparaison?: number;
}) {
  return (
    <View style={styles.ligne}>
      <Text style={styles.ligneLabel}>{label}</Text>
      <View style={styles.ligneValeurs}>
        <Text style={commonStyles.cardTitle}>{valeur}</Text>
        {comparaison !== undefined && <Text style={commonStyles.muted}>({comparaison})</Text>}
      </View>
    </View>
  );
}

/**
 * En-tête d'une carte : titre à gauche, total (et total précédent) à droite. Avec `onBasculer`, il déroule ou enroule la carte
 * (flèche à droite) ; sans, c'est un simple titre.
 */
export function TitreCarte({
  titre,
  valeur,
  comparaison,
  ouverte = false,
  onBasculer,
}: {
  titre: string;
  valeur?: number;
  comparaison?: number;
  ouverte?: boolean;
  onBasculer?: () => void;
}) {
  // Sur ordinateur, la carte est toujours déroulée : son titre n'est plus un bouton.
  if (estBureau()) onBasculer = undefined;
  const contenu = (
    <>
      <Text style={[commonStyles.cardTitle, styles.titreTexte]}>{titre}</Text>
      <View style={styles.ligneValeurs}>
        {valeur !== undefined ? <Text style={styles.cardTitreValeur}>{valeur}</Text> : null}
        {comparaison !== undefined && <Text style={commonStyles.muted}>({comparaison})</Text>}
        {onBasculer ? (
          <Ionicons name={ouverte ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        ) : null}
      </View>
    </>
  );
  return onBasculer ? (
    <Pressable
      style={styles.titreLigne}
      onPress={onBasculer}
      accessibilityLabel={ouverte ? TEXTES.commun.general.voirMoins : TEXTES.commun.general.voirPlus}
    >
      {contenu}
    </Pressable>
  ) : (
    <View style={styles.titreLigne}>{contenu}</View>
  );
}
