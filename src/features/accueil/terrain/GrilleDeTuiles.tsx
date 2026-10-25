import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { TuileTerrain } from '@/features/accueil/terrain/ecransTerrain';
import { TuileMaquette, type VarianteTuile } from '@/shared/components/TuileMaquette';
import { styles } from '@/shared/styles/accueil/EcranTerrain.styles';

/**
 * Les grandes tuiles d'une zone, comme sur la maquette : la présentation (« simple » au centre, « avance » en haut à gauche), la tuile principale
 * (remplie en vert, donnée par sa clé), le chiffre utile quand il y en a un. Un appui rend la tuile touchée.
 */
export function GrilleDeTuiles({
  tuiles,
  onAppui,
  variante = 'avance',
  principale,
}: {
  tuiles: TuileTerrain[];
  onAppui: (tuile: TuileTerrain) => void;
  variante?: VarianteTuile;
  /** La clé de la tuile principale de cet écran. */
  principale?: string;
}) {
  const taille = variante === 'simple' ? 30 : 32;
  return (
    <View style={styles.grille}>
      {tuiles.map((t) => (
        <TuileMaquette
          key={t.cle}
          libelle={t.titre}
          variante={variante}
          principale={t.cle === principale}
          large={t.large}
          nombre={t.nombre}
          alerte={t.alerte}
          icone={(couleur) =>
            t.iconeMci ? (
              <MaterialCommunityIcons name={t.iconeMci} size={taille} color={couleur} />
            ) : (
              <Ionicons name={t.icone} size={taille} color={couleur} />
            )
          }
          onPress={() => onAppui(t)}
        />
      ))}
    </View>
  );
}
