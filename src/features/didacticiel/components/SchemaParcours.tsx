import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Picto } from '@/features/didacticiel/services/parcours';
import { colors } from '@/shared/theme/colors';

type NomMci = keyof typeof MaterialCommunityIcons.glyphMap;

/** L'icône de chaque pictogramme (le trait noir de l'interface). Un pictogramme sans icône (l'abattoir) s'écrit en pastille. */
const ICONES: Record<Exclude<Picto, 'abattoir' | 'facture-barree'>, NomMci> = {
  animal: 'cow',
  facture: 'receipt-text-outline',
  argent: 'hand-coin-outline',
  lait: 'bottle-tonic-outline',
  fromage: 'cheese',
  charcuterie: 'sausage',
  rappel: 'bell-alert-outline',
  veterinaire: 'stethoscope',
  traitement: 'pill',
  delai: 'timer-sand',
  aliment: 'sprout-outline',
  boucle: 'tag-outline',
  pac: 'file-document-outline',
  envoi: 'send-outline',
  circulation: 'truck-delivery-outline',
  naissance: 'baby-carriage',
  carnet: 'notebook-outline',
  commande: 'clipboard-text-outline',
  declaration: 'bank-outline',
  valide: 'check-circle-outline',
  donnees: 'database-outline',
  nuage: 'cloud-upload-outline',
  restaure: 'cloud-download-outline',
};

const TAILLE = 40;

function UnPicto({ picto }: { picto: Picto }) {
  if (picto === 'abattoir') {
    return (
      <View style={styles.pastille}>
        <Text style={styles.pastilleTexte}>ABATTOIR</Text>
      </View>
    );
  }
  if (picto === 'facture-barree') {
    // Une facture barrée d'un trait : l'écriture sans facture.
    return (
      <View style={styles.barree}>
        <MaterialCommunityIcons name={ICONES.facture} size={TAILLE} color={colors.text} />
        <View style={styles.trait} />
      </View>
    );
  }
  return <MaterialCommunityIcons name={ICONES[picto]} size={TAILLE} color={colors.text} />;
}

/** Un parcours en pictogrammes, de gauche à droite, séparés par des flèches : l'idée du cas d'un coup d'œil. */
export function SchemaParcours({ schema }: { schema: readonly Picto[] }) {
  return (
    <View style={styles.ligne} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {schema.map((picto, i) => (
        <Fragment key={`${picto}-${i}`}>
          {i > 0 ? <Ionicons name="arrow-forward-outline" size={26} color={colors.textMuted} /> : null}
          <UnPicto picto={picto} />
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, flex: 1 },
  pastille: { backgroundColor: '#E8212B', paddingHorizontal: 8, paddingVertical: 7 },
  pastilleTexte: { color: colors.blanc, fontSize: 12, fontWeight: '600' },
  barree: { width: TAILLE, height: TAILLE, alignItems: 'center', justifyContent: 'center' },
  trait: {
    position: 'absolute',
    width: TAILLE * 1.3,
    height: 4,
    backgroundColor: colors.text,
    transform: [{ rotate: '-45deg' }],
  },
});
