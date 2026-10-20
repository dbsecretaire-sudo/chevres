import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PastilleAlerte } from '@/shared/components/PastilleAlerte';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/SectionDeroulante.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { estBureau } from '@/shared/utils/plateforme';

interface Props {
  titre: string;
  /** Le nombre d'éléments qu'elle contient, affiché à côté du titre. */
  nombre?: number;
  ouverte: boolean;
  onBasculer: () => void;
  /** Vrai quand quelque chose, dans la section, demande l'attention : une pastille rouge « ! » s'affiche sur son titre. */
  alerte?: boolean;
  /** Vrai : même sur ordinateur, la section reste enroulée tant qu'on ne l'ouvre pas (une longue liste de catégories, dont une seule se lit à la fois). */
  accordeon?: boolean;
  children: ReactNode;
}

/** Une section qui se déroule d'un appui sur son titre : plusieurs peuvent être ouvertes en même temps. */
export function SectionDeroulante({
  titre,
  nombre,
  ouverte,
  onBasculer,
  alerte,
  accordeon = false,
  children,
}: Props) {
  // Sur ordinateur, toutes les sections sont déroulées (il y a la place), sauf en accordéon : une seule se lit à la fois.
  const toujoursDeplie = estBureau() && !accordeon;
  const deplie = toujoursDeplie || ouverte;
  return (
    <View style={[commonStyles.gap10, deplie && styles.panneau]}>
      <Pressable style={[styles.entete, deplie && styles.enteteOuverte]} onPress={onBasculer}>
        <Text style={styles.titre}>
          {titre}
          {nombre !== undefined ? ` (${nombre})` : ''}
        </Text>
        {alerte ? <PastilleAlerte /> : null}
        {toujoursDeplie ? null : (
          <Ionicons name={ouverte ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
        )}
      </Pressable>
      {deplie ? children : null}
    </View>
  );
}
