import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Apparition } from '@/features/accueil/ferme/animations';
import { AncreVisite } from '@/features/didacticiel/components/AncreVisite';
import { BoutonDidacticiel } from '@/features/didacticiel/components/BoutonDidacticiel';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { LABEL_TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/textes/libelles';

const T = TEXTES.accueil.ferme.outils;

interface Props {
  annees: number[];
  annee: number;
  onChoisirAnnee: (annee: number) => void;
}

/** Un bouton rond du côté gauche : son icône, ce qui est choisi en pastille, son libellé. */
function Rond({ icone, valeur, libelle, onPress }: { icone: keyof typeof Ionicons.glyphMap; valeur: string; libelle: string; onPress: () => void }) {
  return (
    <Pressable style={styles.element} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${libelle} : ${valeur}`}>
      <View style={styles.rond}>
        <Ionicons name={icone} size={26} color={colors.blanc} />
      </View>
      <View style={styles.valeur}>
        <Text style={styles.valeurTexte}>{valeur}</Text>
      </View>
      <Text style={styles.libelle} numberOfLines={1}>
        {libelle}
      </Text>
    </Pressable>
  );
}

/**
 * Les réglages de l'écran, en boutons ronds sous les minuteurs : l'année (le calendrier), l'espèce quand on en élève plusieurs, et le
 * didacticiel (le livre). Ils remplacent la ligne de filtres du haut de l'accueil classique.
 */
export function OutilsFerme({ annees, annee, onChoisirAnnee }: Props) {
  const { especes, espece, changerEspece } = useEtablissement();
  const [anneeOuverte, setAnneeOuverte] = useState(false);
  const [especeOuverte, setEspeceOuverte] = useState(false);
  const listeAnnees = [...new Set([...annees, annee])].sort((a, b) => b - a);
  return (
    <AncreVisite id="accueil.filtres" style={styles.groupe}>
      <Apparition delai={500}>
        <Rond icone="calendar" valeur={String(annee)} libelle={T.annee} onPress={() => setAnneeOuverte(true)} />
      </Apparition>
      {especes.length > 1 ? (
        <Apparition delai={580}>
          <Rond icone="swap-horizontal" valeur={LABEL_TYPE_ANIMAL_ETABLISSEMENT[espece]} libelle={T.espece} onPress={() => setEspeceOuverte(true)} />
        </Apparition>
      ) : null}
      <Apparition delai={660}>
        <BoutonDidacticiel rond />
      </Apparition>
      <OptionsModal
        visible={anneeOuverte}
        onClose={() => setAnneeOuverte(false)}
        title={TEXTES.commun.choix.annee}
        options={listeAnnees.map((a) => ({
          label: String(a),
          icon: a === annee ? 'checkmark-circle' : 'calendar-outline',
          onPress: () => {
            setAnneeOuverte(false);
            onChoisirAnnee(a);
          },
        }))}
      />
      <OptionsModal
        visible={especeOuverte}
        onClose={() => setEspeceOuverte(false)}
        title={TEXTES.commun.choix.animal}
        options={especes.map((e) => ({
          label: LABEL_TYPE_ANIMAL_ETABLISSEMENT[e],
          icon: e === espece ? 'checkmark-circle' : 'paw-outline',
          onPress: () => {
            setEspeceOuverte(false);
            changerEspece(e);
          },
        }))}
      />
    </AncreVisite>
  );
}

const styles = StyleSheet.create({
  groupe: { width: 72, gap: 12, alignItems: 'center' },
  element: { alignItems: 'center', gap: 2, width: 72 },
  rond: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.blanc, alignItems: 'center', justifyContent: 'center' },
  valeur: { marginTop: -8, backgroundColor: colors.primaryDark, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  valeurTexte: { color: colors.blanc, fontSize: 12, fontWeight: '700' },
  libelle: { fontSize: 11, color: colors.text, textAlign: 'center', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 6, paddingHorizontal: 4 },
});
