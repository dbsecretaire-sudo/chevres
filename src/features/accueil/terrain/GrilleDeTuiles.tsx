import { Pressable, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { TuileTerrain } from '@/features/accueil/terrain/ecransTerrain';
import { styles } from '@/shared/styles/accueil/EcranTerrain.styles';
import { colors } from '@/shared/theme/colors';

/** Les grandes tuiles d'une zone : l'icône, le chiffre utile (rouge quand il y a quelque chose à faire), le titre. Un appui rend la tuile touchée. */
export function GrilleDeTuiles({ tuiles, onAppui }: { tuiles: TuileTerrain[]; onAppui: (tuile: TuileTerrain) => void }) {
  return (
    <View style={styles.grille}>
      {tuiles.map((t) => (
        <Pressable
          key={t.cle}
          onPress={() => onAppui(t)}
          accessibilityRole="button"
          accessibilityLabel={t.nombre ? `${t.titre} : ${t.nombre}` : t.titre}
          style={({ pressed }) => [styles.tuile, t.large ? styles.tuileLarge : null, pressed ? styles.tuileAppuyee : null]}
        >
          <View style={styles.haut}>
            {t.iconeMci ? (
              <MaterialCommunityIcons name={t.iconeMci} size={44} color={colors.primary} />
            ) : (
              <Ionicons name={t.icone} size={44} color={colors.primary} />
            )}
            {t.nombre ? <Text style={[styles.nombre, t.alerte ? styles.nombreAlerte : null]}>{t.nombre}</Text> : null}
          </View>
          <Text style={styles.titre} numberOfLines={2}>
            {t.titre}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
