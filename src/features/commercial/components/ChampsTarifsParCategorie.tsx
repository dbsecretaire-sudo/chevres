import { useState } from 'react';
import { Text, View } from 'react-native';
import { SelectField } from '@/shared/components/SelectField';
import { ChampTarif } from '@/features/commercial/components/ChampTarif';
import { CATEGORIE_CLIENT_PAR_DEFAUT } from '@/shared/constants/clients';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatMontant } from '@/shared/utils/dates';

const T = TEXTES.commercial.tarifs;

interface Props {
  article: string;
  categories: { id: string; nom: string }[];
  /** Les prix déjà définis de l'article, par catégorie de contact. */
  valeurs: Record<string, number | undefined>;
  prixInventaire: number | undefined;
  /** Le prix d'une viande se compte au kilo. */
  parKg?: boolean;
}

/**
 * Les prix d'un article selon la catégorie de contact : on choisit d'abord la catégorie (la liste, « Particulier » d'office), puis son prix ;
 * ceux déjà définis pour les autres catégories se lisent en une ligne dessous. Une seule saisie à la fois, au lieu d'un champ par catégorie.
 */
export function ChampsTarifsParCategorie({ article, categories, valeurs, prixInventaire, parKg }: Props) {
  const [choisie, setChoisie] = useState(
    categories.find((c) => c.id === CATEGORIE_CLIENT_PAR_DEFAUT)?.id ?? categories[0]?.id ?? '',
  );
  const categorie = categories.find((c) => c.id === choisie) ?? categories[0];
  if (!categorie) return null;
  const autres = categories.filter((c) => c.id !== categorie.id && valeurs[c.id] !== undefined);
  return (
    <View style={commonStyles.gap6}>
      <SelectField<string>
        label={T.categorieDuContact}
        value={categorie.id}
        onChange={setChoisie}
        options={categories.map((c) => ({
          value: c.id,
          label: valeurs[c.id] !== undefined ? `${c.nom} · ${formatMontant(valeurs[c.id]!)}` : c.nom,
        }))}
      />
      <ChampTarif
        key={`${article}|${categorie.id}|${valeurs[categorie.id] ?? ''}`}
        article={article}
        categorie={categorie.id}
        nomCategorie={categorie.nom}
        valeur={valeurs[categorie.id]}
        prixInventaire={prixInventaire}
        parKg={parKg}
      />
      {autres.length > 0 ? (
        <Text style={commonStyles.note}>
          {T.autresTarifs(autres.map((c) => `${c.nom} : ${formatMontant(valeurs[c.id]!)}`).join(' · '))}
        </Text>
      ) : null}
    </View>
  );
}
