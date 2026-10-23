import { nomObjetAssurance } from '@/features/settings/services/listesDeChoix';
import { useEffect, useState } from 'react';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { libelleVehicule, vehiculeDe } from '@/features/exploitation/services/flotte';
import { idsDesAnimauxAchetes } from '@/features/comptabilite/utils/ventes';
import type { ArchiveStock } from '@/features/stock/types';
import { libelleArticle } from '@/features/stock/services/stock';
import { lireArchiveStock } from '@/features/stock/repository';
import { Text, View } from 'react-native';
import { AnimauxEnvoyesListe } from '@/features/comptabilite/components/AnimauxEnvoyesListe';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { formatDateFR, formatDateShortFR, formatMontant } from '@/shared/utils/dates';
import {
  LABEL_ACTIVITE_COMPTABLE,
  LABEL_CATEGORIE_DEPENSE,
  LABEL_VOLET_COOPERATIVE,
  LABEL_RUBRIQUE_MARCHANDISE,
  LABEL_NATURE_URSSAF,
  LABEL_TYPE_AIDE,
  LABEL_TYPE_ALIMENT,
  LABEL_UNITE_MARCHANDISE,
  LABEL_TYPE_CARBURANT,
  LABEL_UNITE_CONDITIONNEMENT,
} from '@/shared/textes/libelles';
import { type CompteComptable } from '@/shared/constants/planComptable';
import type { Facture, UniteConditionnement } from '@/features/comptabilite/types';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TYPE_ALIMENT, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { activiteLigne, activitesFacture } from '@/features/comptabilite/utils/activite';
import { plusieursEspeces } from '@/shared/dictionnaire/animaux';
import { sejourDeFacture } from '@/features/gite/repository';
import type { Sejour } from '@/features/gite/types';
import { ROUTES } from '@/shared/constants/routes';
import { useNomsMateriel } from '@/features/stock/hooks/useNomsMateriel';
import { TEXTES } from '@/shared/textes';

/** « 1 matelas », « 3 matelas », « 2 ballots » (matelas est invariable). */
function libelleUnite(unite: UniteConditionnement, nombre: number): string {
  const libelle = LABEL_UNITE_CONDITIONNEMENT[unite].toLowerCase();
  return nombre > 1 && !libelle.endsWith('s') ? `${libelle}s` : libelle;
}

interface Props {
  facture: Facture;
  compte?: CompteComptable;
  onModifier: () => void;
}

