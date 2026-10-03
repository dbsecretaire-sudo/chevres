import { Text } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { formatDateFR } from '@/shared/utils/dates';
import type { Vente } from '@/features/comptabilite/types';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { COMPTE_PAR_RECETTE } from '@/shared/constants/planComptable';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_CATEGORIE_VENTE } from '@/shared/textes/libelles';

/** « 12 L », « 2 têtes », « 6 piece »… selon le produit vendu. */
function libelleQuantite(v: Vente): string {
  if (v.categorie === CATEGORIE_VENTE.LAIT) return `${v.quantite} L`;
  if (v.categorie === CATEGORIE_VENTE.CABRIS) {
    return `${v.quantite} ${v.quantite > 1 ? TEXTES.comptabilite.ficheVente.tetes : TEXTES.comptabilite.ficheVente.tete}`;
  }
  return `${v.quantite} ${v.unite}`;
}

/** Fiche d'une vente de production en lecture seule. */
export function VenteLecture({ vente, onModifier }: { vente: Vente; onModifier: () => void }) {
  const compte = COMPTE_PAR_RECETTE[vente.categorie];
  return (
    <Card>
      <Text style={commonStyles.line}>{TEXTES.comptabilite.ficheVente.typeVenteDeProduction}</Text>
      <Text style={commonStyles.line}>
        {TEXTES.comptabilite.ficheVente.produitDeuxPoints}
        {LABEL_CATEGORIE_VENTE[vente.categorie]}
      </Text>
      <Text style={commonStyles.line}>
        {TEXTES.commun.general.dateDeuxPoints}
        {formatDateFR(vente.date)}
      </Text>
      <Text style={commonStyles.line}>
        {TEXTES.comptabilite.ficheVente.quantiteDeuxPoints}
        {libelleQuantite(vente)}
      </Text>
      {vente.categorie === CATEGORIE_VENTE.CABRIS && vente.poidsKg !== undefined ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.ficheVente.poidsDeuxPoints}
          {vente.poidsKg} {TEXTES.commun.general.kg}
        </Text>
      ) : null}
      <Text style={commonStyles.line}>
        {TEXTES.commun.general.montantDeuxPoints}
        {vente.prix?.toFixed(2)} €
      </Text>
      <Text style={commonStyles.line}>
        {TEXTES.commun.general.comptePcgDeuxPoints}
        {compte.numero} — {compte.libelle}
      </Text>
      {vente.client ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.ficheVente.clientDeuxPoints}
          {vente.client}
        </Text>
      ) : null}
      <Button
        label={TEXTES.comptabilite.ficheVente.modifierLaVente}
        variant="secondary"
        onPress={onModifier}
      />
    </Card>
  );
}
