import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { NomModal } from '@/features/dossiers/components/NomModal';
import type { SaisieIngredient } from '@/features/production/services/ingredientsPlat';
import { enregistrerRecette, recettesDuProduit, supprimerRecette } from '@/features/stock/services/lots';
import type { ArchiveStock, RecetteDeFabrication } from '@/features/stock/types';
import { Button } from '@/shared/components/Button';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { SelectField } from '@/shared/components/SelectField';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { generateId } from '@/shared/utils/id';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.production.recettes;
const AUCUNE = '';

interface Props {
  /** « plat » ou « savon » : la bibliothèque de ce produit. */
  produit: string;
  archive: ArchiveStock | null;
  /** Ce qui est saisi dans la fabrication : de quoi faire une recette. */
  ingredients: SaisieIngredient[];
  quantite: string;
  litres?: string;
  joursCure?: number;
  /** Une recette est choisie : la fabrication la reprend. */
  onAppliquer: (recette: RecetteDeFabrication) => void;
  /** La bibliothèque a changé : la fabrication relit le stock. */
  onChange: () => void;
}

/**
 * La bibliothèque de recettes d'une fabrication (plats préparés, savons) : on en choisit une pour reprendre d'un appui ses ingrédients et leurs quantités, on garde
 * ce qu'on vient de saisir comme recette, on la met à jour ou on la retire. Les lots d'ingrédients ne sont pas gardés : ils changent à chaque fabrication.
 */
export function ChampRecette({ produit, archive, ingredients, quantite, litres, joursCure, onAppliquer, onChange }: Props) {
  const recettes = archive ? recettesDuProduit(archive, produit) : [];
  const [choisie, setChoisie] = useState(AUCUNE);
  const [nomOuvert, setNomOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const courante = recettes.find((r) => r.id === choisie);

  /** Ce qui est saisi, sous forme de recette (les ingrédients sans article ni quantité n'en font pas partie). */
  const depuisLaSaisie = (id: string, nom: string): RecetteDeFabrication => ({
    id,
    produit,
    nom,
    quantite: Math.round(Number(quantite) || 0) || undefined,
    litresLait: parseDecimal(litres ?? '') || undefined,
    joursCure,
    ingredients: ingredients
      .map((i) => ({ article: i.article, quantite: parseDecimal(i.quantite) }))
      .filter((i) => i.article && i.quantite > 0),
  });
  const rienASauver = ingredients.every((i) => !i.article);

  const enregistrerNouvelle = async (nom: string) => {
    setNomOuvert(false);
    if (!nom.trim()) return;
    const id = generateId();
    await enregistrerRecette(depuisLaSaisie(id, nom.trim()));
    setChoisie(id);
    onChange();
  };
  const mettreAJour = async () => {
    if (!courante) return;
    await enregistrerRecette(depuisLaSaisie(courante.id, courante.nom));
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
            setChoisie(id);
            const r = recettes.find((x) => x.id === id);
            if (r) onAppliquer(r);
          }}
          options={[{ value: AUCUNE, label: T.aucune }, ...recettes.map((r) => ({ value: r.id, label: r.nom }))]}
        />
      ) : (
        <Text style={commonStyles.note}>{T.bibliothequeVide}</Text>
      )}
      <View style={commonStyles.gap10}>
        <Button variant="secondary" label={T.enregistrer} onPress={() => (rienASauver ? Alert.alert(T.rienASauver) : setNomOuvert(true))} />
        {courante ? (
          <>
            <Button variant="secondary" label={T.mettreAJour} onPress={mettreAJour} />
            <Button variant="danger" label={T.supprimer} onPress={() => setSuppressionOuverte(true)} />
          </>
        ) : null}
      </View>
      <NomModal
        visible={nomOuvert}
        titre={T.nomTitre}
        placeholder={T.nomExemple}
        onValider={enregistrerNouvelle}
        onAnnuler={() => setNomOuvert(false)}
      />
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
