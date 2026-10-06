import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { SelectLien } from '@/shared/components/SelectLien';
import { lireArchiveBar } from '@/features/bar/repository';
import {
  ligneMarchandiseVide,
  type LigneMarchandiseForm,
} from '@/features/comptabilite/forms/lignesMarchandises';
import {
  RUBRIQUE_MARCHANDISE,
  UNITE_MARCHANDISE,
  UNITES_MARCHANDISE_PROPOSEES,
} from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_RUBRIQUE_MARCHANDISE, LABEL_UNITE_MARCHANDISE } from '@/shared/textes/libelles';

type Rubrique = ValeurDe<typeof RUBRIQUE_MARCHANDISE>;

interface Props {
  lignes: LigneMarchandiseForm[];
  onChange: (lignes: LigneMarchandiseForm[]) => void;
}

const T = TEXTES.comptabilite.lignesMarchandisesEditor;

/**
 * Carte « Détail par marchandise » (achats d'un gîte) : chaque ligne choisit l'activité servie (bar, restaurant, activité
 * annexe), la marchandise dans la liste du stock du bar (le crayon mène au stock et la liste s'y met à jour), la quantité
 * avec son unité, et le montant TTC.
 */
export function LignesMarchandisesEditor({ lignes, onChange }: Props) {
  const router = useRouter();
  const retour = useAdresseCourante();
  const [articles, setArticles] = useState<{ nom: string; rubrique?: string }[]>([]);

  // La liste est relue à chaque retour sur l'écran : ce qu'on vient d'ajouter au stock y apparaît.
  useFocusEffect(
    useCallback(() => {
      lireArchiveBar().then((bar) => {
        setArticles(
          [...bar.boissons, ...bar.aliments, ...bar.articles]
            .map((a) => ({ nom: a.nom, rubrique: a.rubrique }))
            .sort((a, b) => a.nom.localeCompare(b.nom)),
        );
      });
    }, []),
  );

  /** Les marchandises proposées pour une activité : celles qui lui sont propres, et celles tenues pour toutes les activités. */
  const marchandisesDe = (rubrique: Rubrique): string[] =>
    articles.filter((a) => !a.rubrique || a.rubrique === rubrique).map((a) => a.nom);

  const maj = (key: string, patch: Partial<LigneMarchandiseForm>) =>
    onChange(lignes.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const supprimer = (key: string) =>
    onChange(lignes.length > 1 ? lignes.filter((l) => l.key !== key) : lignes);

  return (
    <Card style={commonStyles.gap10}>
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={commonStyles.lineBold}>{T.detailParMarchandise}</Text>
        <Pressable
          style={commonStyles.boutonPastille}
          onPress={() => onChange([...lignes, ligneMarchandiseVide()])}
        >
          <Ionicons name="add-circle" size={28} color={colors.ajout} />
        </Pressable>
      </View>

      {lignes.map((ligne, index) => {
        const liste = marchandisesDe(ligne.rubrique);
        return (
          <View key={ligne.key} style={commonStyles.gap8}>
            <View style={commonStyles.rowSpaceBetween}>
              <Text style={commonStyles.lineSemiBold}>{T.marchandiseValeur(index + 1)}</Text>
              <SelectLien<Rubrique>
                label={T.rubrique}
                value={ligne.rubrique}
                onChange={(v) => maj(ligne.key, { rubrique: v, marchandise: '' })}
                options={Object.values(RUBRIQUE_MARCHANDISE).map((valeur) => ({
                  value: valeur,
                  label: LABEL_RUBRIQUE_MARCHANDISE[valeur],
                }))}
              />
            </View>
            <SelectFieldEditable<string>
              label={T.marchandiseValeur(index + 1)}
              libelleCache
              searchable
              placeholder={T.choixMarchandise}
              value={ligne.marchandise}
              onChange={(v) => maj(ligne.key, { marchandise: v })}
              options={liste.map((nom) => ({ value: nom, label: nom }))}
              onEdit={() => router.push(ROUTES.stockDepuis(retour))}
            />
            {liste.length === 0 ? <Text style={commonStyles.note}>{T.aucuneDansLeStock}</Text> : null}
            <View style={commonStyles.rowFin}>
              <View style={commonStyles.flex1}>
                <FormField
                  label={T.quantite}
                  value={ligne.quantite}
                  onChangeText={(v) => maj(ligne.key, { quantite: v })}
                  keyboardType="decimal-pad"
                  placeholder={T.ex10}
                />
              </View>
              <View style={commonStyles.flex1}>
                <SelectField<ValeurDe<typeof UNITE_MARCHANDISE>>
                  label={TEXTES.commun.general.unite}
                  value={ligne.unite}
                  onChange={(v) => maj(ligne.key, { unite: v })}
                  options={[
                    ...UNITES_MARCHANDISE_PROPOSEES,
                    // Une ancienne saisie en « Unité » ou en « Bac » reste affichée tant qu'on ne la change pas.
                    ...(UNITES_MARCHANDISE_PROPOSEES.some((u) => u === ligne.unite) ? [] : [ligne.unite]),
                  ].map((valeur) => ({
                    value: valeur,
                    label: LABEL_UNITE_MARCHANDISE[valeur],
                  }))}
                />
              </View>
              <View style={commonStyles.flex1}>
                <FormField
                  label={TEXTES.commun.general.montantTtc}
                  value={ligne.montant}
                  onChangeText={(v) => maj(ligne.key, { montant: v })}
                  keyboardType="decimal-pad"
                  placeholder={TEXTES.comptabilite.lignesAlimentationEditor.ex120}
                />
              </View>
              {lignes.length > 1 && (
                <Pressable style={commonStyles.boutonPastille} onPress={() => supprimer(ligne.key)}>
                  <Ionicons name="close-circle" size={28} color={colors.danger} />
                </Pressable>
              )}
            </View>
          </View>
        );
      })}
    </Card>
  );
}
