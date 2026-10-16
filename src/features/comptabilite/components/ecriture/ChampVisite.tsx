import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { ModalListeValeurs } from '@/shared/components/ModalListeValeurs';
import { PucesMultiples } from '@/shared/components/PucesMultiples';
import { useListePersonnalisee } from '@/features/settings/hooks/useListePersonnalisee';
import { CLE_LISTE_PERSONNALISEE } from '@/shared/constants/controles';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture.visite;
const V = TEXTES.exploitation.nouvelleVisite;

/** Ce qui sépare les motifs d'une visite dans le texte enregistré (le motif libre est le dernier). */
export const SEPARATEUR_MOTIFS = ' · ';

/** Les motifs de la liste que le texte enregistré nomme, et ce qui reste (le motif libre). */
export function motifsDeLaVisite(texte: string, liste: string[]): { choisis: string[]; libre: string } {
  const parties = texte.split(SEPARATEUR_MOTIFS);
  return {
    choisis: liste.filter((m) => parties.includes(m)),
    libre: parties.filter((p) => p && !liste.includes(p)).join(SEPARATEUR_MOTIFS),
  };
}

/** Le texte enregistré : les motifs choisis (dans l'ordre de la liste), puis le motif libre. */
export const texteDesMotifs = (choisis: string[], libre: string): string =>
  [...choisis, ...(libre.trim() ? [libre] : [])].join(SEPARATEUR_MOTIFS);

interface Props {
  motif: string;
  ajouter: boolean;
  onMotif: (motif: string) => void;
  onAjouter: (ajouter: boolean) => void;
}

/**
 * Une dépense vétérinaire : les motifs de la visite — plusieurs de la liste (que le crayon modifie) et, en plus, un motif libre —, et
 * la case qui l'inscrit (avec sa date) dans les visites vétérinaires.
 */
export function ChampVisite({ motif, ajouter, onMotif, onAjouter }: Props) {
  const [motifs, enregistrerMotifs] = useListePersonnalisee(
    CLE_LISTE_PERSONNALISEE.MOTIFS_VISITE,
    V.motifsParDefaut,
  );
  const [listeOuverte, setListeOuverte] = useState(false);
  const { choisis, libre } = motifsDeLaVisite(motif, motifs);
  return (
    <>
      <View style={commonStyles.gap6}>
        <View style={commonStyles.rowSpaceBetween}>
          <Text style={commonStyles.lineSemiBold}>{T.motifs}</Text>
          <Pressable onPress={() => setListeOuverte(true)} hitSlop={8} accessibilityLabel={T.modifierMotifs}>
            <Ionicons name="pencil" size={20} color={colors.primary} />
          </Pressable>
        </View>
        <PucesMultiples<string>
          puces={motifs.map((m) => ({ valeur: m, label: m }))}
          valeurs={choisis}
          onChange={(nouveaux) => onMotif(texteDesMotifs(nouveaux, libre))}
        />
      </View>
      <FormField
        label={T.autreMotif}
        value={libre}
        onChangeText={(texte) => onMotif(texteDesMotifs(choisis, texte))}
        placeholder={T.autreMotifExemple}
      />
      <Checkbox label={T.ajouter} value={ajouter} onChange={onAjouter} />
      <ModalListeValeurs
        visible={listeOuverte}
        titre={V.titreMotifs}
        valeurs={motifs}
        valeursParDefaut={V.motifsParDefaut}
        onValider={(nouvelles) => {
          enregistrerMotifs(nouvelles);
          setListeOuverte(false);
        }}
        onAnnuler={() => setListeOuverte(false)}
      />
    </>
  );
}
