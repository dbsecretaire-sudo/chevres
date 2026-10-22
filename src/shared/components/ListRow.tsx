import type { ReactNode } from 'react';
import { Image, Pressable, Text, View, type ImageSourcePropType } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDansBloc } from '@/shared/components/BlocListe';
import { afficheSobre } from '@/shared/utils/affichage';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/ListRow.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

interface Props {
  title: string;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  /** Un appui long (la ligne d'une liste qu'on réordonne) : il n'ouvre pas la ligne. */
  onLongPress?: () => void;
  onPressOut?: () => void;
  /** Texte du titre en gris (une ligne inactive). */
  grise?: boolean;
  /** Met la ligne en évidence (la réservation qu'on est venu voir). */
  surlignee?: boolean;
  /** La ligne dont l'écran est ouvert à côté (le menu de gauche de la version Windows) : elle est en couleur. */
  actif?: boolean;
  /** Une icône dans une pastille teintée à gauche, et une flèche à droite (les lignes d'un menu). */
  icone?: keyof typeof Ionicons.glyphMap;
  /** Un dessin (un emoji) dans la pastille à gauche, à la place de l'icône : le tiers que la ligne représente. */
  emoji?: string;
  /** Une image dans la pastille à gauche (la tête de l'animal), à la place de l'emoji. */
  image?: ImageSourcePropType;
  /** La couleur de fond de la pastille du dessin (le sexe et l'âge de l'animal). */
  fondPastille?: string;
}

export function ListRow({
  title,
  subtitle,
  trailing,
  onPress,
  onLongPress,
  onPressOut,
  grise,
  surlignee,
  actif,
  icone,
  emoji: emojiDemande,
  image: imageDemandee,
  fondPastille,
}: Props) {
  const dansBloc = useDansBloc();
  // L'affichage sobre n'a pas de dessin : ni image ni emoji dans la pastille (l'icône d'un menu reste).
  const sobre = afficheSobre();
  const emoji = sobre ? undefined : emojiDemande;
  const image = sobre ? undefined : imageDemandee;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressOut={onPressOut}
      style={({ pressed }) => [
        styles.rowCard,
        dansBloc && styles.rowDansBloc,
        surlignee && styles.rowSurlignee,
        actif && styles.rowActive,
        pressed && onPress ? commonStyles.pressed : null,
      ]}
    >
      {icone || emoji || image ? (
        <View style={[styles.pastille, fondPastille ? { backgroundColor: fondPastille } : null]}>
          {image ? (
            <Image
              source={image}
              style={styles.image}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          ) : emoji ? (
            <Text style={{ fontSize: 22 }}>{emoji}</Text>
          ) : icone ? (
            // L'alimentation s'écrit « nutrition » (la pomme d'Ionicons) : partout, elle se dessine en épi de maïs.
            icone === 'nutrition' ? (
              <MaterialCommunityIcons name="corn" size={24} color={colors.primary} />
            ) : (
              <Ionicons name={icone} size={22} color={colors.primary} />
            )
          ) : null}
        </View>
      ) : null}
      <View style={commonStyles.textWrap}>
        <Text style={[styles.rowTitle, grise && styles.rowTitleGris]}>{title}</Text>
        {subtitle ? <Text style={commonStyles.muted}>{subtitle}</Text> : null}
      </View>
      {trailing ??
        ((icone || emoji || image) && onPress ? (
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        ) : null)}
    </Pressable>
  );
}
