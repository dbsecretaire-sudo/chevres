import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BoutonDidacticiel } from '@/features/didacticiel/components/BoutonDidacticiel';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { BoutonDeBarre } from '@/shared/components/BoutonDeBarre';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { LABEL_TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/textes/libelles';

const T = TEXTES.accueil.ferme.barre;

interface Props {
  annees: number[];
  annee: number;
  onChoisirAnnee: (annee: number) => void;
}

/**
 * La barre du bas de l'accueil : l'année (un appui ouvre la liste des années), l'espèce (un appui ouvre le choix), le didacticiel et les
 * réglages. Elle respecte la barre de navigation du système.
 */
export function BarreBasseFerme({ annees, annee, onChoisirAnnee }: Props) {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const { especes, espece, changerEspece } = useEtablissement();
  const [anneeOuverte, setAnneeOuverte] = useState(false);
  const [especeOuverte, setEspeceOuverte] = useState(false);
  const listeAnnees = [...new Set([...annees, annee])].sort((a, b) => b - a);
  return (
    <View style={[styles.barre, { paddingBottom: 8 + bottom }]}>
      <BoutonDeBarre icone={<Ionicons name="calendar" size={26} color={colors.blanc} />} libelle={String(annee)} onPress={() => setAnneeOuverte(true)} />
      <BoutonDeBarre
        icone={<Ionicons name="swap-horizontal" size={26} color={colors.blanc} />}
        libelle={LABEL_TYPE_ANIMAL_ETABLISSEMENT[espece]}
        onPress={() => (especes.length > 1 ? setEspeceOuverte(true) : router.push(ROUTES.INFORMATIONS_EXPLOITATION as never))}
      />
      <BoutonDidacticiel forme="barre" />
      <BoutonDeBarre icone={<Ionicons name="settings" size={26} color={colors.blanc} />} libelle={T.reglages} onPress={() => router.push(ROUTES.REGLAGES as never)} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  barre: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 8, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
});
