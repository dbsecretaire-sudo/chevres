import { Text, View } from 'react-native';
import { Checkbox } from '@/shared/components/Checkbox';
import { affinesPossibles, fromagesAffinables } from '@/features/production/services/affines';
import { lotsDeLIngredient } from '@/features/production/services/ingredientsPlat';
import { libelleArticle } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { commonStyles } from '@/shared/styles/commonStyles';
import { LABEL_TYPE_FROMAGE } from '@/shared/textes/libelles';
import { formatDateFR } from '@/shared/utils/dates';

/**
 * Les lots de fromage frais (ou crottin, brocciu…) qu'un affiné prend au stock : on coche les lots, et le nombre d'affinés s'en déduit. Même choix que sur
 * la tablette, sans nombre à taper.
 */
export function ChoixLotsAffine({
  archive,
  produit,
  article,
  lotsChoisis,
  onChange,
}: {
  archive: ArchiveStock | null;
  produit: string;
  article: string;
  /** Les lots cochés, par fromage de la recette. */
  lotsChoisis: Record<string, string[]>;
  onChange: (lotsChoisis: Record<string, string[]>) => void;
}) {
  if (!archive || !article) return null;
  const fromages = fromagesAffinables(archive, produit, article);
  const nombre = affinesPossibles(archive, produit, article, lotsChoisis);

  return (
    <View style={commonStyles.gap6}>
      {fromages.length === 0 ? <Text style={commonStyles.note}>Aucun fromage dans la recette : rien à prendre au stock.</Text> : null}
      {fromages.map((f) => {
        const lots = lotsDeLIngredient(archive, f.article);
        const pris = lotsChoisis[f.article] ?? [];
        const typeDuFromage = LABEL_TYPE_FROMAGE[f.article.split(':')[1] as keyof typeof LABEL_TYPE_FROMAGE];
        return (
          <View key={f.article} style={commonStyles.gap6}>
            <Text style={commonStyles.lineBold}>{`${libelleArticle(f.article, archive)} · ${f.parPiece} par affiné`}</Text>
            {lots.length === 0 ? <Text style={commonStyles.note}>Aucun lot en stock.</Text> : null}
            {lots.map((l) => (
              <Checkbox
                key={l.id}
                label={`${l.numero} · ${formatDateFR(l.dateFabrication)}${typeDuFromage ? ` (${typeDuFromage})` : ''}`}
                value={pris.includes(l.id)}
                onChange={(coche) =>
                  onChange({ ...lotsChoisis, [f.article]: coche ? [...pris, l.id] : pris.filter((x) => x !== l.id) })
                }
              />
            ))}
          </View>
        );
      })}
      <Text style={commonStyles.lineBold}>
        {nombre > 0
          ? `${nombre} affiné${nombre > 1 ? 's' : ''} ${nombre > 1 ? 'seront faits' : 'sera fait'}`
          : 'Cochez les lots de fromage frais pour fabriquer des affinés.'}
      </Text>
    </View>
  );
}
