import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { filDeLaPage, pageDuMenuRetenue } from '@/shared/navigation/filAriane';
import { useLibelleDuFil, useTitreDeLaPage } from '@/shared/navigation/titreDeLaPage';
import { usePositionDansLesMenus } from '@/shared/navigation/usePositionDansLesMenus';
import { colors } from '@/shared/theme/colors';
import { useEchelle } from '@/shared/theme/miseEnPage';

/**
 * Le fil d'Ariane du téléphone (« Atelier > Gestion > Réserver > Nouvelle commande »), juste au-dessus du bandeau du bas : chaque étape ramène à sa page, la dernière
 * est la page ouverte. Absent quand il n'y a qu'une étape (l'accueil, une page qu'aucun menu ne porte) : le titre de la page le dit déjà.
 */
export function FilDAriane() {
  const router = useRouter();
  const { menus, courante, adresse } = usePositionDansLesMenus();
  const titre = useTitreDeLaPage(adresse);
  const nomDeLaPage = useLibelleDuFil(adresse);
  const echelle = useEchelle();
  const fil = filDeLaPage(menus, courante, pageDuMenuRetenue(), nomDeLaPage || titre);
  if (fil.length < 2) return null;
  const taille = Math.round(16 * echelle);
  return (
    <View style={styles.fil}>
      <Text style={{ fontSize: taille, lineHeight: Math.round(taille * 2) }}>
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
  fil: { paddingHorizontal: 14, paddingBottom: 6 },
  // La taille et l'interligne se règlent dans le composant (ils suivent l'écran) : l'interligne large rend chaque étape assez haute pour se toucher du pouce.
  etape: { color: colors.primaryDark, fontWeight: '600' },
  separateur: { color: colors.textMuted },
  courante: { color: colors.textMuted, fontWeight: '700' },
});
