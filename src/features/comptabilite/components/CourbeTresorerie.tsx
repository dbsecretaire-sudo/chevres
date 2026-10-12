import { useState } from 'react';
import { Text, View } from 'react-native';
import type { MoisTresorerie } from '@/features/comptabilite/services/tresorerie';
import { NOMS_MOIS } from '@/shared/textes/libelles';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/comptabilite/Tresorerie.styles';

/** Hauteur du dessin et marge intérieure (px). */
const HAUTEUR = 170;
const MARGE = 14;

/**
 * La courbe du solde, mois par mois (la fin de chaque mois) : verte au-dessus du zéro, rouge en dessous, en trait clair pour la
 * prévision. Le zéro et le seuil d'alerte sont tracés, et un cercle rouge entoure les mois sous le seuil. Dessinée avec de simples
 * vues, comme les autres courbes de l'application.
 */
export function CourbeTresorerie({ mois, seuil }: { mois: MoisTresorerie[]; seuil: number }) {
  const [largeur, setLargeur] = useState(0);
  const valeurs = [...mois.map((m) => m.solde), 0, seuil];
  const plusHaut = Math.max(...valeurs);
  const plusBas = Math.min(...valeurs);
  const ecart = plusHaut - plusBas || 1;
  const utile = Math.max(largeur - 2 * MARGE, 1);
  const x = (i: number) => MARGE + (i / (mois.length - 1)) * utile;
  const y = (valeur: number) => HAUTEUR - MARGE - ((valeur - plusBas) / ecart) * (HAUTEUR - 2 * MARGE);
  const couleur = (valeur: number) => (valeur >= 0 ? colors.success : colors.danger);

  return (
    <View>
      <View
        style={[styles.courbe, { height: HAUTEUR }]}
        onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
      >
        {largeur > 0 ? (
          <>
            <View style={[styles.ligneZero, { top: y(0) }]} />
            {seuil !== 0 ? <View style={[styles.ligneSeuil, { top: y(seuil) }]} /> : null}
            {mois.slice(1).map((m, i) => {
              const [x1, y1, x2, y2] = [x(i), y(mois[i].solde), x(i + 1), y(m.solde)];
              const longueur = Math.hypot(x2 - x1, y2 - y1);
              return (
                <View
                  key={`segment-${m.mois}`}
                  style={[
                    styles.segment,
                    m.prevision && styles.prevision,
                    {
                      width: longueur,
                      left: (x1 + x2) / 2 - longueur / 2,
                      top: (y1 + y2) / 2 - 1,
                      backgroundColor: couleur(m.solde),
                      transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad` }],
                    },
                  ]}
                />
              );
            })}
            {mois.map((m, i) => (
              <View key={`point-${m.mois}`}>
                {m.solde < seuil ? (
                  <View style={[styles.alerte, { left: x(i) - 9, top: y(m.solde) - 9 }]} />
                ) : null}
                <View
                  style={[
                    styles.point,
                    m.prevision && styles.prevision,
                    { left: x(i) - 3.5, top: y(m.solde) - 3.5, backgroundColor: couleur(m.solde) },
                  ]}
                />
              </View>
            ))}
          </>
        ) : null}
      </View>
      <View style={styles.libelles}>
        {mois.map((m) => (
          <Text key={`libelle-${m.mois}`} style={styles.libelle}>
            {NOMS_MOIS[m.mois - 1].slice(0, 1).toUpperCase()}
          </Text>
        ))}
      </View>
    </View>
  );
}
