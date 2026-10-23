import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/shared/theme/colors';
import { BoutonDeBarre } from '@/shared/components/BoutonDeBarre';
import { BoutonPlat } from '@/shared/components/BoutonPlat';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { PastilleDeMenu } from '@/shared/components/PastilleDeMenu';
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
export function BoutonDidacticiel({ forme = 'puce' }: { forme?: 'puce' | 'barre' | 'pastille' | 'plat' }) {
  const router = useRouter();
  const accent = useAccentColor();
  const accentSoft = useAccentSoftColor();
  const { settings, patchSettings } = useAppSettings();
  const { demarrer } = useVisiteGuidee();
  const [menu, setMenu] = useState(false);
  const infos = settings.exploitation;
  const actif = !infos?.didacticielMasque;
  const poser = (afficher: boolean) => patchSettings({ exploitation: { ...infos, didacticielMasque: afficher ? undefined : true } });
  const libelle = actif ? T.titre : T.activer;
  const appuyer = () => {
    if (actif) setMenu(true);
    else {
      poser(true);
      demarrer();
    }
  };

  return (
    <>
      {forme === 'plat' ? (
        <BoutonPlat icone="book-outline" libelle={libelle} onPress={appuyer} />
      ) : forme === 'barre' ? (
        <BoutonDeBarre icone={<Ionicons name="book" size={26} color={colors.blanc} />} libelle={libelle} onPress={appuyer} />
      ) : forme === 'pastille' ? (
        <PastilleDeMenu libelle={libelle} onPress={appuyer} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={libelle}
          onPress={appuyer}
          style={[styles.bouton, { backgroundColor: accentSoft, borderColor: accent }]}
        >
          <Text style={[styles.texte, { color: accent }]}>{libelle}</Text>
        </Pressable>
      )}
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
