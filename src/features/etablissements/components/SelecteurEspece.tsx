import { Pressable, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { LABEL_TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/textes/libelles';
import { styles } from '@/shared/styles/etablissements/SelecteurEspece.styles';

/**
 * Choix de l'espèce dont on gère le cheptel (chèvres, brebis…). N'apparaît que pour un établissement
 * qui en élève plusieurs. Le changement recharge l'écran courant avec le vocabulaire et les données de l'espèce.
 */
export function SelecteurEspece() {
  const { especes, espece, changerEspece } = useEtablissement();
  const chemin = usePathname();

  if (especes.length < 2) return null;

  return (
    <View style={styles.ligne}>
      {especes.map((e) => {
        const active = e === espece;
        return (
          <Pressable
            key={e}
            style={[styles.puce, active && styles.puceActive]}
            onPress={() => !active && changerEspece(e, chemin)}
          >
            <Text style={[styles.texte, active && styles.texteActif]}>
              {LABEL_TYPE_ANIMAL_ETABLISSEMENT[e]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
