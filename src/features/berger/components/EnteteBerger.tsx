import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.roles.berger;

interface Props {
  /** Le titre de la page, en grand. */
  titre: string;
  /** Une ligne sous le titre (ex : « Mon exploitation »). */
  sousTitre?: string;
  /** La flèche ronde, en haut à gauche : absente sur la page d'accueil. */
  onRetour?: () => void;
  /** Le nombre de saisies du mode normal qui attendent d'être envoyées (affiché en rouge sur la pastille). */
  aEnvoyer: number;
  /** Appuyer sur la pastille « Envoyer ». */
  onEnvoyer: () => void;
}

/** L'en-tête des pages du mode normal : une flèche ronde (si on peut revenir), le titre, et la pastille « Envoyer » avec son compteur. */
export function EnteteBerger({ titre, sousTitre, onRetour, aEnvoyer, onEnvoyer }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      {onRetour ? (
        <Pressable
          onPress={onRetour}
          accessibilityRole="button"
          accessibilityLabel={T.retour}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>{titre}</Text>
        {sousTitre ? <Text style={{ color: colors.textMuted }}>{sousTitre}</Text> : null}
      </View>
      <Pressable
        onPress={onEnvoyer}
        accessibilityRole="button"
        accessibilityLabel={T.envoyer}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: 999,
          borderWidth: 2,
          borderColor: colors.primary,
          backgroundColor: colors.surface,
          paddingHorizontal: 14,
          paddingVertical: 8,
        }}
      >
        <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
        {aEnvoyer > 0 ? (
          <View
            style={{
              minWidth: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: colors.danger,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 6,
            }}
          >
            <Text style={{ color: colors.blanc, fontWeight: '800', fontSize: 12 }}>{aEnvoyer}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}
