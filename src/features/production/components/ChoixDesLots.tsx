import { Text, View } from 'react-native';
import { Checkbox } from '@/shared/components/Checkbox';
import { lotsDeLIngredient, lotsPrisPourIngredient } from '@/features/production/services/ingredientsPlat';
import { estArticleFromage } from '@/features/stock/services/lots';
import type { ArchiveStock } from '@/features/stock/types';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_TYPE_FROMAGE } from '@/shared/textes/libelles';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.production.fabricationPlat.ingredients;

/**
 * Les lots d'un ingrédient qu'une fabrication consomme : les plus anciens sont cochés d'office (autant que la quantité entière), on coche d'autres lots à la
 * place. Un fromage porte son type après le numéro du lot (« FF26137-1 · 17/05/2026 (Frais) »). Rien à afficher pour un article sans lot.
 */
export function ChoixDesLots({
  archive,
  article,
  quantite,
  lotIds,
  onChange,
  afficheVide = false,
}: {
  archive: ArchiveStock;
  article: string;
  quantite: number;
  /** Les lots choisis ; absent : les plus anciens. */
  lotIds?: string[];
  onChange: (lotIds: string[]) => void;
  /** Le titre reste affiché même sans lot en stock (la fabrication le montre pour chaque fromage de la recette). */
  afficheVide?: boolean;
}) {
  const lots = lotsDeLIngredient(archive, article);
  if (lots.length === 0 && !afficheVide) return null;
  const pris = lotsPrisPourIngredient(archive, { article, lotIds }, quantite);
  const entier = Math.max(0, Math.floor(quantite));
  const typeDuFromage = estArticleFromage(article)
    ? LABEL_TYPE_FROMAGE[article.split(':')[1] as keyof typeof LABEL_TYPE_FROMAGE]
    : undefined;
  return (
    <View style={commonStyles.gap6}>
      <Text style={commonStyles.lineBold}>{T.lots}</Text>
      {lots.length === 0 ? <Text style={commonStyles.note}>{T.sansLot}</Text> : null}
      {lots.map((l) => (
        <Checkbox
          key={l.id}
          label={`${l.numero} · ${formatDateFR(l.dateFabrication)}${typeDuFromage ? ` (${typeDuFromage})` : ''}`}
          value={pris.includes(l.id)}
          onChange={(coche) => onChange(coche ? [...pris, l.id] : pris.filter((x) => x !== l.id))}
          disabled={!pris.includes(l.id) && pris.length >= entier}
        />
      ))}
      {lots.length > 0 ? <Text style={commonStyles.note}>{T.compteur(pris.length, lots.length)}</Text> : null}
    </View>
  );
}
