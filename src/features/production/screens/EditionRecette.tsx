import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChampIngredientsPlat } from '@/features/production/components/ChampIngredientsPlat';
import { GROUPES_DES_INGREDIENTS, ingredientsProposables, type SaisieIngredient } from '@/features/production/services/ingredientsPlat';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuProduit, enregistrerRecette, supprimerRecette } from '@/features/stock/services/lots';
import type { ArchiveStock, RecetteDeFabrication } from '@/features/stock/types';
import { Button } from '@/shared/components/Button';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { FormField } from '@/shared/components/FormField';
import { Screen } from '@/shared/components/Screen';
import { SectionForm } from '@/shared/components/SectionForm';
import { SelectField } from '@/shared/components/SelectField';
import { TYPE_FROMAGE } from '@/shared/constants/comptabilite';
import { GENRE_ARTICLE, PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { generateId } from '@/shared/utils/id';
import { parseDecimal } from '@/shared/utils/nombres';
import { ROUTES } from '@/shared/constants/routes';

const T = TEXTES.production.recettes;
const E = T.edition;

/** Les produits qui ont une bibliothèque de recettes, dans l'ordre de la liste. */
const PRODUITS = [PRODUIT_A_LOTS.FROMAGE, PRODUIT_A_LOTS.CHARCUTERIE, PRODUIT_A_LOTS.PLAT, PRODUIT_A_LOTS.SAVON] as const;
const TOUT_LE_PRODUIT = '';
/** Les fromages qui s'affinent : le vieux (affiné), le crottin et le brocciu. */
const ARTICLES_QUI_AFFINENT = [
  `${GENRE_ARTICLE.FROMAGE}:${TYPE_FROMAGE.AFFINE}`,
  `${GENRE_ARTICLE.FROMAGE}:${TYPE_FROMAGE.CROTTIN}`,
  `${GENRE_ARTICLE.FROMAGE}:${TYPE_FROMAGE.BROCCIU}`,
];

/** Un conditionnement (boîte, bocal, sachet…) : il a sa propre liste à l'écran, pas celle des ingrédients. */
const estEmballage = (cle: string) => cle.startsWith(`${GENRE_ARTICLE.EMBALLAGE}:`);

/** Les ingrédients enregistrés d'une recette, sous la forme saisie à l'écran. */
const saisies = (recette: RecetteDeFabrication): SaisieIngredient[] =>
  recette.ingredients.map((i, n) => ({ cle: `r${n}`, article: i.article, quantite: String(i.quantite).replace('.', ','), unite: i.unite }));

/**
 * L'ajout et la modification d'une recette de la bibliothèque (Atelier › Recettes) : on choisit d'abord le produit (fromage, charcuterie, plat préparé, savon), puis le
 * nom, l'article concerné (ou tout le produit), les ingrédients du stock avec leur quantité et l'explicatif. Une recette existante se modifie ou se supprime d'ici.
 */
export default function EditionRecette() {
  const router = useRouter();
  const { espece } = useEtablissement();
  const { id, produit: produitDuLien } = useLocalSearchParams<{ id?: string; produit?: string }>();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [existante, setExistante] = useState<RecetteDeFabrication | null>(null);
  const [produit, setProduit] = useState<string>(
    PRODUITS.includes(produitDuLien as never) ? (produitDuLien as string) : PRODUIT_A_LOTS.FROMAGE,
  );
  const [article, setArticle] = useState(TOUT_LE_PRODUIT);
  const [notes, setNotes] = useState('');
  const [joursCure, setJoursCure] = useState('');
  const [joursAffinage, setJoursAffinage] = useState('');
  const [etapes, setEtapes] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<SaisieIngredient[]>([]);
  const [conditionnement, setConditionnement] = useState<SaisieIngredient[]>([]);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);

  useFocusEffect(
    useCallback(() => {
      lireArchiveStock()
        .then((a) => {
          setArchive(a);
          const r = id ? a.recettes?.find((x) => x.id === id) : undefined;
          if (!r) return;
          setExistante(r);
          setProduit(r.produit);
          setArticle(r.article ?? TOUT_LE_PRODUIT);
          setNotes(r.notes ?? '');
          setJoursCure(r.joursCure ? String(r.joursCure) : '');
          setJoursAffinage(r.joursAffinage ? String(r.joursAffinage) : '');
          setEtapes(r.etapes ?? []);
          setIngredients(saisies(r).filter((i) => !estEmballage(i.article)));
          setConditionnement(saisies(r).filter((i) => estEmballage(i.article)));
        })
        .catch(() => undefined);
    }, [id]),
  );

  const articles = useMemo(
    () => (archive ? articlesDuProduit(produit as (typeof PRODUITS)[number], archive, espece) : []),
    [archive, produit, espece],
  );
  // Les mêmes groupes pour tous les produits : consommables, produits animaux, conditionnement, et le lait (fromage, savon).
  const proposables = useMemo(() => {
    if (!archive) return [];
    if (produit === PRODUIT_A_LOTS.SAVON) return ingredientsProposables(archive, GROUPES_DES_INGREDIENTS, { listesSeulement: true });
    if (produit === PRODUIT_A_LOTS.PLAT) return ingredientsProposables(archive, GROUPES_DES_INGREDIENTS);
    return ingredientsProposables(archive, GROUPES_DES_INGREDIENTS, { fromagerie: true });
  }, [archive, produit]);

  // Le nom de la recette est celui de son article (ou du produit entier) : il n'y a plus de nom à taper.
  const nomDeLaRecette = article ? (articles.find((a) => a.cle === article)?.libelle ?? '') : (T.page.produit[produit as never] as string);
  // Le vieux, le crottin et le brocciu s'affinent : ils ont des jours d'affinage.
  const fromageQuiAffine = produit === PRODUIT_A_LOTS.FROMAGE && ARTICLES_QUI_AFFINENT.includes(article);
  const enregistrer = async () => {
    await enregistrerRecette({
      id: existante?.id ?? generateId(),
      produit,
      article: article || undefined,
      nom: nomDeLaRecette,
      notes: notes.trim() || undefined,
      joursCure: produit === PRODUIT_A_LOTS.SAVON ? Math.round(parseDecimal(joursCure)) || undefined : undefined,
      joursAffinage: fromageQuiAffine ? Math.round(parseDecimal(joursAffinage)) || undefined : undefined,
      etapes: etapes.map((e) => e.trim()).filter(Boolean),
      ingredients: [...ingredients, ...conditionnement]
        // La quantité se saisit dans l'unité du stock de l'ingrédient : la recette la garde dans cette unité.
        .map((i) => ({ article: i.article, quantite: parseDecimal(i.quantite), unite: archive?.unites?.[i.article] }))
        .filter((i) => i.article && i.quantite > 0),
    });
    // La recette enregistrée (ou modifiée) revient à la bibliothèque des recettes.
    router.replace(ROUTES.PRODUCTION_RECETTES as never);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existante ? E.titreModifier : E.titreNouvelle }} />
      <SelectField<string>
        label={E.produit}
        value={produit}
        onChange={(p) => {
          setProduit(p);
          // L'article et les ingrédients d'un autre produit ne valent plus.
          setArticle(TOUT_LE_PRODUIT);
          setIngredients([]);
          setConditionnement([]);
        }}
        options={PRODUITS.map((p) => ({ value: p, label: T.page.produit[p] }))}
      />
      <SelectField<string>
        label={E.article}
        value={article}
        onChange={setArticle}
        options={[{ value: TOUT_LE_PRODUIT, label: E.toutLeProduit }, ...articles.map((a) => ({ value: a.cle, label: a.libelle }))]}
      />
      <View style={{ padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: colors.border, backgroundColor: colors.surface }}>
        <Text style={commonStyles.mutedItalic}>{produit === PRODUIT_A_LOTS.SAVON ? T.referenceSavon : T.referencePieces}</Text>
      </View>
      {produit === PRODUIT_A_LOTS.SAVON ? (
        <FormField label={E.joursCure} value={joursCure} onChangeText={(v) => /^\d*$/.test(v) && setJoursCure(v)} keyboardType="number-pad" />
      ) : null}
      {fromageQuiAffine ? (
        <FormField
          label={E.joursAffinage}
          value={joursAffinage}
          onChangeText={(v) => /^\d*$/.test(v) && setJoursAffinage(v)}
          keyboardType="number-pad"
        />
      ) : null}
      <SectionForm titre={TEXTES.production.fabricationPlat.ingredients.titre}>
        <ChampIngredientsPlat
          valeur={ingredients}
          onChange={setIngredients}
          archive={archive}
          // Un produit ne se consomme pas lui-même : le brocciu affiné prend du brocciu frais, pas du brocciu affiné.
          proposables={proposables.filter((a) => !estEmballage(a.cle) && a.cle !== article)}
          libelleQuantite={produit === PRODUIT_A_LOTS.SAVON ? T.quantiteParKg : T.quantiteParPiece}
          avecUnite
        />
      </SectionForm>
      <SectionForm titre="Conditionnement">
        <ChampIngredientsPlat
          valeur={conditionnement}
          onChange={setConditionnement}
          archive={archive}
          proposables={proposables.filter((a) => estEmballage(a.cle))}
          libelleQuantite={produit === PRODUIT_A_LOTS.SAVON ? T.quantiteParKg : T.quantiteParPiece}
          ajouter="Ajouter un conditionnement"
          aucun="Aucun conditionnement : rien ne sort du stock."
          libelleProduit="Emballage"
          placeholderProduit="Choisir un emballage"
          avecUnite
        />
      </SectionForm>
      <SectionForm titre="Préparation">
        {etapes.length === 0 ? <Text style={commonStyles.mutedItalic}>Aucune étape n’est renseignée.</Text> : null}
        {etapes.map((texte, n) => (
          <View key={n} style={{ gap: 6 }}>
            <View style={commonStyles.rowSpaceBetween}>
              <Text style={commonStyles.lineBold}>{`Étape ${n + 1}`}</Text>
              <Pressable
                onPress={() => setEtapes(etapes.filter((_, k) => k !== n))}
                hitSlop={8}
                accessibilityLabel="Retirer l’étape"
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
            <FormField value={texte} onChangeText={(v) => setEtapes(etapes.map((e, k) => (k === n ? v : e)))} multiline />
          </View>
        ))}
        <Button variant="secondary" label="+ Ajouter une étape" onPress={() => setEtapes([...etapes, ''])} />
      </SectionForm>
      <FormField label={T.notes} value={notes} onChangeText={setNotes} multiline style={commonStyles.textarea} />
      <View style={commonStyles.gap10}>
        <Button label={E.enregistrer} onPress={enregistrer} />
        {existante ? <Button variant="danger" label={T.supprimer} onPress={() => setSuppressionOuverte(true)} /> : null}
      </View>
      <ConfirmModal
        visible={suppressionOuverte}
        title={T.supprimerQuestion(existante?.nom ?? '')}
        message={T.supprimerMessage}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setSuppressionOuverte(false)}
        onConfirm={async () => {
          setSuppressionOuverte(false);
          if (existante) await supprimerRecette(existante.id);
          router.replace(ROUTES.PRODUCTION_RECETTES as never);
        }}
      />
    </Screen>
  );
}
