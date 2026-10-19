import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/shared/theme/colors';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { useVisiteGuidee } from '@/features/didacticiel/context/VisiteGuidee';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useAccentColor, useAccentSoftColor } from '@/shared/theme/AccentColorContext';
import { ROUTES } from '@/shared/constants/routes';
import { styles } from '@/shared/styles/didacticiel/BoutonDidacticiel.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.didacticiel;

/**
 * Le didacticiel en haut à droite de l'accueil (propre à chaque établissement). Désactivé, un bouton « Activer le didacticiel » l'allume et
 * lance la visite guidée ; activé, le bouton ouvre un petit menu : visite guidée, liste des options, ou désactiver.
 */
export function BoutonDidacticiel({ rond = false }: { rond?: boolean }) {
  const router = useRouter();
  const accent = useAccentColor();
  const accentSoft = useAccentSoftColor();
  const { settings, patchSettings } = useAppSettings();
  const { demarrer } = useVisiteGuidee();
  const [menu, setMenu] = useState(false);
  const infos = settings.exploitation;
  const actif = !infos?.didacticielMasque;
  const poser = (afficher: boolean) => patchSettings({ exploitation: { ...infos, didacticielMasque: afficher ? undefined : true } });

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actif ? T.titre : T.activer}
        onPress={() => {
          if (actif) setMenu(true);
          else {
            poser(true);
            demarrer();
          }
        }}
        style={rond ? stylesRond.element : [styles.bouton, { backgroundColor: accentSoft, borderColor: accent }]}
      >
        {rond ? (
          <>
            <View style={stylesRond.rond}>
              <Ionicons name="book" size={26} color={colors.blanc} />
            </View>
            <Text style={stylesRond.libelle} numberOfLines={2}>
              {actif ? T.titre : T.activer}
            </Text>
          </>
        ) : (
          <Text style={[styles.texte, { color: accent }]}>{actif ? T.titre : T.activer}</Text>
        )}
      </Pressable>
      <OptionsModal
        visible={menu}
        onClose={() => setMenu(false)}
        title={T.titre}
        options={[
          { label: T.commencer, icon: 'play-circle-outline', onPress: demarrer },
          { label: T.parcourir, icon: 'list-outline', onPress: () => router.push(ROUTES.DIDACTICIEL as never) },
          { label: T.desactiver, icon: 'eye-off-outline', onPress: () => poser(false) },
        ]}
      />
    </>
  );
}

/** Le bouton rond de l'accueil « ferme », comme les autres boutons flottants. */
const stylesRond = StyleSheet.create({
  element: { alignItems: 'center', gap: 2, width: 72 },
  rond: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.blanc, alignItems: 'center', justifyContent: 'center' },
  libelle: { fontSize: 11, color: colors.text, textAlign: 'center', fontWeight: '600' },
});
