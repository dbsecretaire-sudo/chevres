import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { ATraiterEtablissement } from '@/features/a-traiter/components/ATraiterEtablissement';
import type { ATraiter } from '@/features/a-traiter/types';
import type { Etablissement } from '@/features/etablissements/repository';
import {
  iconeEtablissement,
  libelleTypesEtablissement,
} from '@/features/etablissements/utils/typesEtablissement';
import { styles } from '@/shared/styles/etablissements/SelecteurEtablissement.styles';
import { TEXTES } from '@/shared/textes';

interface Props {
  etablissement: Etablissement;
  /** Dernier établissement utilisé. */
  actif: boolean;
  onChoisir: () => void;
  onModifier: () => void;
  /** Ce qui attend dans cet établissement (le badge rouge du logo ; un appui sur le logo le déplie sous la ligne). */
  aTraiter: ATraiter[];
  ouvert: boolean;
  onBasculer: () => void;
  onOuvrirATraiter: (item: ATraiter) => void;
}

/**
 * Un établissement, sur une ligne : son logo, son nom et ses types ; un appui l'ouvre. Le crayon, discret, le modifie. Le
 * dernier utilisé a un contour vert.
 */
export function CarteEtablissement({
  etablissement,
  actif,
  onChoisir,
  onModifier,
  aTraiter,
  ouvert,
  onBasculer,
  onOuvrirATraiter,
}: Props) {
  const types = libelleTypesEtablissement(etablissement);

  return (
    <View>
      <Pressable
        style={({ pressed }) => [styles.ligne, actif && styles.ligneActive, pressed && styles.lignePressee]}
        onPress={onChoisir}
      >
        {aTraiter.length > 0 ? (
          <Pressable
            style={styles.logo}
            hitSlop={6}
            onPress={onBasculer}
            accessibilityLabel={TEXTES.aTraiter.logo(aTraiter.length)}
          >
            <Ionicons
              name={iconeEtablissement(etablissement) as keyof typeof Ionicons.glyphMap}
              size={26}
              color={colors.primary}
            />
            <View style={styles.badge}>
              <Text style={styles.badgeTexte}>{aTraiter.length}</Text>
            </View>
          </Pressable>
        ) : (
          <View style={styles.logo}>
            <Ionicons
              name={iconeEtablissement(etablissement) as keyof typeof Ionicons.glyphMap}
              size={26}
              color={colors.primary}
            />
          </View>
        )}
        <View style={styles.texte}>
          <Text style={styles.nom} numberOfLines={1}>
            {etablissement.nom}
          </Text>
          <Text style={styles.types} numberOfLines={1}>
            {types || TEXTES.etablissements.selecteurEtablissement.typeNonRenseigne}
          </Text>
        </View>
        <Pressable
          style={styles.crayon}
          hitSlop={10}
          onPress={onModifier}
          accessibilityLabel={TEXTES.etablissements.selecteurEtablissement.modifier}
        >
          <Ionicons name="create-outline" size={22} color={colors.textMuted} />
        </Pressable>
      </Pressable>
      {ouvert && aTraiter.length > 0 ? (
        <ATraiterEtablissement items={aTraiter} onOuvrir={onOuvrirATraiter} />
      ) : null}
    </View>
  );
}
