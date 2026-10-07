import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { AnimalVenduBilan, DateEtNombre } from '@/features/cheptel/services/bilanCheptel';
import { formatDateFR } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/cheptel/BilanAnnuel.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Lien « Voir plus / Voir moins » qui bascule l'état ouvert du détail d'une carte. */
export function useDetailsOuverts() {
  const [ouvert, setOuvert] = useState(false);
  return { ouvert, basculer: () => setOuvert((v) => !v) };
}

export function VoirPlus({ ouvert, onToggle }: { ouvert: boolean; onToggle: () => void }) {
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

/** Les animaux vendus sous une ligne : la date de la vente à gauche, l'animal (boucle, M ou F, naissance) à droite. */
export function AnimauxVendus({ animaux }: { animaux: AnimalVenduBilan[] }) {
  if (animaux.length === 0) return null;
  return (
    <View style={styles.datesAbattoir}>
      {animaux.map((a, i) => (
        <View key={`${a.date}:${i}`} style={styles.ligneDateAbattoir}>
          <Text style={commonStyles.caption}>{formatDateFR(a.date)}</Text>
          <Text style={styles.animalVendu}>{a.libelle}</Text>
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

/** En-tête d'une carte : titre à gauche, total (et total précédent) à droite. */
export function TitreCarte({
  titre,
  valeur,
  comparaison,
}: {
  titre: string;
  valeur: number;
  comparaison?: number;
}) {
  return (
    <View style={styles.titreLigne}>
      <Text style={commonStyles.cardTitle}>{titre}</Text>
      <View style={styles.ligneValeurs}>
        <Text style={styles.cardTitreValeur}>{valeur}</Text>
        {comparaison !== undefined && <Text style={commonStyles.muted}>({comparaison})</Text>}
      </View>
    </View>
  );
}
