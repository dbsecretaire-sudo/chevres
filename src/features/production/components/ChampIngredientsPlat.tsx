import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  lotsDeLIngredient,
  type IngredientProposable,
  type SaisieIngredient,
} from '@/features/production/services/ingredientsPlat';
import { ChoixDesLots } from '@/features/production/components/ChoixDesLots';
import { CLE_LAIT } from '@/features/stock/services/historiqueLait';
import { DessinDeCarte } from '@/features/stock/components/DessinDeCarte';
import { emojiDeLArticle } from '@/features/stock/services/entrepotJeu';
import { UNITES_STOCK } from '@/features/stock/services/unites';
import type { ArchiveStock, GenreArticle } from '@/features/stock/types';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.production.fabricationPlat.ingredients;

/**
 * Les ingrédients d'une fabrication de plats : une carte par ingrédient du stock, avec sa quantité et, quand il se suit par lot, la liste de ses lots (les plus
 * anciens sont cochés d'office, autant que la quantité entière). Rien n'est calculé tant qu'un ingrédient n'est pas choisi.
 */
export function ChampIngredientsPlat({
  valeur,
  onChange,
  archive,
  proposables,
  ajouter = T.ajouter,
  aucun = T.aucun,
  libelleQuantite = T.quantite,
  libelleProduit = T.produit,
  placeholderProduit = T.choisirProduit,
  avecUnite = false,
}: {
  valeur: SaisieIngredient[];
  onChange: (valeur: SaisieIngredient[]) => void;
  archive: ArchiveStock | null;
  proposables: IngredientProposable[];
  /** Le libellé du bouton d'ajout et le texte quand la liste est vide (le conditionnement a les siens). */
  ajouter?: string;
  aucun?: string;
  /** Ce que la quantité compte (pour 1 pièce, pour 1 kg…) ; le lait se lit toujours en litres. */
  libelleQuantite?: string;
  /** Le nom de ce qu'on choisit (ingrédient, emballage) et son invite. */
  libelleProduit?: string;
  placeholderProduit?: string;
  /** La recette : chaque quantité s'accompagne de son unité (à choisir), convertie à la fabrication. */
  avecUnite?: boolean;
}) {
  const maj = (cle: string, patch: Partial<SaisieIngredient>) =>
    onChange(valeur.map((i) => (i.cle === cle ? { ...i, ...patch } : i)));
  /** L'unité de stock d'un article (celle de sa quantité en inventaire). */
  const uniteDe = (article: string) => proposables.find((p) => p.cle === article)?.unite;
  /** Le nom de l'unité du stock d'un ingrédient, affiché tel quel (le lait se compte en litres). */
  const libelleUniteDe = (article: string) => {
    if (!article) return '';
    const cle = article === CLE_LAIT ? 'L' : uniteDe(article);
    return UNITES_STOCK.find((u) => u.cle === cle)?.libelle ?? 'sans unité';
  };
  /** Le dessin d'un ingrédient, comme au stock : son image, sinon son emoji (le lait a sa goutte). */
  const dessinDe = (article: string) =>
    article === CLE_LAIT
      ? '🥛'
      : emojiDeLArticle(article.split(':')[0] as GenreArticle, proposables.find((p) => p.cle === article)?.libelle ?? '');
  /** La quantité d'un ingrédient ; sans choix d'unité, son libellé dit l'unité du stock (« Quantité (kg) »). */
  const champQuantite = (i: SaisieIngredient) => {
    const unite = avecUnite ? undefined : uniteDe(i.article);
    const libelle = i.article === CLE_LAIT ? T.quantiteLait : unite ? `${libelleQuantite} (${unite})` : libelleQuantite;
    return (
      <FormField
        label={libelle}
        value={i.quantite}
        onChangeText={(v) => /^\d*[.,]?\d*$/.test(v) && maj(i.cle, { quantite: v })}
        keyboardType="decimal-pad"
        placeholder="1"
      />
    );
  };
  return (
    <View style={commonStyles.gap10}>
      {valeur.length === 0 ? <Text style={commonStyles.mutedItalic}>{aucun}</Text> : null}
      {valeur.map((i) => {
        const quantite = parseDecimal(i.quantite);
        // Une recette ne choisit pas de lots : c'est la fabrication qui les prend.
        const lots = archive && i.article && !avecUnite ? lotsDeLIngredient(archive, i.article) : [];
        return (
          <Card key={i.cle}>
            <View style={commonStyles.rowSpaceBetween}>
              <Text style={commonStyles.lineBold}>{libelleProduit}</Text>
              <Pressable
                onPress={() => onChange(valeur.filter((x) => x.cle !== i.cle))}
                hitSlop={8}
                accessibilityLabel={T.retirer}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
            <View style={commonStyles.row}>
              <View style={commonStyles.flex1}>
                <SelectField<string>
                  label={libelleProduit}
                  libelleCache
                  searchable
                  parCategories
                  placeholder={placeholderProduit}
                  value={i.article}
                  // Un autre ingrédient : ses lots reviennent aux plus anciens, et son unité de stock devient celle de la quantité.
                  onChange={(article) => maj(i.cle, { article, lotIds: undefined, unite: uniteDe(article) })}
                  options={proposables.map((a) => ({ value: a.cle, label: a.libelle, groupe: a.groupe }))}
                />
              </View>
              {avecUnite && i.article ? <DessinDeCarte emoji={dessinDe(i.article)} cle={i.article} /> : null}
            </View>
            {avecUnite ? (
              <View style={commonStyles.row}>
                <View style={commonStyles.flex1}>{champQuantite(i)}</View>
                <View style={commonStyles.flex1}>
                  <FormField label={TEXTES.stock.modal.unite} value={libelleUniteDe(i.article)} editable={false} />
                </View>
              </View>
            ) : (
              champQuantite(i)
            )}
            {!avecUnite &&
            i.article &&
            archive &&
            lots.length === 0 &&
            quantite > 0 &&
            /^(fromage|viande|plat|savon):/.test(i.article) ? (
              <Text style={commonStyles.note}>{T.sansLot}</Text>
            ) : null}
            {!avecUnite && archive && i.article ? (
              <ChoixDesLots archive={archive} article={i.article} quantite={quantite} lotIds={i.lotIds} onChange={(lotIds) => maj(i.cle, { lotIds })} />
            ) : null}
          </Card>
        );
      })}
      <Button
        variant="secondary"
        label={ajouter}
        onPress={() => onChange([...valeur, { cle: `n${Date.now()}`, article: '', quantite: '1' }])}
      />
    </View>
  );
}
