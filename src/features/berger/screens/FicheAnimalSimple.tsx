import { ScrollView, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import type { Chevre } from '@/features/cheptel/types';
import { SEXE } from '@/shared/constants/cheptel';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.roles.berger;

interface Props {
  animal: Chevre;
  onSoin: () => void;
  onMouvement: () => void;
  onNaissance: () => void;
  onDeces: () => void;
}

/** La fiche d'une chèvre : sa boucle, son sexe, sa naissance et sa mère, son entrée, et ce qu'on peut faire avec elle. */
export function FicheAnimalSimple({ animal, onSoin, onMouvement, onNaissance, onDeces }: Props) {
  const boucle = (animal.numeroBoucle ?? '').trim();
  return (
    <ScrollView contentContainerStyle={commonStyles.gap10}>
      <Card>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>{boucle || T.ficheSansBoucle}</Text>
        <Text style={commonStyles.muted}>{T.ficheSexe(animal.sexe === SEXE.FEMELLE)}</Text>
        {animal.dateNaissance ? <Text style={commonStyles.line}>{T.ficheNee(formatDateFR(animal.dateNaissance))}</Text> : null}
        {animal.mereNumeroBoucle ? <Text style={commonStyles.line}>{T.ficheMere(animal.mereNumeroBoucle)}</Text> : null}
        {animal.dateEntree ? (
          <Text style={commonStyles.line}>{T.ficheAchetee(formatDateFR(animal.dateEntree), animal.vendeur)}</Text>
        ) : null}
        <Text style={commonStyles.muted}>{T.ficheVivante}</Text>
      </Card>

      <Text style={commonStyles.cardTitle}>{T.ficheActions}</Text>
      <View style={commonStyles.gap10}>
        {/* La naissance est l'action la plus fréquente d'une chèvre : un grand bouton, le premier et le plus facile à toucher. */}
        {animal.sexe === SEXE.FEMELLE ? (
          <Button
            label={T.ficheNaissance}
            variant="secondary"
            onPress={onNaissance}
            style={{ minHeight: 160 }}
            styleTexte={{ fontSize: 24 }}
          />
        ) : null}
        <Button label={T.soin} variant="secondary" onPress={onSoin} />
        <Button label={T.mouvement} variant="secondary" onPress={onMouvement} />
        <Button label={T.ficheDeces} variant="secondary" onPress={onDeces} />
      </View>
    </ScrollView>
  );
}
