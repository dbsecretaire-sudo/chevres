import { Pressable, Text } from 'react-native';
import { DefilementFleches } from '@/shared/components/DefilementFleches';
import type { RubriqueComptabilite } from '@/features/comptabilite/services/filtresTransactions';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { RUBRIQUE_COMPTABILITE } from '@/shared/constants/comptabilite';
import { activitesEtablissement } from '@/shared/dictionnaire/entreprise';
import { styles } from '@/shared/styles/components/YearPicker.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  valeur: RubriqueComptabilite;
  onChange: (rubrique: RubriqueComptabilite) => void;
}

const T = TEXTES.comptabilite.rubriques;
const PUCES: { valeur: RubriqueComptabilite; label: string }[] = [
  { valeur: RUBRIQUE_COMPTABILITE.TOUT, label: T.tout },
  { valeur: RUBRIQUE_COMPTABILITE.GITE, label: T.gite },
  { valeur: RUBRIQUE_COMPTABILITE.BAR, label: T.bar },
  { valeur: RUBRIQUE_COMPTABILITE.ACTIVITE, label: T.activite },
];

/**
 * « Tout · Gîte · Bar · Activité » : trie la liste des écritures d'un gîte par rubrique, avec les mêmes pastilles que les
 * années. N'apparaît que pour un établissement qui gère un gîte.
 */
export function PucesRubrique({ valeur, onChange }: Props) {
  if (!activitesEtablissement().includes(ACTIVITE_SOCIETE.ASSOCIATION)) return null;

  return (
    <DefilementFleches contentContainerStyle={styles.rowCompact}>
      {PUCES.map((puce) => {
        const selected = puce.valeur === valeur;
        return (
          <Pressable
            key={puce.valeur}
            onPress={() => onChange(puce.valeur)}
            style={[commonStyles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && commonStyles.textWhite]}>{puce.label}</Text>
          </Pressable>
        );
      })}
    </DefilementFleches>
  );
}
