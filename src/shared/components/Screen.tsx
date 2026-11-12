import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { styles } from '@/shared/styles/components/Screen.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colonneCentree } from '@/shared/theme/miseEnPage';
import { afficheTablette } from '@/shared/utils/affichage';

/**
 * Un écran. Dans les onglets, la barre du bas gère déjà le bord inférieur de l'écran (la barre de navigation d'Android) : y
 * ajouter sa marge laissait un vide au-dessus de la barre. `avecBordBas` la rétablit pour un écran hors des onglets.
 */
export function Screen({
  children,
  scroll = true,
  avecBordBas = false,
  transparent = false,
  margeBasse,
}: PropsWithChildren<{ scroll?: boolean; avecBordBas?: boolean; transparent?: boolean; margeBasse?: number }>) {
  // Transparent : l'écran laisse voir le panneau du cadre qui l'entoure (les pages de production en cadre de jeu).
  // Le poste de comptabilité : un formulaire garde la largeur d'une fiche (pas de champs étirés sur toute la fenêtre) ; les tableaux, eux, prennent toute la largeur.
  const comptable = useDispositionComptable();
  const fond = transparent ? { flex: 1, backgroundColor: 'transparent' } : commonStyles.screenBg;
  // La marge du bas (`margeBasse`) remplace celle de l'écran : un formulaire qui se termine sur ses boutons n'a pas besoin de tout ce vide.
  const marge = margeBasse === undefined ? undefined : { paddingBottom: margeBasse };
  return (
    <SafeAreaView style={fond} edges={avecBordBas ? ['bottom'] : []}>
      {scroll ? (
        <ScrollView
          style={fond}
          contentContainerStyle={[
            styles.content,
            comptable && { maxWidth: 820, width: '100%' },
            // Sur la tablette, le contenu prend la colonne élargie (la même que l'en-tête et le bandeau du bas).
            afficheTablette() && colonneCentree,
            marge,
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[fond, styles.content, marge]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
