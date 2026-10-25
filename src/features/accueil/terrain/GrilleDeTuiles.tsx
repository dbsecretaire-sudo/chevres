import { useState } from 'react';
import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { TuileTerrain } from '@/features/accueil/terrain/ecransTerrain';
import { TuileMaquette, type VarianteTuile } from '@/shared/components/TuileMaquette';
import { styles } from '@/shared/styles/accueil/EcranTerrain.styles';

/** L'espace entre deux lignes de tuiles (le même que la grille). */
const ESPACE = 12;
/** En dessous, une tuile devient trop petite pour être touchée avec des gants. */
const HAUTEUR_MIN = 110;

/**
 * Les grandes tuiles d'une zone, comme sur la maquette : la présentation (« simple » au centre, « avance » en haut à gauche), la tuile principale
 * (remplie en vert, donnée par sa clé), le chiffre utile quand il y en a un. Un appui rend la tuile touchée.
 * `remplir` : les tuiles se partagent la place restante de l'écran (la hauteur s'adapte au nombre de lignes).
 */
export function GrilleDeTuiles({
  tuiles,
  onAppui,
  variante = 'avance',
  principale,
  remplir = false,
}: {
  tuiles: TuileTerrain[];
  onAppui: (tuile: TuileTerrain) => void;
  variante?: VarianteTuile;
  /** La clé de la tuile principale de cet écran. */
  principale?: string;
  remplir?: boolean;
}) {
  const [hauteurDispo, setHauteurDispo] = useState(0);
  const taille = variante === 'simple' ? 30 : 32;
  const lignes = Math.ceil(tuiles.length / 2);
  // La hauteur d'une tuile : la place restante, moins les espaces entre les lignes, divisée par le nombre de lignes.
  const hauteurTuile =
    remplir && hauteurDispo > 0 && lignes > 0
      ? Math.max(HAUTEUR_MIN, (hauteurDispo - ESPACE * (lignes - 1)) / lignes)
      : undefined;
  return (
    <View
      style={remplir ? { flex: 1 } : undefined}
      onLayout={remplir ? (e) => setHauteurDispo(e.nativeEvent.layout.height) : undefined}
    >
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
            hauteur={hauteurTuile}
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
    </View>
  );
}
