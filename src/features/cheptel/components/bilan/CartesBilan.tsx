import { Pressable, Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import { PastilleAlerte } from '@/shared/components/PastilleAlerte';
import { FormField } from '@/shared/components/FormField';
import { formaterUgb } from '@/features/cheptel/services/ugb';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/cheptel/BilanAnnuel.styles';
import type { Bilan } from '@/features/cheptel/services/bilanCheptel';
import {
  DatesAbattoir,
  Ligne,
  TitreCarte,
  VoirPlus,
  useDetailsOuverts,
} from '@/features/cheptel/components/bilan/BilanBriques';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface CarteProps {
  bilan: Bilan;
  /** Bilan de l'année précédente, pour la comparaison entre parenthèses. */
  precedent: Bilan | null;
  annee: number;
  /** La carte est déroulée (une seule à la fois) : enroulée, seul son titre se voit. */
  ouverte: boolean;
  onBasculer: () => void;
}

/** Chèvres vivantes en fin d'année qui ne sont pas des renouvellements de cette année-là : le troupeau déjà établi. */
const chevresAnciennes = (b: Bilan) => b.chevresVivantesFinAnnee - b.chevresRenouvellementFinAnnee;

/** Boucs vivants en fin d'année qui ne sont pas des renouvellements de cette année-là : le troupeau déjà établi. */
const boucsAnciens = (b: Bilan) => b.boucsVivantsFinAnnee - b.boucsRenouvellementFinAnnee;

export function CarteCabris({ bilan, precedent, annee, ouverte, onBasculer }: CarteProps) {
  const details = useDetailsOuverts();

  return (
    <Card>
      <TitreCarte
        titre={`${TEXTES.commun.general.cabrisNesEnEspace}${annee}`}
        valeur={bilan.cabritsTotal}
        comparaison={precedent?.cabritsTotal}
        ouverte={ouverte}
        onBasculer={onBasculer}
      />
      {ouverte ? (
        <>
          <Text style={commonStyles.noteMarge}>
            {TEXTES.cheptel.bilanAnnuel.nesEntreLe0101}
            {annee}
            {TEXTES.cheptel.bilanAnnuel.vendusAbattoirAutoConsommationComptent} {annee}{' '}
            {TEXTES.cheptel.bilanAnnuel.pourToutCabriEncoreAge}
          </Text>
          <Ligne
            label={TEXTES.cheptel.bilanAnnuel.t1erSemestreTardifsValeur(annee - 1)}
            valeur={bilan.cabritsPremierSemestre}
            comparaison={precedent?.cabritsPremierSemestre}
          />
          <Ligne
            label={TEXTES.cheptel.bilanAnnuel.t2eSemestreCabrisAnnee(annee)}
            valeur={bilan.cabritsSecondSemestre}
            comparaison={precedent?.cabritsSecondSemestre}
          />
          <VoirPlus ouvert={details.ouvert} onToggle={details.basculer} />
          {details.ouvert && (
            <>
              <View style={commonStyles.separateur} />
              <View style={commonStyles.gap2}>
                <Ligne
                  label={TEXTES.cheptel.bilanAnnuel.vendusStock}
                  valeur={bilan.cabritsVendusBoucles}
                  comparaison={precedent?.cabritsVendusBoucles}
                />
                <Ligne
                  label={TEXTES.commun.general.abattoir}
                  valeur={bilan.cabritsAbattoir}
                  comparaison={precedent?.cabritsAbattoir}
                />
                <DatesAbattoir dates={bilan.cabritsAbattoirDates} />
                <Ligne
                  label={TEXTES.cheptel.bilanAnnuel.autoConsommation}
                  valeur={bilan.cabritsAutoconsommes}
                  comparaison={precedent?.cabritsAutoconsommes}
                />
                <Ligne
                  label={TEXTES.cheptel.bilanAnnuel.mortNes}
                  valeur={bilan.cabritsMortNes}
                  comparaison={precedent?.cabritsMortNes}
                />
              </View>
              <View style={commonStyles.separateur} />
              <Ligne
                label={TEXTES.cheptel.bilanAnnuel.totalCabris}
                valeur={bilan.cabritsRestants}
                comparaison={precedent?.cabritsRestants}
              />
            </>
          )}
        </>
      ) : null}
    </Card>
  );
}

export function CarteChevres({ bilan, precedent, annee, ouverte, onBasculer }: CarteProps) {
  const details = useDetailsOuverts();

  return (
    <Card>
      <TitreCarte
        titre={TEXTES.commun.general.chevres}
        valeur={bilan.chevresVivantesFinAnnee}
        comparaison={precedent?.chevresVivantesFinAnnee}
        ouverte={ouverte}
        onBasculer={onBasculer}
      />
      {ouverte ? (
        <>
          <Text style={commonStyles.noteMarge}>
            {TEXTES.cheptel.bilanAnnuel.chevresFemelles6MoisEt}
            {annee}
            {TEXTES.cheptel.bilanAnnuel.reconstitueAPartirDesStatuts}
          </Text>
          <Ligne
            label={TEXTES.cheptel.bilanAnnuel.renouvellementDesigneesCetteAnnee}
            valeur={bilan.chevresRenouvellementFinAnnee}
            comparaison={precedent?.chevresRenouvellementFinAnnee}
          />
          <Ligne
            label={TEXTES.cheptel.bilanAnnuel.plusAnciennes}
            valeur={chevresAnciennes(bilan)}
            comparaison={precedent ? chevresAnciennes(precedent) : undefined}
          />
          <VoirPlus ouvert={details.ouvert} onToggle={details.basculer} />
          {details.ouvert && (
            <>
              <View style={commonStyles.separateur} />
              <View style={commonStyles.gap2}>
                <Ligne
                  label={TEXTES.commun.general.mortes}
                  valeur={bilan.chevresMortesAnnee}
                  comparaison={precedent?.chevresMortesAnnee}
                />
                <Ligne
                  label={TEXTES.commun.general.abattoir}
                  valeur={bilan.chevresAbattoirAnnee}
                  comparaison={precedent?.chevresAbattoirAnnee}
                />
                <DatesAbattoir dates={bilan.chevresAbattoirDates} />
                <Ligne
                  label={TEXTES.cheptel.bilanAnnuel.autoConsommation}
                  valeur={bilan.chevresAutoconsommeesAnnee}
                  comparaison={precedent?.chevresAutoconsommeesAnnee}
                />
                <Ligne
                  label={TEXTES.cheptel.bilanAnnuel.misesBasPortees}
                  valeur={bilan.miseBasCount}
                  comparaison={precedent?.miseBasCount}
                />
              </View>
              <Ligne
                label={TEXTES.cheptel.bilanAnnuel.venduesStock}
                valeur={bilan.chevresVenduesBouclees}
                comparaison={precedent?.chevresVenduesBouclees}
              />
            </>
          )}
        </>
      ) : null}
    </Card>
  );
}

export function CarteBoucs({ bilan, precedent, annee, ouverte, onBasculer }: CarteProps) {
  const details = useDetailsOuverts();

  return (
    <Card>
      <TitreCarte
        titre={TEXTES.commun.general.boucs}
        valeur={bilan.boucsVivantsFinAnnee}
        comparaison={precedent?.boucsVivantsFinAnnee}
        ouverte={ouverte}
        onBasculer={onBasculer}
      />
      {ouverte ? (
        <>
          <Text style={commonStyles.noteMarge}>
            {TEXTES.cheptel.bilanAnnuel.boucsMales6MoisEt}
            {annee}
            {TEXTES.cheptel.bilanAnnuel.reconstitueAPartirDesStatuts}
          </Text>
          <Ligne
            label={TEXTES.cheptel.bilanAnnuel.renouvellementDesignesCetteAnnee}
            valeur={bilan.boucsRenouvellementFinAnnee}
            comparaison={precedent?.boucsRenouvellementFinAnnee}
          />
          <Ligne
            label={TEXTES.cheptel.bilanAnnuel.plusAnciens}
            valeur={boucsAnciens(bilan)}
            comparaison={precedent ? boucsAnciens(precedent) : undefined}
          />
          <VoirPlus ouvert={details.ouvert} onToggle={details.basculer} />
          {details.ouvert && (
            <>
              <View style={commonStyles.separateur} />
              <View style={commonStyles.gap2}>
                <Ligne
                  label={TEXTES.cheptel.bilanAnnuel.morts}
                  valeur={bilan.boucsMortsAnnee}
                  comparaison={precedent?.boucsMortsAnnee}
                />
                <Ligne
                  label={TEXTES.commun.general.abattoir}
                  valeur={bilan.boucsAbattoirAnnee}
                  comparaison={precedent?.boucsAbattoirAnnee}
                />
                <DatesAbattoir dates={bilan.boucsAbattoirDates} />
                <Ligne
                  label={TEXTES.cheptel.bilanAnnuel.autoConsommation}
                  valeur={bilan.boucsAutoconsommesAnnee}
                  comparaison={precedent?.boucsAutoconsommesAnnee}
                />
              </View>
              <Ligne
                label={TEXTES.cheptel.bilanAnnuel.vendusStock}
                valeur={bilan.boucsVendusBoucles}
                comparaison={precedent?.boucsVendusBoucles}
              />
            </>
          )}
        </>
      ) : null}
    </Card>
  );
}

export function CarteEffectif({
  bilan,
  effectifDeclare,
  onChangerEffectifDeclare,
  ugb,
  prime,
  lignesPrime,
  saison,
  ouverte,
  onBasculer,
  onVoirDetail,
}: {
  bilan: Bilan;
  /** L'effectif déclaré, tel qu'on le saisit (vide : non saisi) : l'UGB et la prime en dépendent quand il est saisi. */
  effectifDeclare: string;
  onChangerEffectifDeclare: (valeur: string) => void;
  /** L'UGB prévisionnel (celui de l'effectif déclaré, à défaut de l'effectif de fin d'année, avec les coefficients de l'exploitation). */
  ugb: number;
  /** La prime prévisionnelle : son total, ou rien quand aucun taux n'est renseigné. */
  prime?: number;
  /** Le montant de chaque aide comptée dans la prime prévisionnelle, avec son nom court. */
  lignesPrime: { cle: string; nomCourt: string; montant: number; ecart?: boolean }[];
  /** La saison où l'on compte les aides perçues (de septembre à août). */
  saison: { debut: string; fin: string };
  ouverte: boolean;
  onBasculer: () => void;
  /** Un appui sur l'UGB ouvre le détail du calcul. */
  onVoirDetail: () => void;
}) {
  const T = TEXTES.cheptel.bilanAnnuel.effectifEtUgb;
  return (
    <Card>
      <TitreCarte titre={T.titre} ouverte={ouverte} onBasculer={onBasculer} />
      {ouverte ? (
        <>
          <Ligne label={T.effectifActuel} valeur={bilan.stockFinAnnee} />
          {/* L'effectif déclaré (à la PAC) : enregistré pour l'année et l'espèce, il sert de base à l'UGB et aux primes. */}
          <View style={styles.ligne}>
            <Text style={styles.ligneLabel}>{T.effectifDeclare}</Text>
            <View style={styles.champDeclare}>
              <FormField
                value={effectifDeclare}
                onChangeText={(v) => /^\d*[.,]?\d*$/.test(v) && onChangerEffectifDeclare(v)}
                keyboardType="number-pad"
                placeholder={T.effectifDeclarePlaceholder}
                accessibilityLabel={T.effectifDeclare}
              />
            </View>
          </View>
          <Pressable style={styles.ligne} onPress={onVoirDetail} accessibilityLabel={T.detail.titre}>
            <Text style={styles.libelleLien}>{T.ugbPrevisionnel}</Text>
            <Text style={styles.cardTitreValeur}>{formaterUgb(ugb)}</Text>
          </Pressable>
          <View style={styles.ligne}>
            <Text style={styles.ligneLabel}>{T.primePrevisionnelle}</Text>
            <Text style={prime === undefined ? commonStyles.muted : styles.cardTitreValeur}>
              {prime === undefined ? T.formule : formatMontant(prime)}
            </Text>
          </View>
          {lignesPrime.map((l) => (
            <View key={l.cle} style={[styles.ligne, styles.ligneDetail]}>
              <View style={commonStyles.rowCentre}>
                <Text style={commonStyles.muted}>{l.nomCourt}</Text>
                {/* La prime calculée ne correspond pas à ce qui a été perçu sur la saison. */}
                {l.ecart ? (
                  <Pressable onPress={onVoirDetail} hitSlop={8}>
                    <PastilleAlerte taille={18} />
                  </Pressable>
                ) : null}
              </View>
              <Text style={commonStyles.muted}>{formatMontant(l.montant)}</Text>
            </View>
          ))}
          {lignesPrime.some((l) => l.ecart) ? (
            <View style={commonStyles.rowCentre}>
              <Text style={commonStyles.required}>*</Text>
              <Text style={styles.legendePrime}>
                {T.primeDifferente(formatDateFR(saison.debut), formatDateFR(saison.fin))}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
