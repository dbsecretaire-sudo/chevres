import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { decalerMois, semainesDuMois, type MoisCalendrier } from '@/shared/utils/calendrier';
import { todayISO } from '@/shared/utils/dates';
import { NOMS_MOIS } from '@/shared/textes/libelles';
import { styles } from '@/shared/styles/components/CalendrierMois.styles';
import { TEXTES } from '@/shared/textes';

/** Ce qu'une case du calendrier affiche en plus du numéro du jour, et sa couleur. */
export interface MarqueJour {
  texte?: string;
  /** Un point d'exclamation dans le coin de la case, pour attirer l'attention (ex : un paiement en attente). */
  attention?: boolean;
  /** Rien, un peu (fond clair), complet (fond plein) ou à surveiller (rouge). */
  niveau?: 'aucun' | 'partiel' | 'plein' | 'alerte';
}

interface Props {
  mois: MoisCalendrier;
  onChangerMois: (mois: MoisCalendrier) => void;
  marque: (jour: string) => MarqueJour;
  onJour: (jour: string) => void;
  /** Une phrase sous le calendrier pour expliquer ce que montrent les cases. */
  legende?: string;
}

/**
 * Un grand calendrier mensuel (le lundi en premier) : on change de mois avec les flèches, chaque case porte le numéro du
 * jour et une marque choisie par l'écran (chambres occupées, échéances…) ; un appui sur un jour l'ouvre.
 */
export function CalendrierMois({ mois, onChangerMois, marque, onJour, legende }: Props) {
  const aujourdhui = todayISO();
  const T = TEXTES.commun.calendrier;

  return (
    <View style={styles.conteneur}>
      <View style={styles.enteteMois}>
        <Pressable
          style={styles.boutonMois}
          onPress={() => onChangerMois(decalerMois(mois, -1))}
          accessibilityLabel={T.moisPrecedent}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.titreMois}>
          {NOMS_MOIS[mois.mois]} {mois.annee}
        </Text>
        <Pressable
          style={styles.boutonMois}
          onPress={() => onChangerMois(decalerMois(mois, 1))}
          accessibilityLabel={T.moisSuivant}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.ligneSemaine}>
        {T.jours.map((jour, i) => (
          <Text key={i} style={styles.enteteJour}>
            {jour}
          </Text>
        ))}
      </View>

      {semainesDuMois(mois.annee, mois.mois).map((semaine, i) => (
        <View key={i} style={styles.ligneSemaine}>
          {semaine.map((jour, j) => {
            if (!jour) return <View key={j} style={styles.caseVide} />;
            const { texte, niveau = 'aucun', attention } = marque(jour);
            const plein = niveau === 'plein';
            return (
              <Pressable
                key={j}
                style={[
                  styles.caseJour,
                  niveau === 'partiel' && styles.casePartielle,
                  plein && styles.casePleine,
                  niveau === 'alerte' && styles.caseAlerte,
                  jour === aujourdhui && styles.caseAujourdhui,
                ]}
                onPress={() => onJour(jour)}
              >
                <Text style={[styles.numeroJour, plein && styles.textePlein]}>{Number(jour.slice(8))}</Text>
                {attention ? (
                  <View style={styles.pastilleAttention}>
                    <Text style={styles.texteAttention}>!</Text>
                  </View>
                ) : null}
                {texte ? (
                  <Text
                    style={[
                      styles.marque,
                      plein && styles.textePlein,
                      niveau === 'alerte' && styles.texteAlerte,
                    ]}
                  >
                    {texte}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}

      {legende ? <Text style={styles.legende}>{legende}</Text> : null}
    </View>
  );
}
