import { Pressable, Text, View } from 'react-native';
import { Checkbox } from '@/shared/components/Checkbox';
import {
  idOperation,
  libelleOperation,
  operationsDeLaRubrique,
  type RubriqueOperations,
  type SensOperation,
} from '@/features/contacts/services/operationsInventaire';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/cheptel/ChevreFormulaire.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.contacts.operations;

interface Props {
  rubriques: RubriqueOperations[];
  /** Les opérations cochées (voir idOperation). */
  valeur: readonly string[];
  onChange: (operations: string[]) => void;
}

/**
 * Les opérations d'une catégorie de contact, rangées comme l'inventaire : une rubrique par catégorie (Produits finis, Produits animaux…),
 * cochée d'un coup avec « Toutes les ventes » ou « Tous les achats », puis pour chaque liste sa vente et son achat.
 */
export function ChoixOperations({ rubriques, valeur, onChange }: Props) {
  const choisies = new Set(valeur);
  const poser = (ids: string[], cocher: boolean) => {
    const suivantes = new Set(choisies);
    for (const id of ids) {
      if (cocher) suivantes.add(id);
      else suivantes.delete(id);
    }
    onChange([...suivantes]);
  };
  const toutes = (ids: string[]) => ids.length > 0 && ids.every((id) => choisies.has(id));

  return (
    <View style={commonStyles.gap10}>
      {rubriques.map((rubrique) => {
        const ids = operationsDeLaRubrique(rubrique);
        const sens = (s: SensOperation) => operationsDeLaRubrique(rubrique, s);
        return (
          <View key={rubrique.categorie} style={commonStyles.gap6}>
            <Checkbox label={rubrique.titre} value={toutes(ids)} onChange={(cochee) => poser(ids, cochee)} />
            <View style={commonStyles.row}>
              <Pressable onPress={() => poser(sens('vente'), !toutes(sens('vente')))} hitSlop={6} accessibilityRole="button">
                <Text style={commonStyles.lien}>{T.toutesLesVentes}</Text>
              </Pressable>
              <Pressable onPress={() => poser(sens('achat'), !toutes(sens('achat')))} hitSlop={6} accessibilityRole="button">
                <Text style={commonStyles.lien}>{T.tousLesAchats}</Text>
              </Pressable>
            </View>
            {rubrique.listes.map((liste) => (
              <View key={liste.cle} style={styles.ligne}>
                {(['vente', 'achat'] as const).map((s) => {
                  const id = idOperation(rubrique.categorie, liste.cle, s);
                  return (
                    <View key={s} style={styles.champ}>
                      <Checkbox
                        label={libelleOperation(s, liste.titre)}
                        value={choisies.has(id)}
                        onChange={(cochee) => poser([id], cochee)}
                      />
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}
