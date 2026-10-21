import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  ColonneFerme,
  colonnesDuCote,
  largeurDeLaColonneCote,
  type AncreBouton,
  type EntreeDeColonne,
} from '@/features/accueil/ferme/ColonneFerme';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/** La largeur de la colonne de droite (la gestion) : un bouton rond et son nom dessous. */
const LARGEUR_GESTION = 62;
/** L'espace entre une colonne et le bord de la scène. */
const BORD = 8;
/** Ce que la colonne de gauche laisse au contenu de la scène, entre elle et lui. */
const ECART_AU_CONTENU = 12;

/**
 * La mesure des colonnes d'une scène : la hauteur de la scène (de quoi choisir le nombre de boutons par ligne de la colonne de gauche), et la
 * place que les colonnes prennent à gauche et à droite, pour que le contenu de la scène se centre entre elles.
 */
export function useColonnesDeScene(nombreAGauche: number) {
  const [hauteur, setHauteur] = useState<number | undefined>();
  const hauteurDeLaColonne = hauteur === undefined ? undefined : hauteur - 2 * BORD;
  const colonnes = colonnesDuCote(nombreAGauche, hauteurDeLaColonne, true);
  return {
    hauteur: hauteurDeLaColonne,
    surHauteur: setHauteur,
    margeGauche: BORD + largeurDeLaColonneCote(colonnes) + ECART_AU_CONTENU,
    margeDroite: BORD + LARGEUR_GESTION + ECART_AU_CONTENU,
  };
}

interface Props {
  /** Les intervenants : les personnes et entreprises à qui l'on a affaire, en colonne à gauche. */
  intervenants: readonly EntreeDeColonne[];
  /** La gestion : les rubriques de l'application, en colonne à droite (sous le pouce droit), avec leur nom. */
  gestion: readonly EntreeDeColonne[];
  onIntervenant: (cle: string, ancre: AncreBouton) => void;
  onGestion: (cle: string, ancre: AncreBouton) => void;
  hauteur?: number;
  surHauteur: (hauteur: number) => void;
}

/**
 * Les deux colonnes de boutons posées sur une scène plein écran, au bas de chaque côté (là où le pouce arrive) : à gauche les intervenants, à droite
 * la gestion. Elles laissent passer les appuis sur la scène entre elles.
 */
export function ColonnesDeScene({ intervenants, gestion, onIntervenant, onGestion, hauteur, surHauteur }: Props) {
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      onLayout={(e) => surHauteur(Math.round(e.nativeEvent.layout.height))}
    >
      <View style={styles.gauche} pointerEvents="box-none">
        <ColonneFerme
          entrees={intervenants}
          onAppui={onIntervenant}
          cote
          hauteurDisponible={hauteur}
          titre={TEXTES.accueil.ferme.intervenants}
        />
      </View>
      <View style={styles.droite} pointerEvents="box-none">
        <Text style={styles.titre}>{TEXTES.accueil.ferme.gestion}</Text>
        <View style={styles.colonneGestion}>
          <ColonneFerme entrees={gestion} onAppui={onGestion} grille compacte />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gauche: { position: 'absolute', left: BORD, bottom: BORD, top: BORD, justifyContent: 'flex-end' },
  droite: {
    position: 'absolute',
    right: BORD,
    bottom: BORD,
    top: BORD,
    width: LARGEUR_GESTION,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  titre: { fontSize: 14, fontWeight: '800', color: colors.primaryDark, marginBottom: 4 },
  colonneGestion: { width: LARGEUR_GESTION },
});
