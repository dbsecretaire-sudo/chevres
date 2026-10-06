import { useState } from 'react';
import { Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { grouperPar } from '@/features/trading/services/calculs';
import { jourDeLaSemaine } from '@/features/trading/services/observations';
import type { Trade } from '@/features/trading/types';
import { ANGLE_ANALYSE } from '@/shared/constants/trading';
import { LABEL_ANGLE_ANALYSE, LABEL_ETAT_ESPRIT } from '@/shared/textes/libelles';
import { formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/trading/Trading.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import type { ValeurDe } from '@/shared/constants/valeurDe';

type Angle = ValeurDe<typeof ANGLE_ANALYSE>;

const PUCES = Object.values(ANGLE_ANALYSE).map((valeur) => ({ valeur, label: LABEL_ANGLE_ANALYSE[valeur] }));

/** Les résultats des trades clos regroupés par stratégie, instrument, état d'esprit ou jour de la semaine. */
export function RepartitionTrading({ trades }: { trades: Trade[] }) {
  const T = TEXTES.trading.repartition;
  const [angle, setAngle] = useState<Angle>(ANGLE_ANALYSE.STRATEGIE);

  const groupes =
    angle === ANGLE_ANALYSE.STRATEGIE
      ? grouperPar(trades, (t) => t.strategie?.trim() || undefined)
      : angle === ANGLE_ANALYSE.INSTRUMENT
        ? grouperPar(trades, (t) => t.instrument.trim().toUpperCase() || undefined)
        : angle === ANGLE_ANALYSE.ETAT_ESPRIT
          ? grouperPar(
              trades,
              (t) => t.etatEsprit,
              (c) => LABEL_ETAT_ESPRIT[c as keyof typeof LABEL_ETAT_ESPRIT] ?? c,
            )
          : grouperPar(trades, (t) => jourDeLaSemaine(t.dateEntree));

  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{T.titre}</Text>
      <PucesDefilantes<Angle> puces={PUCES} valeur={angle} onChoisir={setAngle} />
      {groupes.length === 0 ? (
        <Text style={commonStyles.mutedItalic}>{T.aucune}</Text>
      ) : (
        <View>
          {groupes.map((g) => (
            <View key={g.cle} style={styles.ligneRepartition}>
              <View style={styles.repartitionTexte}>
                <Text style={styles.repartitionNom}>{g.libelle}</Text>
                <Text style={commonStyles.muted}>
                  {T.ligne(g.nombre, g.tauxReussite)} · {T.parTrade(formatMontant(g.moyenne))}
                </Text>
              </View>
              <Text style={[styles.repartitionMontant, g.resultat >= 0 ? styles.gain : styles.perte]}>
                {formatMontant(g.resultat)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
