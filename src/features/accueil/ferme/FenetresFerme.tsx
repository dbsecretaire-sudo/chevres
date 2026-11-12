import { useEffect, useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';

import { BlocRappels } from '@/features/rappels/components/BlocRappels';
import { BlocSante } from '@/features/sante/components/BlocSante';


import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';


/**
 * La liste complète des rappels : la santé du troupeau, les déclarations à valider (la coche), les lots et les documents de circulation. Elle recouvre
 * l'écran : une ligne qui ouvre une autre page se ferait cacher par la feuille, qui se ferme donc dès que la page change.
 */
export function FeuilleRappels({ visible, onFermer }: { visible: boolean; onFermer: () => void }) {
  const chemin = usePathname();
  /** La page sur laquelle la feuille s'est ouverte. */
  const pageDOuverture = useRef(chemin);
  useEffect(() => {
    if (!visible) pageDOuverture.current = chemin;
    else if (chemin !== pageDOuverture.current) onFermer();
  }, [visible, chemin, onFermer]);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onFermer}>
      <View style={styles.feuille}>
        <View style={styles.entete}>
          <Text style={styles.titreFeuille}>{TEXTES.rappels.titre}</Text>
          <Pressable
            onPress={onFermer}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={TEXTES.commun.general.fermer}
          >
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.contenuFeuille}>
          <BlocSante />
          <BlocRappels />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  voile: {
    flex: 1,
    backgroundColor: colors.voile,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fenetre: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    gap: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  titre: { fontSize: 20, fontWeight: '800', color: colors.primaryDark },
  intro: { fontSize: 14, color: colors.textMuted },
  lignes: { alignSelf: 'stretch', gap: 6, marginVertical: 4 },
  ligne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.badgeBg,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  ligneLibelle: { fontSize: 15, fontWeight: '600', color: colors.text, flexShrink: 1 },
  ligneValeur: { fontSize: 15, fontWeight: '800', color: colors.primaryDark },
  voirTout: { fontSize: 14, color: colors.primary, textDecorationLine: 'underline' },
  boutons: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 4 },
  secondaire: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaireTexte: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  principal: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  principalTexte: { color: colors.blanc, fontWeight: '700', fontSize: 15 },
  feuille: { flex: 1, backgroundColor: colors.background, paddingTop: 16 },
  entete: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  titreFeuille: { fontSize: 20, fontWeight: '800', color: colors.primaryDark },
  contenuFeuille: { padding: 16, gap: 12 },
});
