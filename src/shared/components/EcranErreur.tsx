import { useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.erreurEcran;

/** Ce que dit l'erreur : son message, puis le début de sa trace (de quoi retrouver l'écran et la ligne qui ont planté). */
const texteDeLErreur = (error: Error): string =>
  [error.message, ...(error.stack ?? '').split('\n').slice(0, 12)].filter(Boolean).join('\n');

/**
 * L'écran qui remplace un écran planté (voir ErrorBoundary de expo-router) : le message de l'erreur, à recopier, et de quoi réessayer ou
 * revenir à l'accueil. Sans lui, l'application montre une page blanche.
 */
export function EcranErreur({ error, retry }: { error: Error; retry: () => void }) {
  const router = useRouter();
  const [copie, setCopie] = useState(false);
  const texte = texteDeLErreur(error);
  return (
    <ScrollView contentContainerStyle={[commonStyles.gap10, { padding: 20 }]}>
      <Text style={commonStyles.cardTitle}>{T.titre}</Text>
      <Text style={commonStyles.note}>{T.aide}</Text>
      <View style={commonStyles.gap8}>
        <Text
          selectable
          style={[commonStyles.note, { fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }]}
        >
          {texte}
        </Text>
      </View>
      <Button
        variant="secondary"
        label={copie ? T.copie : T.copier}
        onPress={() => {
          if (typeof navigator !== 'undefined' && navigator.clipboard)
            navigator.clipboard
              .writeText(texte)
              .then(() => setCopie(true))
              .catch(() => undefined);
        }}
      />
      <Button label={T.reessayer} onPress={retry} />
      <Button
        variant="secondary"
        label={T.accueil}
        onPress={() => {
          retry();
          router.replace('/');
        }}
      />
    </ScrollView>
  );
}
