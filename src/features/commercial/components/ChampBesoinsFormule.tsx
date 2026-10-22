import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { articlesDeBesoin } from '@/features/commercial/services/stockVisite';
import type { BesoinFormule } from '@/features/commercial/types';
import { lireArchiveStock } from '@/features/stock/repository';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.commercial.agritourisme.stock;

/** Un besoin en cours de saisie : la quantité reste du texte (la virgule se tape telle quelle). */
export interface SaisieBesoin {
  cle: string;
  article: string;
  quantite: string;
  parPersonne: boolean;
}

/** Les besoins enregistrés d'une formule, en saisie. */
export const saisiesDesBesoins = (besoins: readonly BesoinFormule[] | undefined): SaisieBesoin[] =>
  (besoins ?? []).map((b, i) => ({
    cle: `b${i}-${b.article}`,
    article: b.article,
    quantite: String(b.quantite).replace('.', ','),
    parPersonne: !!b.parPersonne,
  }));

/**
 * Le stock qu'une formule consomme : une ligne par produit (fromage, charcuterie…) avec sa quantité, pour toute la visite d'ordinaire — la case
 * « Par personne » la multiplie par le nombre de personnes. Les produits sont ceux de l'inventaire ; le reste (boissons, pain) se note en dépense.
 */
export function ChampBesoinsFormule({
  valeur,
  onChange,
}: {
  valeur: SaisieBesoin[];
  onChange: (valeur: SaisieBesoin[]) => void;
}) {
  const [articles, setArticles] = useState<ReturnType<typeof articlesDeBesoin>>([]);
  useEffect(() => {
    lireArchiveStock()
      .then((archive) =>
        setArticles(articlesDeBesoin(archive, {
            fromages: T.groupeFromages,
            charcuterie: T.groupeCharcuterie,
            plats: T.groupePlats,
            autres: T.groupeAutres,
          })),
      )
      .catch(() => undefined);
  }, []);
  const maj = (cle: string, patch: Partial<SaisieBesoin>) =>
    onChange(valeur.map((b) => (b.cle === cle ? { ...b, ...patch } : b)));
  return (
    <View style={commonStyles.gap10}>
      {valeur.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.aucun}</Text> : null}
      {valeur.map((b) => (
        <Card key={b.cle}>
          <View style={commonStyles.rowSpaceBetween}>
            <Text style={commonStyles.lineBold}>{T.produit}</Text>
            <Pressable
              onPress={() => onChange(valeur.filter((x) => x.cle !== b.cle))}
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
            value={b.article}
            onChange={(article) => maj(b.cle, { article })}
            options={[
              ...articles.map((a) => ({ value: a.cle, label: a.libelle, groupe: a.groupe })),
              // Un article choisi qui n'existe plus reste visible.
              ...(b.article && !articles.some((a) => a.cle === b.article)
                ? [{ value: b.article, label: b.article, groupe: T.groupeFromages }]
                : []),
            ]}
          />
          <FormField
            label={T.quantite}
            value={b.quantite}
            onChangeText={(v) => /^\d*[.,]?\d*$/.test(v) && maj(b.cle, { quantite: v })}
            keyboardType="decimal-pad"
            placeholder="1"
          />
          <Checkbox label={T.parPersonne} value={b.parPersonne} onChange={(parPersonne) => maj(b.cle, { parPersonne })} />
        </Card>
      ))}
      <Button
        variant="secondary"
        label={T.ajouter}
        onPress={() => onChange([...valeur, { cle: `n${Date.now()}`, article: '', quantite: '1', parPersonne: false }])}
      />
    </View>
  );
}
