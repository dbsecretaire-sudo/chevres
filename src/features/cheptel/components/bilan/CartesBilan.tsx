import { Pressable, Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import type { AnimalVenduBilan, Bilan } from '@/features/cheptel/services/bilanCheptel';
import {
  AnimauxVendus,
  DatesAbattoir,
  Ligne,
  TitreCarte,
  VoirPlus,
  useDetailsOuverts,
} from '@/features/cheptel/components/bilan/BilanBriques';
import { styles } from '@/shared/styles/cheptel/BilanAnnuel.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface CarteProps {
  bilan: Bilan;
  /** Bilan de l'année précédente, pour la comparaison entre parenthèses. */
  precedent: Bilan | null;
  annee: number;
}

/** Chèvres vivantes en fin d'année qui ne sont pas des renouvellements de cette année-là : le troupeau déjà établi. */
const chevresAnciennes = (b: Bilan) => b.chevresVivantesFinAnnee - b.chevresRenouvellementFinAnnee;

/** Boucs vivants en fin d'année qui ne sont pas des renouvellements de cette année-là : le troupeau déjà établi. */
const boucsAnciens = (b: Bilan) => b.boucsVivantsFinAnnee - b.boucsRenouvellementFinAnnee;

/** Vendus (inventaire) : le total des bouclés en tête, le détail bouclés / non bouclés dans un « Voir plus ». */
function BlocVendus({
  label,
  boucles,
  nonBoucles,
  precedentBoucles,
  precedentNonBoucles,
  listeBoucles,
  listeNonBoucles,
  libelleBoucle,
  libelleNonBoucle,
  priseEnCompte,
}: {
  label: string;
  boucles: number;
  nonBoucles: number;
  precedentBoucles?: number;
  precedentNonBoucles?: number;
  listeBoucles: AnimalVenduBilan[];
  listeNonBoucles: AnimalVenduBilan[];
  libelleBoucle: string;
  libelleNonBoucle: string;
  priseEnCompte: string;
}) {
  const details = useDetailsOuverts();
  return (
    <>
      {/* Le libellé est lui-même le lien : il déroule le détail. */}
      <View style={styles.ligne}>
        <Pressable
          onPress={details.basculer}
          accessibilityLabel={
            details.ouvert ? TEXTES.commun.general.voirMoins : TEXTES.commun.general.voirPlus
          }
        >
          <Text style={styles.libelleLien}>{label}</Text>
        </Pressable>
        <View style={styles.ligneValeurs}>
          <Text style={commonStyles.cardTitle}>{boucles}</Text>
          {precedentBoucles !== undefined && <Text style={commonStyles.muted}>({precedentBoucles})</Text>}
        </View>
      </View>
      {details.ouvert && (
        <View style={styles.sousLignes}>
          <Ligne
            label={`${libelleBoucle} ${priseEnCompte}`}
            valeur={boucles}
            comparaison={precedentBoucles}
          />
          <AnimauxVendus animaux={listeBoucles} />
          <Ligne
            label={`${libelleNonBoucle} ${TEXTES.cheptel.bilanAnnuel.pourInformation}`}
            valeur={nonBoucles}
            comparaison={precedentNonBoucles}
          />
          <AnimauxVendus animaux={listeNonBoucles} />
        </View>
      )}
    </>
  );
}

export function CarteCabris({ bilan, precedent, annee }: CarteProps) {
  const details = useDetailsOuverts();

  return (
    <Card>
      <TitreCarte
        titre={`${TEXTES.commun.general.cabrisNesEnEspace}${annee}`}
        valeur={bilan.cabritsTotal}
        comparaison={precedent?.cabritsTotal}
      />
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
            <BlocVendus
              label={TEXTES.cheptel.bilanAnnuel.vendusStock}
              boucles={bilan.cabritsVendusBoucles}
              nonBoucles={bilan.cabritsVendusNonBoucles}
              precedentBoucles={precedent?.cabritsVendusBoucles}
              precedentNonBoucles={precedent?.cabritsVendusNonBoucles}
              listeBoucles={bilan.cabritsVendusBouclesListe}
              listeNonBoucles={bilan.cabritsVendusNonBouclesListe}
              libelleBoucle={TEXTES.cheptel.bilanAnnuel.boucle}
              libelleNonBoucle={TEXTES.cheptel.bilanAnnuel.nonBoucle}
              priseEnCompte={TEXTES.cheptel.bilanAnnuel.priseEnCompteMasculin}
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
    </Card>
  );
}

export function CarteChevres({ bilan, precedent, annee }: CarteProps) {
  const details = useDetailsOuverts();

  return (
    <Card>
      <TitreCarte
        titre={TEXTES.commun.general.chevres}
        valeur={bilan.chevresVivantesFinAnnee}
        comparaison={precedent?.chevresVivantesFinAnnee}
      />
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
          <BlocVendus
            label={TEXTES.cheptel.bilanAnnuel.venduesStock}
            boucles={bilan.chevresVenduesBouclees}
            nonBoucles={bilan.chevresVenduesNonBouclees}
            precedentBoucles={precedent?.chevresVenduesBouclees}
            precedentNonBoucles={precedent?.chevresVenduesNonBouclees}
            listeBoucles={bilan.chevresVenduesBoucleesListe}
            listeNonBoucles={bilan.chevresVenduesNonBoucleesListe}
            libelleBoucle={TEXTES.cheptel.bilanAnnuel.bouclee}
            libelleNonBoucle={TEXTES.cheptel.bilanAnnuel.nonBouclee}
            priseEnCompte={TEXTES.cheptel.bilanAnnuel.priseEnCompteFeminin}
          />
        </>
      )}
    </Card>
  );
}

export function CarteBoucs({ bilan, precedent, annee }: CarteProps) {
  const details = useDetailsOuverts();

  return (
    <Card>
      <TitreCarte
        titre={TEXTES.commun.general.boucs}
        valeur={bilan.boucsVivantsFinAnnee}
        comparaison={precedent?.boucsVivantsFinAnnee}
      />
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
          <BlocVendus
            label={TEXTES.cheptel.bilanAnnuel.vendusStock}
            boucles={bilan.boucsVendusBoucles}
            nonBoucles={bilan.boucsVendusNonBoucles}
            precedentBoucles={precedent?.boucsVendusBoucles}
            precedentNonBoucles={precedent?.boucsVendusNonBoucles}
            listeBoucles={bilan.boucsVendusBouclesListe}
            listeNonBoucles={bilan.boucsVendusNonBouclesListe}
            libelleBoucle={TEXTES.cheptel.bilanAnnuel.boucle}
            libelleNonBoucle={TEXTES.cheptel.bilanAnnuel.nonBoucle}
            priseEnCompte={TEXTES.cheptel.bilanAnnuel.priseEnCompteMasculin}
          />
        </>
      )}
    </Card>
  );
}

export function CarteEffectif({ bilan, annee }: Pick<CarteProps, 'bilan' | 'annee'>) {
  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{TEXTES.cheptel.bilanAnnuel.effectifDuTroupeau}</Text>
      <Ligne label={TEXTES.cheptel.bilanAnnuel.au0101Annee(annee)} valeur={bilan.stockDebutAnnee} />
      <Ligne label={TEXTES.cheptel.bilanAnnuel.effectifActuelFinAnnee(annee)} valeur={bilan.stockFinAnnee} />
      <Text style={commonStyles.noteMarge}>
        {TEXTES.cheptel.bilanAnnuel.chevresBoucsEtCabrisConfondus}
        {annee}
        {TEXTES.cheptel.bilanAnnuel.dApresLesStatutsActuels}
      </Text>
    </Card>
  );
}
