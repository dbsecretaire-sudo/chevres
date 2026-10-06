import { Text, View } from 'react-native';
import type { Statistiques } from '@/features/trading/services/calculs';
import { formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/trading/Trading.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface TuileProps {
  label: string;
  valeur: string;
  aide?: string;
  /** Colore la valeur : en vert si positive, en rouge si négative. */
  signe?: number;
  grande?: boolean;
}

function Tuile({ label, valeur, aide, signe, grande }: TuileProps) {
  return (
    <View style={[styles.tuileStat, grande && styles.tuileStatGrande]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text
        style={[
          styles.statValeur,
          grande && styles.statValeurGrande,
          signe !== undefined && signe > 0 && styles.gain,
          signe !== undefined && signe < 0 && styles.perte,
        ]}
      >
        {valeur}
      </Text>
      {aide ? <Text style={styles.statAide}>{aide}</Text> : null}
    </View>
  );
}

/** Les chiffres clés des trades de l'année : résultat net, réussite, facteur de profit, moyennes, baisse maximale. */
export function StatistiquesTrading({ stats }: { stats: Statistiques }) {
  const T = TEXTES.trading.statistiques;
  const montant = (valeur?: number) => (valeur === undefined ? T.nonDisponible : formatMontant(valeur));
  const nombre = (valeur?: number) =>
    valeur === undefined ? T.nonDisponible : String(valeur).replace('.', ',');

  return (
    <View style={commonStyles.gap10}>
      <View style={styles.grilleStats}>
        <Tuile
          grande
          label={T.resultatNet}
          valeur={formatMontant(stats.resultatNet)}
          aide={T.nombres(stats.clos, stats.ouverts)}
          signe={stats.resultatNet}
        />
        <Tuile
          label={T.tauxReussite}
          valeur={stats.tauxReussite === undefined ? T.nonDisponible : `${stats.tauxReussite} %`}
        />
        <Tuile label={T.profitFactor} valeur={nombre(stats.profitFactor)} aide={T.aideProfitFactor} />
        <Tuile label={T.esperance} valeur={montant(stats.esperance)} signe={stats.esperance} />
        <Tuile label={T.rMoyen} valeur={nombre(stats.rMoyen)} aide={T.aideR} signe={stats.rMoyen} />
        <Tuile label={T.gainMoyen} valeur={montant(stats.gainMoyen)} />
        <Tuile label={T.perteMoyenne} valeur={montant(stats.perteMoyenne)} />
        <Tuile
          label={T.drawdownMax}
          valeur={stats.drawdownMax > 0 ? formatMontant(stats.drawdownMax) : T.nonDisponible}
          aide={T.aideDrawdown}
        />
      </View>
    </View>
  );
}
