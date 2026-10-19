import { Text, View } from 'react-native';
import { Checkbox } from '@/shared/components/Checkbox';
import { prixPersonnaliseAuClient } from '@/features/clients/services/categorie';
import { FormField } from '@/shared/components/FormField';
import type { EtatNouvelleEcriture } from '@/features/comptabilite/hooks/useNouvelleEcriture';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture;

interface Props {
  e: EtatNouvelleEcriture;
  /** L'unité du prix : au kilo, à la pièce, au litre. */
  unite: 'kg' | 'piece' | 'litre';
  /** Le prix de l'inventaire : affiché en repère dans le champ. */
  prixInventaire?: number;
  /** Vrai : le champ du prix est déjà sur la ligne (au kilo) : seule la case est affichée ici. */
  sansChamp?: boolean;
}

/**
 * « Prix du produit personnalisé » : la case vaut pour tous les produits de la facture de ce contact, à titre exceptionnel (le prix de
 * l'inventaire ne change pas). Cochée, le prix de l'unité (au kilo, à la pièce, au litre) et le prix total se saisissent.
 */
export function ChampPrixPersonnalise({ e, unite, prixInventaire, sansChamp }: Props) {
  // La catégorie du contact règle si la case est utile (Organisation › Contacts) ; une facture qui l'a déjà cochée la garde.
  if (!prixPersonnaliseAuClient(e.clientSelectionne) && !e.prixPersonnalise) return null;
  return (
    <View style={commonStyles.gap6}>
      <Checkbox label={T.prixPersonnalise} value={e.prixPersonnalise} onChange={e.setPrixPersonnalise} />
      {e.prixPersonnalise ? (
        <>
          {sansChamp ? null : (
            <FormField
              label={T.prixParUnite[unite]}
              value={e.prixUnitaireSaisi}
              onChangeText={e.setPrixUnitaireSaisi}
              keyboardType="decimal-pad"
              placeholder={prixInventaire ? prixInventaire.toFixed(2).replace('.', ',') : ''}
            />
          )}
          <Text style={commonStyles.note}>{T.prixPersonnaliseAide}</Text>
        </>
      ) : null}
    </View>
  );
}
