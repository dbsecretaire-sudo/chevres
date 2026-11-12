import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/shared/theme/colors';

/**
 * Deux présentations de la maquette. « simple » : la pastille vert pâle au centre, le titre centré (les écrans du mode normal).
 * « avance » : l'icône en haut à gauche, le titre en bas à gauche, le chiffre en haut à droite (les écrans du mode avancé).
 */
export type VarianteTuile = 'simple' | 'avance';

interface Props {
  libelle: string;
  /** Le dessin, dans la couleur donnée (vert sur blanc, blanc sur la tuile principale). */
  icone: (couleur: string) => ReactNode;
  onPress: () => void;
  variante?: VarianteTuile;
  /** La tuile principale (Scanner, Nouvelle visite, Fabriquer selon l'écran) : remplie en vert, comme sur la maquette. */
  principale?: boolean;
  /** Un chiffre utile : rouge quand il y a quelque chose à faire. */
  nombre?: number;
  alerte?: boolean;
  /** Une ligne sous le titre (« 3 saisies en attente », « 236 chèvres »). */
  detail?: string;
  /** Rien à faire pour le moment : la tuile est grisée et ne réagit pas. */
  desactive?: boolean;
  /** La tuile prend toute la largeur. */
  large?: boolean;
  /** Une hauteur imposée (l'écran qui remplit la place restante) ; sans elle, la tuile garde sa hauteur minimale. */
  hauteur?: number;
  /** Une grande pastille et un grand titre (présentation « simple ») : pour une page de peu de tuiles, qui doit se voir de loin. */
  grande?: boolean;
}

/** Une tuile de la maquette, sous l'une des deux présentations. Elle est accessible au doigt, sans être un gros bouton plein. */
export function TuileMaquette({
  libelle,
  icone,
  onPress,
  variante = 'avance',
  principale = false,
  nombre,
  alerte = false,
  detail,
  desactive = false,
  large = false,
  hauteur,
  grande = false,
}: Props) {
  const simple = variante === 'simple';
  const couleurIcone = principale ? colors.blanc : colors.primary;
  const couleurTexte = principale ? colors.blanc : colors.text;
  const couleurDetail = principale ? colors.blanc : colors.textMuted;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={nombre ? `${libelle} : ${nombre}` : libelle}
      accessibilityState={{ disabled: desactive }}
      disabled={desactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.carte,
        simple ? styles.carteSimple : styles.carteAvance,
        large ? styles.large : styles.demi,
        hauteur !== undefined ? { height: hauteur } : null,
        principale ? styles.principale : null,
        pressed ? styles.appuyee : null,
        desactive ? styles.desactivee : null,
      ]}
    >
      {simple ? (
        <View style={[styles.pastille, principale ? styles.pastillePrincipale : null, grande ? styles.pastilleGrande : null]}>
          {icone(couleurIcone)}
        </View>
      ) : (
        <View style={styles.hautAvance}>
          {icone(couleurIcone)}
          {nombre ? (
            <Text style={[styles.nombre, alerte ? styles.nombreAlerte : null, principale ? styles.blanc : null]}>{nombre}</Text>
          ) : null}
        </View>
      )}
      <View style={simple ? styles.basSimple : styles.basAvance}>
        <Text style={[styles.titre, simple ? styles.centre : null, grande ? styles.titreGrand : null, { color: couleurTexte }]}>{libelle}</Text>
        {simple && nombre ? (
          <Text style={[styles.nombreSimple, alerte ? styles.nombreAlerte : null, principale ? styles.blanc : null]}>{nombre}</Text>
        ) : null}
        {detail ? <Text style={[styles.detail, simple ? styles.centre : null, { color: couleurDetail }]}>{detail}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {
    minHeight: 150,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  demi: { width: '48%' },
  large: { width: '100%' },
  carteSimple: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 18 },
  carteAvance: { justifyContent: 'space-between' },
  principale: { backgroundColor: colors.primary, borderColor: colors.primary },
  appuyee: { opacity: 0.85 },
  desactivee: { opacity: 0.4 },
  pastille: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.badgeBg, alignItems: 'center', justifyContent: 'center' },
  pastillePrincipale: { backgroundColor: 'rgba(255,255,255,0.2)' },
  pastilleGrande: { width: 96, height: 96, borderRadius: 48 },
  hautAvance: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  basSimple: { alignItems: 'center', gap: 2 },
  basAvance: { gap: 2 },
  titre: { fontSize: 16, fontWeight: '700' },
  titreGrand: { fontSize: 20 },
  centre: { textAlign: 'center' },
  detail: { fontSize: 13 },
  nombre: { fontSize: 22, fontWeight: '800', color: colors.primary },
  nombreSimple: { fontSize: 14, fontWeight: '700', color: colors.primary },
  nombreAlerte: { color: colors.danger },
  blanc: { color: colors.blanc },
});
