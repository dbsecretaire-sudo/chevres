import { Text, View } from 'react-native';
import { BoutonCadeau } from '@/features/comptabilite/components/BoutonCadeau';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatMontant } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.comptabilite.nouvelleEcriture;

interface Props {
  /** Les frais d'abattoir à refacturer, tels qu'ils s'écrivent (avec virgule) : vides, il n'y en a pas. */
  valeur: string;
  /** Le taux de TVA des frais (vide : celui de la vente). */
  taux: string;
  onTaux: (taux: string) => void;
  tauxParDefaut: string;
  /** Le prix de la viande, sans les frais : le total de la facture s'affiche dessous. */
  montantViande: number;
  /** Les frais que la facture de l'abattoir liée au lot propose pour les animaux de la vente (en €) ; rien : pas de facture liée. */
  proposition?: number;
  /** Vrai quand la vente est celle d'un lot d'abattoir : sans facture liée au lot, une note dit comment en avoir. */
  duLot?: boolean;
  /** Facturer ou non les frais au client : appelée avec le choix. */
  onFacturer?: (facturer: boolean) => void;
  /** Vente offerte : le bouton « Cadeau » de la ligne (actif : les frais sont offerts, non facturés) remplace la case. */
  cadeau?: { actif: boolean; onChange: (actif: boolean) => void };
}

/**
 * Les frais d'abattoir refacturés au client d'une vente de viande : on choisit de les facturer ou non (la case). Le montant se lit
 * seulement — il vient de la facture de l'abattoir liée au lot d'abattoir (Lots d'animaux › Abattoir) — et son taux de TVA se choisit.
 */
export function ChampFraisAbattoir({
  valeur,
  taux,
  onTaux,
  tauxParDefaut,
  montantViande,
  proposition,
  duLot,
  onFacturer,
  cadeau,
}: Props) {
  const frais = parseDecimal(valeur);
  const facturer = cadeau ? !cadeau.actif : frais > 0;
  return (
    <View style={commonStyles.gap6}>
      {cadeau ? (
        <BoutonCadeau actif={cadeau.actif} onChange={cadeau.onChange} ligne={T.cadeauFrais} />
      ) : null}
      {!cadeau && onFacturer && proposition && proposition > 0 ? (
        <Checkbox
          label={T.facturerLesFrais(formatMontant(proposition))}
          value={facturer}
          onChange={onFacturer}
        />
      ) : null}
      {duLot && !(proposition && proposition > 0) ? (
        <Text style={commonStyles.note}>{T.aucuneFactureAbattoirLiee}</Text>
      ) : null}
      {(facturer || !onFacturer) && !cadeau?.actif ? (
        <View style={commonStyles.row}>
          <View style={commonStyles.flex1}>
            <FormField
              label={T.fraisAbattoir}
              aide={T.fraisAbattoirAide}
              value={valeur}
              editable={false}
              style={commonStyles.verrouille}
              placeholder="0,00"
            />
          </View>
          {frais > 0 ? (
            <View style={commonStyles.flex1}>
              <SelectField
                label={T.tvaDesFrais}
                value={taux || tauxParDefaut}
                onChange={onTaux}
                options={OPTIONS_TAUX_TVA}
              />
            </View>
          ) : null}
        </View>
      ) : null}
      {cadeau?.actif ? <Text style={commonStyles.note}>{T.fraisOffertsNote}</Text> : null}
      {frais > 0 && !cadeau?.actif ? (
        <Text style={commonStyles.note}>{T.totalAvecFrais(formatMontant(montantViande + frais))}</Text>
      ) : null}
    </View>
  );
}
