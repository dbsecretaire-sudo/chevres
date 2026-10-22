import type { PropsWithChildren, ReactNode } from 'react';
import { Text, View } from 'react-native';
import { FondChampProvider } from '@/shared/theme/FondChampContext';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/SectionForm.styles';

interface Props {
  /** Le titre de la section (« Identité », « Filiation »…) : il dit à quoi servent les champs qu'elle regroupe. */
  titre?: string;
  /** Une phrase sous le titre, quand les champs ont besoin d'être situés. */
  aide?: string;
  /** Quelque chose à droite du titre, sur la même ligne (l'état d'un véhicule : actif ou inactif). */
  droite?: ReactNode;
}

/**
 * Une section de formulaire : une carte blanche, un titre, et les champs sur un fond teinté. Un formulaire en plusieurs sections
 * se lit d'un coup d'œil, au lieu d'une longue colonne de champs identiques.
 */
export function SectionForm({ titre, aide, droite, children }: PropsWithChildren<Props>) {
  return (
    <View style={styles.section}>
      {titre && droite ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.titre}>{titre}</Text>
          {droite}
        </View>
      ) : titre ? (
        <Text style={styles.titre}>{titre}</Text>
      ) : null}
      {aide ? <Text style={styles.aide}>{aide}</Text> : null}
      <FondChampProvider value={colors.champ}>
        <View style={styles.champs}>{children}</View>
      </FondChampProvider>
    </View>
  );
}
