import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { definirTarif } from '@/features/commercial/repository';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { TEXTES } from '@/shared/textes';
import { formatMontant } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.stock.articleModal;

/** Le prix de base (la catégorie vide) ou celui d'une catégorie de contact. */
const BASE = '';

const texte = (valeur: number | undefined): string => (valeur === undefined ? '' : String(valeur).replace('.', ','));

/**
 * Le prix d'un article en une seule ligne : à gauche la catégorie (le prix de vente, ou une catégorie de contact), à droite son prix. Le prix de vente se
 * garde avec le bouton de la fenêtre ; celui d'une catégorie s'enregistre en quittant le champ (vide : le prix de vente s'applique).
 */
export function ChampPrixParCategorie({
  article,
  categories,
  tarifs,
  prixDeVente,
  onPrixDeVente,
  parKg,
}: {
  article: string;
  categories: { id: string; nom: string }[];
  /** Les prix déjà définis de l'article, par catégorie de contact. */
  tarifs: Record<string, number | undefined>;
  prixDeVente: string;
  onPrixDeVente: (saisie: string) => void;
  /** Le prix d'une viande se compte au kilo. */
  parKg?: boolean;
}) {
  const [categorie, setCategorie] = useState(BASE);
  const [saisies, setSaisies] = useState<Record<string, string>>({});
  const saisie = categorie === BASE ? prixDeVente : (saisies[categorie] ?? texte(tarifs[categorie]));
  const enregistrer = () => {
    if (categorie === BASE) {
      const montant = parseDecimal(prixDeVente);
      if (montant > 0) onPrixDeVente(formatMontant(montant));
      return;
    }
    const prix = saisie.trim() ? parseDecimal(saisie) : undefined;
    if (prix !== undefined && !(prix >= 0)) return;
    definirTarif(article, categorie, prix);
  };
  return (
    <View style={styles.ligne}>
      <View style={styles.categorie}>
        <SelectField<string>
          label={T.categorie}
          value={categorie}
          onChange={setCategorie}
          options={[
            { value: BASE, label: T.prixDeVente },
            ...categories.map((c) => ({ value: c.id, label: c.nom })),
          ]}
        />
      </View>
      <View style={styles.prix}>
        <FormField
          label={parKg ? T.prixParKg : T.prixCourt}
          value={saisie}
          onChangeText={(v) => (categorie === BASE ? onPrixDeVente(v) : setSaisies({ ...saisies, [categorie]: v }))}
          onBlur={enregistrer}
          onEndEditing={enregistrer}
          keyboardType="decimal-pad"
          placeholder={categorie === BASE ? '0,00' : texte(parseDecimal(prixDeVente) || undefined) || '0,00'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  categorie: { flex: 3 },
  prix: { flex: 2 },
});
