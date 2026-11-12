import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import type { SaisieIngredient } from '@/features/production/services/ingredientsPlat';
import { enregistrerRecette, quantiteDeLaFabrication, recettesDuProduit, supprimerRecette } from '@/features/stock/services/lots';
import { libelleArticle } from '@/features/stock/services/stock';
import { quantiteDansLUniteDuStock } from '@/features/stock/services/unites';
import type { ArchiveStock, RecetteDeFabrication } from '@/features/stock/types';
import { Button } from '@/shared/components/Button';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { SelectField } from '@/shared/components/SelectField';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { generateId } from '@/shared/utils/id';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.production.recettes;
const AUCUNE = '';

interface Props {
  /** « fromage », « charcuterie », « plat » ou « savon » : la bibliothèque de ce produit. */
  produit: string;
  /** L'article fabriqué : les recettes qui lui sont propres, et celles du produit entier, sont proposées ; une nouvelle recette lui est rattachée. */
  article?: string;
  /** Les notes saisies dans la fabrication : elles font l'explicatif de la recette. */
  notes?: string;
  archive: ArchiveStock | null;
  /** Ce qui est saisi dans la fabrication : de quoi faire une recette. */
  ingredients: SaisieIngredient[];
  /**
   * Le nombre de pièces de la fabrication (ou le poids total d'un savon). Une recette se garde pour une pièce (ou un kilo) : reprise, ses quantités se multiplient
   * par ce nombre ; gardée, les quantités saisies se divisent par lui.
   */
  facteur: number;
  joursCure?: number;
  /** Une recette est choisie : la fabrication la reprend, quantités calculées. */
  onAppliquer: (recette: RecetteDeFabrication) => void;
  /** La bibliothèque a changé : la fabrication relit le stock. */
  onChange: () => void;
}

/**
 * La bibliothèque de recettes d'une fabrication : on en choisit une pour reprendre d'un appui ses ingrédients, leurs quantités calculées d'après le nombre
 * (ou le poids) de la fabrication, on garde ce qu'on vient de saisir comme recette, on la met à jour ou on la retire. Les lots d'ingrédients ne sont pas gardés :
 * ils changent à chaque fabrication.
 */
export function ChampRecette({
  produit,
  article,
  notes,
  archive,
  ingredients,
  facteur,
  joursCure,
  onAppliquer,
  onChange,
}: Props) {
  const recettes = archive ? recettesDuProduit(archive, produit, article) : [];
  const [choisie, setChoisie] = useState(AUCUNE);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const courante = recettes.find((r) => r.id === choisie);
  // Le nom de la recette est celui de son article (ou du produit entier) : il n'y a plus de nom à taper.
  const nomDeLaRecette = article && archive ? libelleArticle(article, archive) : (T.page.produit[produit as never] as string);
  // Sans nombre (ou poids) de fabrication, ni reprendre ni garder une recette : les quantités ne se calculeraient pas.
  const facteurOk = facteur > 0;
  const avant = produit === PRODUIT_A_LOTS.SAVON ? T.avantRecetteSavon : T.avantRecette;

  /** Ce qui est saisi, ramené à une pièce (ou à un kilo) : les ingrédients sans article ni quantité n'en font pas partie. */
  const depuisLaSaisie = (id: string, nom: string): RecetteDeFabrication => ({
    id,
    produit,
    article: article || undefined,
    nom,
    notes: notes?.trim() || undefined,
    joursCure,
    // La fabrication saisit dans l'unité du stock de chaque ingrédient : la recette la garde dans cette même unité.
    ingredients: ingredients
      .map((i) => ({
        article: i.article,
        quantite: quantiteDeLaFabrication(parseDecimal(i.quantite) / facteur, 1),
        unite: archive?.unites?.[i.article],
      }))
      .filter((i) => i.article && i.quantite > 0),
  });
  const rienASauver = ingredients.every((i) => !i.article);

  const enregistrerNouvelle = async () => {
    if (!facteurOk) return Alert.alert(avant);
    const id = generateId();
    await enregistrerRecette(depuisLaSaisie(id, nomDeLaRecette));
    setChoisie(id);
    onChange();
  };
  const mettreAJour = async () => {
    if (!courante) return;
    if (!facteurOk) return Alert.alert(avant);
    await enregistrerRecette(depuisLaSaisie(courante.id, nomDeLaRecette));
    onChange();
    Alert.alert(T.misAJour(courante.nom));
  };
  const retirer = async () => {
    setSuppressionOuverte(false);
    if (!courante) return;
    await supprimerRecette(courante.id);
    setChoisie(AUCUNE);
    onChange();
  };

  return (
    <View style={commonStyles.gap10}>
      {recettes.length > 0 ? (
        <SelectField<string>
          label={T.titre}
          value={choisie}
          onChange={(id) => {
            const r = recettes.find((x) => x.id === id);
            if (!r) return setChoisie(id);
            if (!facteurOk) return Alert.alert(avant);
            setChoisie(id);
            // Les quantités de la recette se rapportent à une pièce (ou un kilo) : elles se calculent pour ce qu'on fabrique.
            // Chaque quantité passe dans l'unité du stock de son ingrédient, puis se multiplie par le nombre (ou le poids).
            onAppliquer({
              ...r,
              ingredients: r.ingredients.map((i) => ({
                article: i.article,
                unite: archive?.unites?.[i.article],
                quantite: quantiteDeLaFabrication(quantiteDansLUniteDuStock(i.quantite, i.unite, archive?.unites?.[i.article]), facteur),
              })),
            });
          }}
          options={[{ value: AUCUNE, label: T.aucune }, ...recettes.map((r) => ({ value: r.id, label: r.nom }))]}
        />
      ) : (
        <Text style={commonStyles.note}>{T.bibliothequeVide}</Text>
      )}
      <View style={commonStyles.gap10}>
        <Button variant="secondary" label={T.enregistrer} onPress={() => (rienASauver ? Alert.alert(T.rienASauver) : enregistrerNouvelle())} />
        {courante ? (
          <>
            <Button variant="secondary" label={T.mettreAJour} onPress={mettreAJour} />
            <Button variant="danger" label={T.supprimer} onPress={() => setSuppressionOuverte(true)} />
          </>
        ) : null}
      </View>
      <ConfirmModal
        visible={suppressionOuverte}
        title={T.supprimerQuestion(courante?.nom ?? '')}
        message={T.supprimerMessage}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setSuppressionOuverte(false)}
        onConfirm={retirer}
      />
    </View>
  );
}
