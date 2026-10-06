import { Linking, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  telephone?: string;
  email?: string;
  /** Couleur des icônes et de leur fond (verte par défaut ; la bleue d'un champ d'ajout, par exemple). */
  couleur?: string;
  fond?: string;
}

/** Ouvre l'application du téléphone ou du courrier ; sans effet si l'appareil ne sait pas ouvrir le lien. */
const ouvrir = (lien: string) => Linking.openURL(lien).catch(() => undefined);

/**
 * Deux boutons pour joindre un client d'un geste : un combiné qui ouvre l'application Téléphone avec son numéro, une
 * enveloppe qui ouvre l'application de courrier avec son adresse. Chacun n'apparaît que si la fiche a l'information.
 */
export function BoutonsContact({ telephone, email, couleur = colors.primary, fond = colors.badgeBg }: Props) {
  const T = TEXTES.clients.contact;
  return (
    <>
      {telephone ? (
        <Pressable
          style={[commonStyles.boutonIcone, { backgroundColor: fond }]}
          onPress={() => ouvrir(`tel:${telephone.replace(/\s/g, '')}`)}
          accessibilityLabel={T.appeler}
        >
          <Ionicons name="call" size={20} color={couleur} />
        </Pressable>
      ) : null}
      {email ? (
        <Pressable
          style={[commonStyles.boutonIcone, { backgroundColor: fond }]}
          onPress={() => ouvrir(`mailto:${email.trim()}`)}
          accessibilityLabel={T.ecrire}
        >
          <Ionicons name="mail" size={20} color={couleur} />
        </Pressable>
      ) : null}
    </>
  );
}
