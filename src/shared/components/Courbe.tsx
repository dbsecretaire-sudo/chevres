import { useState } from 'react';
import { Text, View } from 'react-native';
import { styles } from '@/shared/styles/components/Courbe.styles';

/** Hauteur du dessin et marge intérieure (px). */
const HAUTEUR = 180;
const MARGE = 12;
/** Au-delà de ce nombre de points, seuls le premier et le dernier portent leur libellé. */
const POINTS_LIBELLES_MAX = 8;

export interface SerieCourbe {
  couleur: string;
  /** Une valeur par libellé de l'axe (rien quand la série n'a pas de valeur à ce point). */
  valeurs: (number | undefined)[];
}

interface Props {
  /** Les libellés de l'axe, un par point (les mois). */
  libelles: string[];
  series: SerieCourbe[];
}

/**
 * Un graphique à plusieurs courbes : chaque série suit sa propre échelle (de sa valeur la plus basse, en bas, à la plus haute, en
 * haut), pour que des mesures d'ordres de grandeur très différents se lisent ensemble. Les points d'une série sont reliés entre
 * eux, et le libellé des points est écrit dessous (le premier et le dernier seulement quand il y en a beaucoup). Tracé avec de
 * simples vues, sans bibliothèque.
 */
export function Courbe({ libelles, series }: Props) {
  const [largeur, setLargeur] = useState(0);
  const utile = Math.max(largeur - 2 * MARGE, 1);
  const x = (i: number) =>
    libelles.length === 1 ? largeur / 2 : MARGE + (i / (libelles.length - 1)) * utile;
  const tousLesLibelles = libelles.length <= POINTS_LIBELLES_MAX;

  return (
    <View>
      <View
        style={[styles.zone, { height: HAUTEUR }]}
        onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
      >
        {largeur > 0
          ? series.map((serie, k) => {
              const presents = serie.valeurs.flatMap((valeur, i) =>
                valeur === undefined ? [] : [{ i, valeur }],
              );
              if (presents.length === 0) return null;
              const plusHaut = Math.max(...presents.map((p) => p.valeur));
              const plusBas = Math.min(...presents.map((p) => p.valeur));
              const ecart = plusHaut - plusBas;
              // Une série constante se range au milieu du dessin.
              const y = (valeur: number) =>
                ecart === 0
                  ? HAUTEUR / 2
                  : HAUTEUR - MARGE - ((valeur - plusBas) / ecart) * (HAUTEUR - 2 * MARGE);
              return (
                <View key={`serie-${k}`} style={styles.serie} pointerEvents="none">
                  {presents.slice(1).map((p, j) => {
                    const avant = presents[j];
                    const [x1, y1, x2, y2] = [x(avant.i), y(avant.valeur), x(p.i), y(p.valeur)];
                    const longueur = Math.hypot(x2 - x1, y2 - y1);
                    return (
                      <View
                        key={`segment-${j}`}
                        style={[
                          styles.segment,
                          {
                            width: longueur,
                            left: (x1 + x2) / 2 - longueur / 2,
                            top: (y1 + y2) / 2 - 1,
                            backgroundColor: serie.couleur,
                            transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad` }],
                          },
                        ]}
                      />
                    );
                  })}
                  {presents.map((p) => (
                    <View
                      key={`point-${p.i}`}
                      style={[
                        styles.point,
                        { left: x(p.i) - 4, top: y(p.valeur) - 4, backgroundColor: serie.couleur },
                      ]}
                    />
                  ))}
                </View>
              );
            })
          : null}
      </View>
      <View style={styles.libelles}>
        {libelles.map((libelle, i) =>
          tousLesLibelles || i === 0 || i === libelles.length - 1 ? (
            <Text key={`libelle-${i}`} style={styles.libelle}>
              {libelle}
            </Text>
          ) : null,
        )}
      </View>
    </View>
  );
}
