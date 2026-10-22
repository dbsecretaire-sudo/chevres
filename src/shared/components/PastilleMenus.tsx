import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMenusSections } from '@/shared/navigation/menusSections';
import { colors } from '@/shared/theme/colors';
import { useEchelle } from '@/shared/theme/miseEnPage';
import { TEXTES } from '@/shared/textes';

/**
 * La pastille « Menus » de la capsule du haut : un appui déroule, juste dessous, les rubriques de l'application (Cheptel, Production,
 * Commercial, Comptabilité, Organisation), à la place de l'ancienne barre d'onglets du bas. La rubrique ouverte est en évidence.
 */
export function PastilleMenus({ compact = false }: { compact?: boolean }) {
  const entrees = useMenusSections();
  const echelle = useEchelle();
  const ref = useRef<View>(null);
  const { width: largeurFenetre } = useWindowDimensions();
  // La liste se pose sous la pastille, alignée sur son bord droit (la colonne est centrée dans une grande fenêtre).
  const [liste, setListe] = useState<{ haut: number; droite: number } | null>(null);
  const ouvrir = () =>
    ref.current?.measureInWindow((x, y, largeur, hauteur) =>
      setListe({ haut: y + hauteur + 6, droite: Math.max(8, largeurFenetre - (x + largeur)) }),
    );
  return (
    <>
      <Pressable
        ref={ref}
        collapsable={false}
        style={({ pressed }) => [
          styles.pastille,
          { paddingVertical: Math.round(10 * echelle) },
          compact && styles.burger,
          pressed && styles.appuyee,
        ]}
        onPress={ouvrir}
        accessibilityRole="button"
        accessibilityLabel={TEXTES.navigation.menus}
      >
        {compact ? (
          // Capsule trop large pour l'écran : « Menus » devient un menu burger, sans flèche.
          <Ionicons name="menu" size={Math.round(22 * echelle)} color={colors.text} />
        ) : (
          <>
            <Text style={[styles.texte, { fontSize: Math.round(14 * echelle) }]} numberOfLines={1}>
              {TEXTES.navigation.menus}
            </Text>
            <Ionicons name="chevron-down" size={Math.round(14 * echelle)} color={colors.text} />
          </>
        )}
      </Pressable>
      <Modal visible={liste !== null} transparent animationType="fade" onRequestClose={() => setListe(null)}>
        <Pressable style={styles.fond} onPress={() => setListe(null)} accessibilityLabel={TEXTES.commun.general.fermer}>
          <View style={[styles.liste, { top: liste?.haut ?? 0, right: liste?.droite ?? 12 }]}>
            {entrees.map((e) => (
              <Pressable
                key={e.cle}
                style={({ pressed }) => [styles.entree, pressed && styles.appuyee]}
                onPress={() => {
                  setListe(null);
                  e.onPress();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: e.actif }}
              >
                <Text style={[styles.entreeTexte, e.actif ? styles.entreeActive : null]}>{e.libelle}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Elle prend sa place dans la capsule, comme les autres pastilles : la largeur de son mot, et sa part du reste.
  pastille: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.blanc,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  // Le burger : une pastille ronde, de la largeur de son icône.
  burger: { flexGrow: 0, paddingHorizontal: 12 },
  appuyee: { opacity: 0.8 },
  texte: { color: colors.text, fontSize: 14, fontWeight: '700' },
  fond: { flex: 1 },
  liste: {
    position: 'absolute',
    minWidth: 190,
    backgroundColor: colors.blanc,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  entree: { paddingHorizontal: 18, paddingVertical: 12 },
  entreeTexte: { fontSize: 16, fontWeight: '600', color: colors.text },
  entreeActive: { color: colors.primary, fontWeight: '800' },
});
