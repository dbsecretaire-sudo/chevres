import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { lireArchiveStock } from '@/features/stock/repository';
import { derniereBoucle, estArticleBoucle, estBoucleNumerotee } from '@/features/stock/services/boucles';
import { articlesDeFournitures, articlesDuGenre, type ArticleAffiche } from '@/features/stock/services/stock';
import { GENRE_ARTICLE } from '@/shared/constants/stock';
import {
  ligneProductionVide,
  type LigneProductionForm,
} from '@/features/comptabilite/forms/lignesProduction';
import { parseDecimal } from '@/shared/utils/nombres';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  lignes: LigneProductionForm[];
  onChange: (lignes: LigneProductionForm[]) => void;
  /** Seules les boucles d'identification sont proposées (les factures de la chambre d'agriculture). */
  seulementBoucles?: boolean;
}

const T = TEXTES.comptabilite.lignesProductionEditor;

/**
 * Carte « Détail par fourniture » (achat de production) : une facture peut regrouper plusieurs fournitures. Chacune se choisit
 * (avec recherche) dans la liste de l'inventaire — emballages, matériel, boucles… ; le crayon mène à l'inventaire et la liste s'y met
 * à jour. La quantité de chaque fourniture entre au stock ; le total de la facture est la somme des montants.
 */
export function LignesProductionEditor({ lignes, onChange, seulementBoucles }: Props) {
  const router = useRouter();
  const retour = useAdresseCourante();
  const [articles, setArticles] = useState<ArticleAffiche[]>([]);

  // La liste est relue à chaque retour sur l'écran : ce qu'on vient d'ajouter à l'inventaire y apparaît.
  useFocusEffect(
    useCallback(() => {
      lireArchiveStock().then((archive) =>
        setArticles(
          seulementBoucles ? articlesDuGenre(GENRE_ARTICLE.BOUCLE, archive) : articlesDeFournitures(archive),
        ),
      );
    }, [seulementBoucles]),
  );

  const maj = (key: string, patch: Partial<LigneProductionForm>) =>
    onChange(lignes.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const supprimer = (key: string) =>
    onChange(lignes.length > 1 ? lignes.filter((l) => l.key !== key) : lignes);

  return (
    <Card style={commonStyles.gap10}>
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={commonStyles.lineBold}>{T.detailParFourniture}</Text>
        <Pressable
          style={commonStyles.boutonPastille}
          onPress={() => onChange([...lignes, ligneProductionVide()])}
        >
          <Ionicons name="add-circle" size={28} color={colors.ajout} />
        </Pressable>
      </View>

      {lignes.map((ligne, index) => {
        const boucles = estArticleBoucle(ligne.article);
        /** Une boucle rouge n'a pas de numéro à l'achat : seulement sa quantité. */
        const numerotee = estBoucleNumerotee(ligne.article);
        const quantite = parseDecimal(ligne.quantite);
        const dernier =
          numerotee && ligne.bouclesDebut && quantite
            ? derniereBoucle(ligne.bouclesDebut, quantite)
            : undefined;
        return (
          <View key={ligne.key} style={commonStyles.gap8}>
            <View style={commonStyles.rowSpaceBetween}>
              <Text style={commonStyles.lineSemiBold}>{T.fournitureValeur(index + 1)}</Text>
              {lignes.length > 1 ? (
                <Pressable style={commonStyles.boutonPastille} onPress={() => supprimer(ligne.key)}>
                  <Ionicons name="close-circle" size={28} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>
            <View style={commonStyles.rowFin}>
              <View style={commonStyles.flex2}>
                <SelectFieldEditable<string>
                  label={T.fournitureValeur(index + 1)}
                  libelleCache
                  searchable
                  placeholder={T.choixFourniture}
                  value={ligne.article}
                  onChange={(valeur) =>
                    maj(ligne.key, {
                      article: valeur,
                      ...(valeur ? {} : { quantite: '' }),
                      ...(estBoucleNumerotee(valeur) ? {} : { bouclesDebut: '' }),
                    })
                  }
                  options={[
                    { value: '', label: T.horsStock },
                    ...articles.map((a) => ({ value: a.cle, label: a.libelle })),
                  ]}
                  onEdit={() => router.push(ROUTES.stockDepuis(retour))}
                />
              </View>
              {ligne.article ? (
                <View style={commonStyles.flex1}>
                  <FormField
                    label={T.quantiteCourt}
                    value={ligne.quantite}
                    onChangeText={(v) => {
                      if (!(boucles ? /^\d*$/ : /^\d*[.,]?\d*$/).test(v)) return;
                      maj(ligne.key, { quantite: v });
                    }}
                    keyboardType={boucles ? 'number-pad' : 'decimal-pad'}
                    placeholder={T.ex100}
                  />
                </View>
              ) : null}
              <View style={commonStyles.flex1}>
                <FormField
                  label={T.montantTtcCourt}
                  value={ligne.montant}
                  onChangeText={(v) => maj(ligne.key, { montant: v })}
                  keyboardType="decimal-pad"
                  placeholder={T.ex120}
                />
              </View>
            </View>
            {numerotee ? (
              <>
                <FormField
                  label={T.premiereBoucle}
                  required
                  value={ligne.bouclesDebut}
                  onChangeText={(v) => maj(ligne.key, { bouclesDebut: v.trim() })}
                />
                <Text style={commonStyles.note}>
                  {dernier ? T.derniereBoucle(dernier) : T.premiereBoucleAide}
                </Text>
              </>
            ) : null}
          </View>
        );
      })}
    </Card>
  );
}
