import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { TuileTerrain } from '@/features/accueil/terrain/ecransTerrain';
import { TuileMaquette, type VarianteTuile } from '@/shared/components/TuileMaquette';
import { styles } from '@/shared/styles/accueil/EcranTerrain.styles';
import { COLONNES_DE_GRILLE } from '@/shared/theme/miseEnPage';

/** L'espace entre deux lignes de tuiles (le même que la grille). */
const ESPACE = 12;
/** En dessous, une tuile devient trop petite pour être touchée avec des gants : la grille défile alors. */
const HAUTEUR_MIN = 130;

/**
 * Les grandes tuiles d'une zone, comme sur la maquette : la présentation (« simple » au centre, « avance » en haut à gauche), la tuile principale
 * (remplie en vert, donnée par sa clé), le chiffre utile quand il y en a un. Un appui rend la tuile touchée.
 * `hauteurDispo` : la place que la grille peut prendre (mesurée par la page) ; les tuiles s'y partagent, sans descendre sous une hauteur minimale.
 */
export function GrilleDeTuiles({
  tuiles,
  onAppui,
  variante = 'avance',
  principale,
  hauteurDispo,
  grandes = false,
}: {
  tuiles: TuileTerrain[];
  onAppui: (tuile: TuileTerrain) => void;
  variante?: VarianteTuile;
  /** La clé de la tuile principale de cet écran. */
  principale?: string;
  hauteurDispo?: number;
  /** De grandes tuiles (pastille et icône plus grandes), pour une page de peu de tuiles, comme « Fabriquer ». */
  grandes?: boolean;
}) {
  const taille = grandes ? 48 : variante === 'simple' ? 30 : 32;
  const lignes = Math.ceil(tuiles.length / COLONNES_DE_GRILLE);
  const hauteurTuile =
    hauteurDispo !== undefined && hauteurDispo > 0 && lignes > 0
      ? Math.max(HAUTEUR_MIN, (hauteurDispo - ESPACE * (lignes - 1)) / lignes)
      : undefined;
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
          detail={t.detail}
          hauteur={hauteurTuile}
          grande={grandes}
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
