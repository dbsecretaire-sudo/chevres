import { Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
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
  annee,
  ouverte,
  onBasculer,
}: Pick<CarteProps, 'bilan' | 'annee' | 'ouverte' | 'onBasculer'>) {
  return (
    <Card>
      <TitreCarte
        titre={TEXTES.cheptel.bilanAnnuel.effectifDuTroupeau}
        valeur={bilan.stockFinAnnee}
        ouverte={ouverte}
        onBasculer={onBasculer}
      />
      {ouverte ? (
        <>
          <Ligne label={TEXTES.cheptel.bilanAnnuel.au0101Annee(annee)} valeur={bilan.stockDebutAnnee} />
          <Ligne
            label={TEXTES.cheptel.bilanAnnuel.effectifActuelFinAnnee(annee)}
            valeur={bilan.stockFinAnnee}
          />
          <Text style={commonStyles.noteMarge}>
            {TEXTES.cheptel.bilanAnnuel.chevresBoucsEtCabrisConfondus}
            {annee}
            {TEXTES.cheptel.bilanAnnuel.dApresLesStatutsActuels}
          </Text>
        </>
      ) : null}
    </Card>
  );
}
