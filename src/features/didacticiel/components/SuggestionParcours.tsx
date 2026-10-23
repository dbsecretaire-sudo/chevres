import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVisiteGuidee } from '@/features/didacticiel/context/VisiteGuidee';
import { parcoursDe } from '@/features/didacticiel/services/parcours';
import { afficheSobre } from '@/shared/utils/affichage';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useAccentColor, useAccentSoftColor } from '@/shared/theme/AccentColorContext';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.didacticiel.suggestion;

/**
 * Une suggestion du didacticiel, posée sur l'écran d'un cas du quotidien (vendre du fromage, de la charcuterie, un animal…) : elle
 * propose le parcours qui le suit pas à pas, et le lance d'un appui. Rien quand le didacticiel est désactivé (bouton de l'accueil) ou
 * quand une visite guidée est déjà en cours.
 */
export function SuggestionParcours({ parcoursId }: { parcoursId: string }) {
  const { settings } = useAppSettings();
  const visite = useVisiteGuidee();
  const accent = useAccentColor();
  const accentClair = useAccentSoftColor();
  const parcours = parcoursDe(parcoursId);
  // Le poste de comptabilité (affichage sobre) n'a pas de didacticiel : pas de « Besoin d'aide ? ».
  if (!parcours || settings.exploitation?.didacticielMasque || visite.actif || afficheSobre()) return null;
  return (
    <Pressable
      style={[styles.carte, { backgroundColor: accentClair, borderColor: accent }]}
      onPress={() => visite.demarrerParcours(parcoursId)}
      accessibilityRole="button"
      accessibilityLabel={`${T.titre} ${parcours.titre}`}
    >
      <Ionicons name="map-outline" size={24} color={accent} />
      <View style={styles.texte}>
        <Text style={[styles.titre, { color: accent }]}>{T.titre}</Text>
        <Text style={styles.parcours}>{parcours.titre}</Text>
      </View>
      <View style={[styles.bouton, { backgroundColor: accent }]}>
        <Text style={styles.boutonTexte}>{T.lancer}</Text>
        <Ionicons name="play" size={16} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  texte: { flex: 1 },
  titre: { fontSize: 12, fontWeight: '700' },
  parcours: { fontSize: 14, fontWeight: '700', color: '#2B2B2B' },
  bouton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  boutonTexte: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
