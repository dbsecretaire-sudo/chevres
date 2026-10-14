import { Text } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { formatDateFR } from '@/shared/utils/dates';
import type { Vente } from '@/features/comptabilite/types';
import {
  CATEGORIES_VENTE_ANIMAUX,
  CATEGORIES_VENTE_VIANDE,
  CATEGORIE_VENTE,
  TYPE_FROMAGE,
} from '@/shared/constants/comptabilite';
import { COMPTE_PAR_RECETTE } from '@/shared/constants/planComptable';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_ACTIVITE_COMPTABLE, LABEL_CIRCUIT_VENTE, LABEL_TYPE_FROMAGE } from '@/shared/textes/libelles';
import { libelleCategorieVente, venteADeclarer } from '@/features/comptabilite/utils/ventes';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import { plusieursEspeces } from '@/shared/dictionnaire/animaux';

/** « 12 L », « 2 têtes », « 6 piece »… selon le produit vendu. */
function libelleQuantite(v: Vente): string {
  if (v.categorie === CATEGORIE_VENTE.LAIT) return `${v.quantite} L`;
  if ((CATEGORIES_VENTE_ANIMAUX as readonly string[]).includes(v.categorie)) {
    return `${v.quantite} ${v.quantite > 1 ? TEXTES.comptabilite.ficheVente.tetes : TEXTES.comptabilite.ficheVente.tete}`;
  }
  if (v.categorie === CATEGORIE_VENTE.OEUFS) return `${v.quantite} ${TEXTES.comptabilite.ficheVente.oeufs}`;
  return `${v.quantite} ${v.unite}`;
}

/** Fiche d'une vente de production en lecture seule. */
export function VenteLecture({ vente, onModifier }: { vente: Vente; onModifier: () => void }) {
  const compte = COMPTE_PAR_RECETTE[vente.categorie];
  return (
    <Card>
      {plusieursEspeces() ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.activite.activiteDeuxPoints}
          {LABEL_ACTIVITE_COMPTABLE[activiteVente(vente)]}
        </Text>
      ) : null}
      <Text style={commonStyles.line}>{TEXTES.comptabilite.ficheVente.typeVenteDeProduction}</Text>
      <Text style={commonStyles.line}>
        {TEXTES.comptabilite.ficheVente.produitDeuxPoints}
        {libelleCategorieVente(vente)}
      </Text>
      {vente.categorie === CATEGORIE_VENTE.FROMAGE && vente.typeFromage ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.nouvelleEcriture.typeDeFromage} :{' '}
          {vente.typeFromage === TYPE_FROMAGE.AUTRE && vente.typeFromageLibre
            ? vente.typeFromageLibre
            : LABEL_TYPE_FROMAGE[vente.typeFromage]}
        </Text>
      ) : null}
      <Text style={commonStyles.line}>
        {TEXTES.commun.general.dateDeuxPoints}
        {formatDateFR(vente.date)}
      </Text>
      {vente.reajustement ? (
        <Text style={commonStyles.line}>{TEXTES.comptabilite.nouvelleEcriture.reajustement}</Text>
      ) : (CATEGORIES_VENTE_VIANDE as readonly string[]).includes(vente.categorie) ? null : (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.ficheVente.quantiteDeuxPoints}
          {libelleQuantite(vente)}
        </Text>
      )}
      {(CATEGORIES_VENTE_ANIMAUX as readonly string[]).includes(vente.categorie) &&
      vente.poidsKg !== undefined ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.ficheVente.poidsDeuxPoints}
          {vente.poidsKg} {TEXTES.commun.general.kg}
        </Text>
      ) : null}
      {vente.precision ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.nouvelleEcriture.detailDeLaVente} : {vente.precision}
        </Text>
      ) : null}
      <Text style={commonStyles.line}>
        {TEXTES.commun.general.montantDeuxPoints}
        {vente.prix?.toFixed(2)} €
      </Text>
      <Text style={commonStyles.line}>{TEXTES.comptabilite.ficheVente.declaree(venteADeclarer(vente))}</Text>
      {vente.payee === false ? (
        <Text style={commonStyles.line}>
          {vente.echeance
            ? TEXTES.comptabilite.tresorerie.paiement.enAttente(formatDateFR(vente.echeance))
            : TEXTES.comptabilite.tresorerie.paiement.enAttenteSansDate}
        </Text>
      ) : null}
      {vente.circuit ? (
        <Text style={commonStyles.line}>
          {TEXTES.commercial.circuit.deLaVente(
            LABEL_CIRCUIT_VENTE[vente.circuit as keyof typeof LABEL_CIRCUIT_VENTE] ?? vente.circuit,
          )}
        </Text>
      ) : null}
      {vente.numeroFacture ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.factureLecture.nDeFactureDeuxPoints}
          {vente.numeroFacture}
        </Text>
      ) : null}
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
