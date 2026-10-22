import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  lotsDeLIngredient,
  lotsPrisPourIngredient,
  type IngredientProposable,
  type SaisieIngredient,
} from '@/features/production/services/ingredientsPlat';
import type { ArchiveStock } from '@/features/stock/types';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';
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
}: {
  valeur: SaisieIngredient[];
  onChange: (valeur: SaisieIngredient[]) => void;
  archive: ArchiveStock | null;
  proposables: IngredientProposable[];
}) {
  const maj = (cle: string, patch: Partial<SaisieIngredient>) =>
    onChange(valeur.map((i) => (i.cle === cle ? { ...i, ...patch } : i)));
  return (
    <View style={commonStyles.gap10}>
      {valeur.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.aucun}</Text> : null}
      {valeur.map((i) => {
        const quantite = parseDecimal(i.quantite);
        const lots = archive && i.article ? lotsDeLIngredient(archive, i.article) : [];
        const pris = archive && i.article ? lotsPrisPourIngredient(archive, i, quantite) : [];
        const entier = Math.max(0, Math.floor(quantite));
        return (
          <Card key={i.cle}>
            <View style={commonStyles.rowSpaceBetween}>
              <Text style={commonStyles.lineBold}>{T.produit}</Text>
              <Pressable
                onPress={() => onChange(valeur.filter((x) => x.cle !== i.cle))}
                hitSlop={8}
                accessibilityLabel={T.retirer}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
            <SelectField<string>
              label={T.produit}
              libelleCache
              searchable
              parCategories
              placeholder={T.choisirProduit}
              value={i.article}
              // Un autre ingrédient : ses lots reviennent aux plus anciens.
              onChange={(article) => maj(i.cle, { article, lotIds: undefined })}
              options={proposables.map((a) => ({ value: a.cle, label: a.libelle, groupe: a.groupe }))}
            />
            <FormField
              label={T.quantite}
              value={i.quantite}
              onChangeText={(v) => /^\d*[.,]?\d*$/.test(v) && maj(i.cle, { quantite: v })}
              keyboardType="decimal-pad"
              placeholder="1"
            />
            {i.article &&
            archive &&
            lots.length === 0 &&
            quantite > 0 &&
            /^(fromage|viande|plat|savon):/.test(i.article) ? (
              <Text style={commonStyles.note}>{T.sansLot}</Text>
            ) : null}
            {lots.length > 0 ? (
              <View style={commonStyles.gap6}>
                <Text style={commonStyles.lineBold}>{T.lots}</Text>
                {lots.map((l) => (
                  <Checkbox
                    key={l.id}
                    label={`${l.numero} · ${formatDateFR(l.dateFabrication)}`}
                    value={pris.includes(l.id)}
                    onChange={(coche) =>
                      maj(i.cle, { lotIds: coche ? [...pris, l.id] : pris.filter((x) => x !== l.id) })
                    }
                    disabled={!pris.includes(l.id) && pris.length >= entier}
                  />
                ))}
                <Text style={commonStyles.note}>{T.compteur(pris.length, lots.length)}</Text>
              </View>
            ) : null}
          </Card>
        );
      })}
      <Button
        variant="secondary"
        label={T.ajouter}
        onPress={() => onChange([...valeur, { cle: `n${Date.now()}`, article: '', quantite: '1' }])}
      />
    </View>
  );
}
