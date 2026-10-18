import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { OPTIONS_SEXE } from '@/features/cheptel/utils/optionsSexe';
import { animalAcheteVide, type AnimalAcheteForm } from '@/features/comptabilite/forms/animauxAchetes';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/cheptel/ChevreFormulaire.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture.animauxAchetes;

interface Props {
  animaux: AnimalAcheteForm[];
  onChange: (animaux: AnimalAcheteForm[]) => void;
}

/**
 * Les animaux vivants achetés (dépense « Animaux vivants ») : un bloc par animal — sa boucle, son sexe et sa date de naissance. Leur
 * fiche se crée dans le cheptel à l'enregistrement de la dépense ; le document de circulation se génère ensuite depuis elle.
 */
export function AnimauxAchetesEditor({ animaux, onChange }: Props) {
  const maj = (key: string, patch: Partial<AnimalAcheteForm>) =>
    onChange(animaux.map((a) => (a.key === key ? { ...a, ...patch } : a)));
  const retirer = (key: string) => onChange(animaux.length > 1 ? animaux.filter((a) => a.key !== key) : animaux);

  return (
    <Card style={commonStyles.gap10}>
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={commonStyles.lineBold}>{T.titre}</Text>
        <Pressable style={commonStyles.boutonPastille} onPress={() => onChange([...animaux, animalAcheteVide()])}>
          <Ionicons name="add-circle" size={28} color={colors.ajout} />
        </Pressable>
      </View>
      {animaux.map((a, index) => (
        <View key={a.key} style={commonStyles.gap8}>
          <View style={commonStyles.rowSpaceBetween}>
            <Text style={commonStyles.lineSemiBold}>{T.animal(index + 1)}</Text>
            {animaux.length > 1 ? (
              <Pressable style={commonStyles.boutonPastille} onPress={() => retirer(a.key)} accessibilityLabel={T.retirer}>
                <Ionicons name="close-circle" size={28} color={colors.danger} />
              </Pressable>
            ) : null}
          </View>
          <FormField
            label={T.boucle}
            value={a.boucle}
            onChangeText={(boucle) => maj(a.key, { boucle: boucle.trim() })}
            aide={T.boucleAide}
          />
          <View style={styles.ligne}>
            <View style={styles.champ}>
              <SelectField
                label={TEXTES.commun.general.sexe}
                required
                value={a.sexe}
                onChange={(sexe) => maj(a.key, { sexe })}
                options={OPTIONS_SEXE}
              />
            </View>
            <View style={styles.champ}>
              <DateField
                label={T.naissance}
                required
                value={a.naissance}
                onChange={(naissance) => maj(a.key, { naissance })}
              />
            </View>
          </View>
        </View>
      ))}
      <Text style={commonStyles.note}>{T.aide}</Text>
    </Card>
  );
}
