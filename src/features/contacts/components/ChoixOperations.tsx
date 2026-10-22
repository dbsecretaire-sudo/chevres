import { Pressable, Text, View } from 'react-native';
import { Checkbox } from '@/shared/components/Checkbox';
import {
  idOperation,
  operationsDeLaRubrique,
  type RubriqueOperations,
  type SensOperation,
} from '@/features/contacts/services/operationsInventaire';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/contacts/ChoixOperations.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.contacts.operations;

interface Props {
  rubriques: RubriqueOperations[];
  /** Les opérations cochées (voir idOperation). */
  valeur: readonly string[];
  /** Le seul sens proposé : un achat est une dépense, une vente est une recette. */
  sens: SensOperation;
  /** Les sens qu'une liste propose, quand il y a des exceptions à « sens » (par défaut, seulement « sens »). */
  sensPermis?: (categorie: string, liste: string) => SensOperation[];
  onChange: (operations: string[]) => void;
}

/**
 * Les opérations d'une catégorie de contact, rangées comme l'inventaire : un cadre par catégorie (Produits finis, Produits animaux…), cochée
 * d'un coup ou avec « Tous les achats » (ou « Toutes les ventes »), puis un tableau : une ligne par liste, avec sa case. Les dépenses ne proposent
 * que des achats, les recettes que des ventes.
 */
export function ChoixOperations({ rubriques, valeur, sens, sensPermis, onChange }: Props) {
  const permis = (categorie: string, liste: string): SensOperation[] =>
    sensPermis?.(categorie, liste) ?? [sens];
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
        const ids = operationsDeLaRubrique(rubrique, sens);
        const idsPermis = rubrique.listes.flatMap((l) =>
          permis(rubrique.categorie, l.cle).map((s) => idOperation(rubrique.categorie, l.cle, s)),
        );
        const colonnes = (['achat', 'vente'] as const).filter((s) =>
          rubrique.listes.some((l) => permis(rubrique.categorie, l.cle).includes(s)),
        );
        return (
          <View key={rubrique.categorie} style={styles.cadre}>
            <View style={styles.entete}>
              <Checkbox
                label={rubrique.titre}
                value={toutes(idsPermis)}
                onChange={(cochee) => poser(idsPermis, cochee)}
              />
            </View>
            <View style={styles.raccourcis}>
              <Pressable onPress={() => poser(ids, !toutes(ids))} hitSlop={6} accessibilityRole="button">
                <Text style={commonStyles.lien}>
                  {sens === 'vente' ? T.toutesLesVentes : T.tousLesAchats}
                </Text>
              </Pressable>
            </View>
            <View style={styles.ligneTitres}>
              <Text style={[styles.titreColonne, styles.colonneNom]}>{T.liste}</Text>
              {colonnes.map((s) => (
                <Text key={s} style={[styles.titreColonne, styles.colonneCase]}>
                  {s === 'vente' ? (sens === 'achat' ? T.sortie : T.vente) : T.achat}
                </Text>
              ))}
            </View>
            {rubrique.listes.map((liste) => (
              <View key={liste.cle} style={styles.ligne}>
                <Text style={[styles.nom, styles.colonneNom]}>{liste.titre}</Text>
                {colonnes.map((s) => (
                  <View key={s} style={styles.colonneCase}>
                    {permis(rubrique.categorie, liste.cle).includes(s) ? (
                      <Checkbox
                        label=""
                        value={choisies.has(idOperation(rubrique.categorie, liste.cle, s))}
                        onChange={(cochee) => poser([idOperation(rubrique.categorie, liste.cle, s)], cochee)}
                      />
                    ) : null}
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}
