import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { ListRow } from '@/shared/components/ListRow';
import { TuileChiffre } from '@/features/accueil/components/TuileChiffre';
import { CourbeCumul } from '@/features/trading/components/CourbeCumul';
import { calculerStatistiques, resultatTrade, tradesDeLAnnee } from '@/features/trading/services/calculs';
import { resultatSigne } from '@/features/trading/services/observations';
import type { Trade } from '@/features/trading/types';
import { NOMBRE_TRADES_ACCUEIL } from '@/shared/constants/trading';
import { ROUTES } from '@/shared/constants/routes';
import { LABEL_SENS_TRADE } from '@/shared/textes/libelles';
import { formatDateShortFR } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/trading/Trading.styles';
import { styles as stylesAccueil } from '@/shared/styles/accueil/Accueil.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/**
 * Le cœur de l'accueil d'une activité financière : la courbe du cumul des résultats de l'année, le taux de réussite et
 * le nombre de trades clos, puis les derniers trades. Le journal complet est à un appui.
 */
export function AccueilTrading({ trades, annee }: { trades: Trade[]; annee: string }) {
  const router = useRouter();
  const T = TEXTES.trading;
  const delAnnee = tradesDeLAnnee(trades, annee);

  if (delAnnee.length === 0) {
    return <EmptyState title={T.journal.aucunTrade} subtitle={T.journal.aucunTradeDetail} />;
  }

  const stats = calculerStatistiques(delAnnee);
  const recents = [...delAnnee]
    .sort((a, b) => (b.dateSortie ?? b.dateEntree).localeCompare(a.dateSortie ?? a.dateEntree))
    .slice(0, NOMBRE_TRADES_ACCUEIL);

  return (
    <View style={commonStyles.gap10}>
      <CourbeCumul trades={delAnnee} />
      <View style={commonStyles.row}>
        <TuileChiffre
          valeur={stats.tauxReussite === undefined ? '—' : `${stats.tauxReussite} %`}
          label={T.statistiques.tauxReussite}
          onPress={() => router.push(ROUTES.JOURNAL_TRADING)}
        />
        <TuileChiffre
          valeur={String(stats.clos)}
          label={T.accueil.tradesClos}
          onPress={() => router.push(ROUTES.JOURNAL_TRADING)}
        />
      </View>

      <Text style={stylesAccueil.sectionTitle}>{T.accueil.derniersTrades}</Text>
      {recents.map((t) => {
        const resultat = resultatTrade(t);
        return (
          <ListRow
            key={t.id}
            title={`${t.instrument} · ${LABEL_SENS_TRADE[t.sens]}`}
            subtitle={formatDateShortFR(t.dateSortie ?? t.dateEntree)}
            trailing={
              <Text
                style={[
                  styles.resultatLigne,
                  resultat === undefined ? commonStyles.muted : resultat >= 0 ? styles.gain : styles.perte,
                ]}
              >
                {resultatSigne(t) ?? T.journal.ouvert}
              </Text>
            }
            onPress={() => router.push(ROUTES.trade(t.id))}
          />
        );
      })}
      <Button
        variant="secondary"
        label={T.accueil.ouvrirLeJournal}
        onPress={() => router.push(ROUTES.JOURNAL_TRADING)}
      />
    </View>
  );
}
