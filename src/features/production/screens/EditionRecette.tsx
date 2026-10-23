import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChampIngredientsPlat } from '@/features/production/components/ChampIngredientsPlat';
import { ingredientsProposables, type SaisieIngredient } from '@/features/production/services/ingredientsPlat';
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
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { generateId } from '@/shared/utils/id';
import { parseDecimal } from '@/shared/utils/nombres';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';

const T = TEXTES.production.recettes;
const E = T.edition;

/** Les produits qui ont une bibliothèque de recettes, dans l'ordre de la liste. */
const PRODUITS = [PRODUIT_A_LOTS.FROMAGE, PRODUIT_A_LOTS.CHARCUTERIE, PRODUIT_A_LOTS.PLAT, PRODUIT_A_LOTS.SAVON] as const;
const TOUT_LE_PRODUIT = '';

/** Les ingrédients enregistrés d'une recette, sous la forme saisie à l'écran. */
const saisies = (recette: RecetteDeFabrication): SaisieIngredient[] =>
  recette.ingredients.map((i, n) => ({ cle: `r${n}`, article: i.article, quantite: String(i.quantite).replace('.', ',') }));

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
  const [nom, setNom] = useState('');
  const [article, setArticle] = useState(TOUT_LE_PRODUIT);
  const [notes, setNotes] = useState('');
  const [quantite, setQuantite] = useState('');
  const [litres, setLitres] = useState('');
  const [joursCure, setJoursCure] = useState('');
  const [ingredients, setIngredients] = useState<SaisieIngredient[]>([]);
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
          setNom(r.nom);
          setArticle(r.article ?? TOUT_LE_PRODUIT);
          setNotes(r.notes ?? '');
          setQuantite(r.quantite ? String(r.quantite) : '');
          setLitres(r.litresLait ? String(r.litresLait).replace('.', ',') : '');
          setJoursCure(r.joursCure ? String(r.joursCure) : '');
          setIngredients(saisies(r));
        })
        .catch(() => undefined);
    }, [id]),
  );

  const articles = useMemo(
    () => (archive ? articlesDuProduit(produit as (typeof PRODUITS)[number], archive, espece) : []),
    [archive, produit, espece],
  );
  const proposables = useMemo(() => {
    if (!archive) return [];
    const groupes = {
      fromages: TEXTES.production.fabricationPlat.ingredients.groupeFromages,
      charcuterie: TEXTES.production.fabricationPlat.ingredients.groupeCharcuterie,
      autres: TEXTES.production.fabricationPlat.ingredients.groupeAutres,
      fromagerie: T.groupeFromagerie,
      animaux: T.groupeAnimaux,
    };
    if (produit === PRODUIT_A_LOTS.SAVON) return ingredientsProposables(archive, groupes, { listesSeulement: true });
    if (produit === PRODUIT_A_LOTS.PLAT) return ingredientsProposables(archive, groupes);
    return ingredientsProposables(archive, { ...groupes, fromages: '', charcuterie: '' }, { fromagerie: true });
  }, [archive, produit]);

  const enregistrer = async () => {
    if (!nom.trim()) return Alert.alert(E.nomRequis);
    await enregistrerRecette({
      id: existante?.id ?? generateId(),
      produit,
      article: article || undefined,
      nom: nom.trim(),
      notes: notes.trim() || undefined,
      quantite: Math.round(parseDecimal(quantite)) || undefined,
      litresLait: produit === PRODUIT_A_LOTS.SAVON || produit === PRODUIT_A_LOTS.FROMAGE ? parseDecimal(litres) || undefined : undefined,
      joursCure: produit === PRODUIT_A_LOTS.SAVON ? Math.round(parseDecimal(joursCure)) || undefined : undefined,
      ingredients: ingredients
        .map((i) => ({ article: i.article, quantite: parseDecimal(i.quantite) }))
        .filter((i) => i.article && i.quantite > 0),
    });
    retournerALaPageDAvant(router);
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
        }}
        options={PRODUITS.map((p) => ({ value: p, label: T.page.produit[p] }))}
      />
      <FormField label={E.nom} value={nom} onChangeText={setNom} placeholder={T.nomExemple} />
      <SelectField<string>
        label={E.article}
        value={article}
        onChange={setArticle}
        options={[{ value: TOUT_LE_PRODUIT, label: E.toutLeProduit }, ...articles.map((a) => ({ value: a.cle, label: a.libelle }))]}
      />
      <FormField
        label={E.quantite}
        value={quantite}
        onChangeText={(v) => /^\d*$/.test(v) && setQuantite(v)}
        keyboardType="number-pad"
      />
      {produit === PRODUIT_A_LOTS.SAVON || produit === PRODUIT_A_LOTS.FROMAGE ? (
        <FormField
          label={produit === PRODUIT_A_LOTS.SAVON ? E.litresSavon : E.litresFromage}
          value={litres}
          onChangeText={(v) => /^\d*[.,]?\d*$/.test(v) && setLitres(v)}
          keyboardType="decimal-pad"
        />
      ) : null}
      {produit === PRODUIT_A_LOTS.SAVON ? (
        <FormField label={E.joursCure} value={joursCure} onChangeText={(v) => /^\d*$/.test(v) && setJoursCure(v)} keyboardType="number-pad" />
      ) : null}
      <SectionForm titre={TEXTES.production.fabricationPlat.ingredients.titre}>
        <ChampIngredientsPlat valeur={ingredients} onChange={setIngredients} archive={archive} proposables={proposables} />
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
          retournerALaPageDAvant(router);
        }}
      />
    </Screen>
  );
}
