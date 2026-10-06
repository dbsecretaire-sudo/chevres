import { Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import { MIN_TRADES_OBSERVATIONS } from '@/shared/constants/trading';
import { styles } from '@/shared/styles/trading/Trading.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  constats: string[];
  /** Nombre de trades clos de l'année : en dessous du minimum, on explique pourquoi il n'y a pas d'observation. */
  clos: number;
}

/** Les constats que le journal tire des trades clos (plan, stratégies, état d'esprit, série de pertes…). */
export function ObservationsTrading({ constats, clos }: Props) {
  const T = TEXTES.trading.observations;
  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{T.titre}</Text>
      {clos < MIN_TRADES_OBSERVATIONS ? (
        <Text style={commonStyles.mutedItalic}>{T.pasAssezDeTrades(MIN_TRADES_OBSERVATIONS)}</Text>
      ) : constats.length === 0 ? (
        <Text style={commonStyles.mutedItalic}>{T.aucune}</Text>
      ) : (
        constats.map((constat) => (
          <View key={constat} style={styles.observation}>
            <Text style={styles.puceObservation}>•</Text>
            <Text style={styles.texteObservation}>{constat}</Text>
          </View>
        ))
      )}
    </Card>
  );
}