/** Fiche d'une facture en lecture seule : informations générales puis détail par aliment/carburant. */
export function FactureLecture({ facture, compte, onModifier }: Props) {
  const nomsMateriel = useNomsMateriel();
  /** Le véhicule de la flotte que l'écriture concerne (sa plaque). */
  const { settings } = useAppSettings();
  const vehicule = vehiculeDe(settings.exploitation?.flotte, facture.vehiculeId);
  /** L'inventaire, pour nommer les fournitures d'un achat de production. */
  const [archiveLecture, setArchiveLecture] = useState<ArchiveStock | null>(null);
  useEffect(() => {
    if (facture.lignesProduction?.length) lireArchiveStock().then(setArchiveLecture);
  }, [facture.lignesProduction]);
  const router = useRouter();
  /** La réservation du gîte dont cette écriture est le paiement (hébergement, repas, acompte, remboursement). */
  const [reservation, setReservation] = useState<Sejour | undefined>();
  useEffect(() => {
    sejourDeFacture(facture.id).then(setReservation);
  }, [facture.id]);

  return (
    <Card>
      {facture.payee === false ? (
        <Text style={commonStyles.lineBold}>
          {facture.echeance
            ? TEXTES.comptabilite.tresorerie.paiement.enAttente(formatDateFR(facture.echeance))
            : TEXTES.comptabilite.tresorerie.paiement.enAttenteSansDate}
        </Text>
      ) : null}
      {plusieursEspeces() ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.activite.activiteDeuxPoints}
          {activitesFacture(facture)
            .map((a) => LABEL_ACTIVITE_COMPTABLE[a])
            .join(TEXTES.commun.general.separateurListe)}
        </Text>
      ) : null}
      <Text style={commonStyles.line}>
        {TEXTES.comptabilite.factureLecture.typeDeuxPoints}
        {facture.type === TYPE_FACTURE.EMISE
          ? TEXTES.commun.general.factureEmise
          : TEXTES.commun.general.factureRecue}
      </Text>
      <Text style={commonStyles.line}>
        {TEXTES.commun.general.dateDeuxPoints}
        {formatDateFR(facture.date)}
      </Text>
      <Text style={commonStyles.line}>
        {TEXTES.comptabilite.factureLecture.tiersDeuxPoints}
        {facture.tiers}
      </Text>
      <Text style={commonStyles.line}>
        {TEXTES.commun.general.montantDeuxPoints}
        {facture.montant.toFixed(2)} €
        {facture.offert ? ` · ${TEXTES.comptabilite.nouvelleEcriture.offertFournisseur}` : ""}
      </Text>
      {facture.tauxTva !== undefined ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.factureLecture.tvaDeuxPoints}
          {facture.tauxTva} %
        </Text>
      ) : null}

      {facture.description ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.factureLecture.nDeFactureDeuxPoints}
          {facture.description}
        </Text>
      ) : null}
      {facture.categorieDepense ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.factureLecture.categorieDeDepenseDeuxPoints}
          {facture.categoriePerso ?? LABEL_CATEGORIE_DEPENSE[facture.categorieDepense] ?? facture.categorieDepense}
        </Text>
      ) : null}
      {facture.motif ? (
        <Text style={commonStyles.line}>
          {TEXTES.flotte.motif.lecture}
          {facture.motif}
        </Text>
      ) : null}
      {facture.voletCooperative ? (
        <Text style={commonStyles.line}>
          {TEXTES.production.lieux.groupement.champVolet.label} : {LABEL_VOLET_COOPERATIVE[facture.voletCooperative as keyof typeof LABEL_VOLET_COOPERATIVE] ?? facture.voletCooperative}
        </Text>
      ) : null}
      {facture.objetAssurance ? (
        <Text style={commonStyles.line}>
          {TEXTES.flotte.objetAssurance.label} : {nomObjetAssurance(facture.objetAssurance, settings.exploitation?.listesPerso?.objetsAssurance)}
        </Text>
      ) : null}
      {vehicule ? (
        <Text style={commonStyles.line}>
          {TEXTES.flotte.champ.lecture}
          {libelleVehicule(vehicule)}
        </Text>
      ) : null}
      {facture.categorieRecette ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.factureLecture.categorieDeRecetteDeuxPoints}
          {facture.categorieRecette}
        </Text>
      ) : null}
      {compte ? (
        <Text style={commonStyles.line}>
          {TEXTES.commun.general.comptePcgDeuxPoints}
          {compte.numero} — {compte.libelle}
        </Text>
      ) : null}
      {facture.natureUrssaf ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.nouvelleEcriture.natureUrssaf} : {LABEL_NATURE_URSSAF[facture.natureUrssaf]}
        </Text>
      ) : null}
      {reservation ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.factureLecture.reservationLieeDeuxPoints}
          {/* Une réservation abandonnée n'est plus au calendrier : on la retrouve dans l'historique. */}
          <Text
            style={commonStyles.lien}
            onPress={() =>
              router.push(
                reservation.abandonne ? ROUTES.giteHistorique(reservation.id) : ROUTES.sejour(reservation.id),
              )
            }
          >
            {reservation.nom} — {formatDateShortFR(reservation.arrivee)} →{' '}
            {formatDateShortFR(reservation.depart)}
          </Text>
        </Text>
      ) : null}

      {idsDesAnimauxAchetes(facture).length > 0 ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.nouvelleEcriture.animauxAchetes.nAnimaux(idsDesAnimauxAchetes(facture).length)}
        </Text>
      ) : null}

      <AnimauxEnvoyesListe facture={facture} />

      {facture.lignesAlimentation && facture.lignesAlimentation.length > 0 ? (
        <View style={commonStyles.gap2}>
          <Text style={commonStyles.lineBold}>{TEXTES.comptabilite.factureLecture.detailsDeuxPoints}</Text>
          {facture.lignesAlimentation.map((ligne, index) => (
            <View key={index} style={commonStyles.rowBetween}>
              <Text style={commonStyles.line}>
                {ligne.type === TYPE_ALIMENT.AUTRE && ligne.typeLibre
                  ? ligne.typeLibre
                  : LABEL_TYPE_ALIMENT[ligne.type]}
                {ligne.nombreUnitesConditionnement && ligne.uniteConditionnement
                  ? ` — ${ligne.nombreUnitesConditionnement} ${libelleUnite(ligne.uniteConditionnement, ligne.nombreUnitesConditionnement)}`
                  : ''}
                {ligne.equipement ||
                (ligne.type === TYPE_ALIMENT.AUTRE && nomsMateriel.equipement.has(ligne.typeLibre ?? ''))
                  ? ` (${TEXTES.stock.sections.materiel})`
                  : ligne.materiel ||
                      (ligne.type === TYPE_ALIMENT.AUTRE && nomsMateriel.materiel.has(ligne.typeLibre ?? ''))
                    ? ` (${TEXTES.stock.onglets.materiel})`
                    : plusieursEspeces() && activitesFacture(facture).length > 1
                      ? ` (${LABEL_ACTIVITE_COMPTABLE[activiteLigne(facture, ligne)]})`
                      : ''}
              </Text>
              <Text style={commonStyles.lineSemiBold}>{formatMontant(ligne.montant)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {facture.lignesProduction && facture.lignesProduction.length > 0 ? (
        <View style={commonStyles.gap2}>
          <Text style={commonStyles.lineBold}>{TEXTES.comptabilite.factureLecture.detailsDeuxPoints}</Text>
          {facture.lignesProduction.map((ligne, index) => (
            <View key={index} style={commonStyles.rowBetween}>
              <Text style={commonStyles.line}>
                {ligne.article && archiveLecture
                  ? libelleArticle(ligne.article, archiveLecture)
                  : TEXTES.comptabilite.lignesProductionEditor.horsStock}
                {ligne.quantite ? ` — ${String(ligne.quantite).replace('.', ',')}` : ''}
              </Text>
              <Text style={commonStyles.lineSemiBold}>{formatMontant(ligne.montant)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {facture.lignesChambre && facture.lignesChambre.length > 0 ? (
        <View style={commonStyles.gap2}>
          <Text style={commonStyles.lineBold}>{TEXTES.comptabilite.factureLecture.detailsDeuxPoints}</Text>
          {facture.lignesChambre.map((ligne, index) => (
            <View key={index} style={commonStyles.rowBetween}>
              <Text style={commonStyles.line}>{ligne.libelle}</Text>
              <Text style={commonStyles.lineSemiBold}>{formatMontant(ligne.montant)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {facture.lignesMarchandises && facture.lignesMarchandises.length > 0 ? (
        <View style={commonStyles.gap2}>
          <Text style={commonStyles.lineBold}>{TEXTES.comptabilite.factureLecture.detailsDeuxPoints}</Text>
          {facture.lignesMarchandises.map((ligne, index) => (
            <View key={index} style={commonStyles.rowBetween}>
              <Text style={commonStyles.line}>
                {ligne.marchandise || LABEL_RUBRIQUE_MARCHANDISE[ligne.rubrique]}
                {ligne.quantite && ligne.unite
                  ? ` — ${String(ligne.quantite).replace('.', ',')} ${LABEL_UNITE_MARCHANDISE[ligne.unite].toLowerCase()}`
                  : ''}
                {` (${LABEL_RUBRIQUE_MARCHANDISE[ligne.rubrique]})`}
              </Text>
              <Text style={commonStyles.lineSemiBold}>{formatMontant(ligne.montant)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {facture.lignesCarburant && facture.lignesCarburant.length > 0 ? (
        <View style={commonStyles.gap2}>
          <Text style={commonStyles.lineBold}>{TEXTES.comptabilite.factureLecture.detailsDeuxPoints}</Text>
          {facture.lignesCarburant.map((ligne, index) => (
            <View key={index} style={commonStyles.rowBetween}>
              <Text style={commonStyles.line}>
                {LABEL_TYPE_CARBURANT[ligne.type]}
                {ligne.litrage !== undefined ? ` — ${ligne.litrage} L` : ''}
              </Text>
              <Text style={commonStyles.lineSemiBold}>{formatMontant(ligne.montant)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <>
          {facture.typeCarburant ? (
            <Text style={commonStyles.line}>
              {TEXTES.comptabilite.factureLecture.typeDeCarburantDeuxPoints}
              {LABEL_TYPE_CARBURANT[facture.typeCarburant]}
            </Text>
          ) : null}
          {facture.litrage !== undefined ? (
            <Text style={commonStyles.line}>
              {TEXTES.comptabilite.factureLecture.litrageDeuxPoints}
              {facture.litrage} L
            </Text>
          ) : null}
        </>
      )}

      {facture.typeAide ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.factureLecture.typeDAideDeuxPoints}
          {LABEL_TYPE_AIDE[facture.typeAide]}
        </Text>
      ) : null}
      {facture.typeAideLibre ? (
        <Text style={commonStyles.line}>
          {TEXTES.comptabilite.factureLecture.precisionDeuxPoints}
          {facture.typeAideLibre}
        </Text>
      ) : null}

      <Button label={TEXTES.commun.general.modifierLaFacture} variant="secondary" onPress={onModifier} />
    </Card>
  );
}
