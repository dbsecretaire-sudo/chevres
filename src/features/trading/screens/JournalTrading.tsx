import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { EmptyState } from '@/shared/components/EmptyState';
import { Fab } from '@/shared/components/Fab';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { ListRow } from '@/shared/components/ListRow';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { YearPicker } from '@/shared/components/YearPicker';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { normaliser } from '@/features/dossiers/services/recherche';
import { CourbeCumul } from '@/features/trading/components/CourbeCumul';
import { ObservationsTrading } from '@/features/trading/components/ObservationsTrading';
import { RepartitionTrading } from '@/features/trading/components/RepartitionTrading';
import { StatistiquesTrading } from '@/features/trading/components/StatistiquesTrading';
import { listTrades } from '@/features/trading/repository';
import { calculerStatistiques, estClos, resultatTrade } from '@/features/trading/services/calculs';
import { observationsDuJournal, resultatSigne } from '@/features/trading/services/observations';
import type { Trade } from '@/features/trading/types';
import { FILTRE_TRADES } from '@/shared/constants/trading';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { ROUTES } from '@/shared/constants/routes';
import { LABEL_FILTRE_TRADES, LABEL_SENS_TRADE } from '@/shared/textes/libelles';
import { currentYear, formatDateShortFR } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/trading/Trading.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

type FiltreTrades = ValeurDe<typeof FILTRE_TRADES>;

const PUCES_FILTRE = Object.values(FILTRE_TRADES).map((valeur) => ({
  valeur,
  label: LABEL_FILTRE_TRADES[valeur],
}));

const correspondAuFiltre = (t: Trade, filtre: FiltreTrades): boolean => {
  switch (filtre) {
    case FILTRE_TRADES.OUVERTS:
      return !estClos(t);
    case FILTRE_TRADES.GAGNANTS:
      return (resultatTrade(t) ?? 0) > 0;
    case FILTRE_TRADES.PERDANTS:
      return (resultatTrade(t) ?? 0) < 0;
    case FILTRE_TRADES.HORS_PLAN:
      return t.planRespecte === false;
    default:
      return true;
  }
};

/**
 * Le journal de trading de l'année active : les chiffres clés, les observations tirées de vos propres trades, la
 * répartition des résultats, puis la liste des trades (recherche et filtres). Le bouton « + » note un nouveau trade.
 */
export default function JournalTrading() {
  const router = useRouter();
  const { settings, setAnneeActive, choisirToutesAnnees } = useAppSettings();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [requete, setRequete] = useState('');
  const [filtre, setFiltre] = useState<FiltreTrades>(FILTRE_TRADES.TOUS);
  const T = TEXTES.trading.journal;

  useFocusEffect(
    useCallback(() => {
      listTrades().then(setTrades);
    }, []),
  );

  const annee = settings.anneeActive;
  const annees = Array.from(
    new Set([currentYear(), annee, ...trades.map((t) => Number(t.dateEntree.slice(0, 4)))]),
  ).filter((a) => Number.isFinite(a));

  // « Tout » : les trades de toutes les années ; sinon ceux de l'année active.
  const regrouper = !!settings.toutesAnnees;
  const delAnnee = regrouper ? trades : trades.filter((t) => t.dateEntree.startsWith(String(annee)));
  const stats = calculerStatistiques(delAnnee);

  const termes = normaliser(requete).split(/\s+/).filter(Boolean);
  const affiches = delAnnee.filter((t) => {
    if (!correspondAuFiltre(t, filtre)) return false;
    const texte = normaliser(
      [t.instrument, t.strategie, t.notes, ...(t.etiquettes ?? []), formatDateShortFR(t.dateEntree)].join(
        ' ',
      ),
    );
    return termes.every((terme) => texte.includes(terme));
  });

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        <YearPicker
          annees={annees}
          value={annee}
          onChange={setAnneeActive}
          tout={regrouper}
          onChoisirTout={choisirToutesAnnees}
        />

        {delAnnee.length > 0 ? (
          <>
            <StatistiquesTrading stats={stats} />
            <CourbeCumul trades={delAnnee} />
            <ObservationsTrading constats={observationsDuJournal(delAnnee)} clos={stats.clos} />
            <RepartitionTrading trades={delAnnee} />
            <Text style={commonStyles.note}>{T.avertissement}</Text>

            <ChampRecherche value={requete} onChangeText={setRequete} placeholder={T.rechercher} />
            <PucesDefilantes<FiltreTrades> puces={PUCES_FILTRE} valeur={filtre} onChoisir={setFiltre} />

            {affiches.length === 0 ? (
              <EmptyState title={T.aucunResultat} subtitle={T.modifiezLaRecherche} />
            ) : (
              <View style={commonStyles.gap10}>
                {affiches.map((t) => {
                  const resultat = resultatTrade(t);
                  return (
                    <ListRow
                      key={t.id}
                      title={`${t.instrument} · ${LABEL_SENS_TRADE[t.sens]}`}
                      subtitle={[
                        formatDateShortFR(t.dateEntree),
                        t.strategie,
                        t.planRespecte === false ? TEXTES.trading.journal.horsPlan : undefined,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      trailing={
                        <Text
                          style={[
                            styles.resultatLigne,
                            resultat === undefined
                              ? commonStyles.muted
                              : resultat >= 0
                                ? styles.gain
                                : styles.perte,
                          ]}
                        >
                          {resultatSigne(t) ?? T.ouvert}
                        </Text>
                      }
                      onPress={() => router.push(ROUTES.trade(t.id))}
                    />
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <EmptyState title={T.aucunTrade} subtitle={T.aucunTradeDetail} />
        )}
      </ScrollView>

      <Fab
        options={[
          {
            label: T.nouveauTrade,
            icon: 'trending-up',
            onPress: () => router.push(ROUTES.tradeNouveau),
          },
        ]}
      />
    </Screen>
  );
}
