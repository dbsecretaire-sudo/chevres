import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { filDeLaPage, pageDuMenuRetenue } from '@/shared/navigation/filAriane';
import { useTitreDeLaPage } from '@/shared/navigation/titreDeLaPage';
import { usePositionDansLesMenus } from '@/shared/navigation/usePositionDansLesMenus';
import { colors } from '@/shared/theme/colors';

/**
 * Le fil d'Ariane du téléphone (« Atelier > Gestion > Réserver > Nouvelle commande »), juste au-dessus du bandeau du bas : chaque étape ramène à sa page, la dernière
 * est la page ouverte. Absent quand il n'y a qu'une étape (l'accueil, une page qu'aucun menu ne porte) : le titre de la page le dit déjà.
 */
export function FilDAriane() {
  const router = useRouter();
  const { menus, courante, adresse } = usePositionDansLesMenus();
  const titre = useTitreDeLaPage(adresse);
  const fil = filDeLaPage(menus, courante, pageDuMenuRetenue(), titre);
  if (fil.length < 2) return null;
  return (
    <View style={styles.fil}>
      <Text style={styles.texte}>
        {fil.map((maillon, i) => (
          <Text key={`${i}-${maillon.libelle}`}>
            {i > 0 ? <Text style={styles.separateur}>{'  ›  '}</Text> : null}
            {maillon.route ? (
              <Text style={styles.etape} onPress={() => router.navigate(maillon.route as never)} accessibilityRole="link">
                {maillon.libelle}
              </Text>
            ) : (
              <Text style={styles.courante}>{maillon.libelle}</Text>
            )}
          </Text>
        ))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fil: { paddingHorizontal: 14, paddingBottom: 8 },
  // Une interligne large : chaque étape est assez haute pour se toucher du pouce.
  texte: { fontSize: 13, lineHeight: 24 },
  etape: { color: colors.primaryDark, fontWeight: '600' },
  separateur: { color: colors.textMuted },
  courante: { color: colors.textMuted, fontWeight: '700' },
});
