import { LigneFiltres } from '@/features/etablissements/components/LigneFiltres';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { EmptyState } from '@/shared/components/EmptyState';
import { YearPicker } from '@/shared/components/YearPicker';
import { Fab } from '@/shared/components/Fab';
import { LigneDeBloc } from '@/shared/components/BlocListe';
import { BandeauRestriction } from '@/features/comptabilite/components/BandeauRestriction';
import { FiltreTransactionsModal } from '@/features/comptabilite/components/FiltreTransactionsModal';
import { LigneTransaction } from '@/features/comptabilite/components/LigneTransaction';
import { BarreRecherche, CarteSolde } from '@/features/comptabilite/components/SoldeTransactions';
import { useListeTransactions } from '@/features/comptabilite/hooks/useListeTransactions';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/comptabilite/ListeTransactions.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';
import { TableauEcritures } from '@/features/comptabilite/components/TableauEcritures';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';

export default function ComptabiliteIndex() {
  const router = useRouter();
  const e = useListeTransactions();
  // Affichage sobre sur un grand écran : les écritures en tableau.
  const comptable = useDispositionComptable();

  return (
    <Screen scroll={false}>
      {comptable ? (
        <TableauEcritures e={e} />
      ) : (
      <FlatList
        data={e.filtrees}
        // Années, activités, solde et recherche défilent avec la liste : plus de place pour les écritures.
        ListHeaderComponent={
          <View style={[commonStyles.topBox, styles.entete]}>
            {e.restriction ? <BandeauRestriction titre={e.restriction.titre} onEffacer={e.effacerRestriction} /> : null}
            <LigneFiltres>
              <YearPicker
                annees={e.annees}
                value={e.anneeActive}
                onChange={e.setAnneeActive}
                tout={e.toutesAnnees}
                onChoisirTout={e.choisirToutesAnnees}
              />
            </LigneFiltres>
            <CarteSolde
              soldes={e.soldes}
              anneeActive={e.anneeActive}
              toutesAnnees={e.toutesAnnees}
              filtresActifs={e.filtresActifs}
            />
            <BarreRecherche
              recherche={e.recherche}
              onRecherche={e.setRecherche}
              filtresActifs={e.filtresActifs}
              onOuvrirFiltres={() => e.setFiltreOuvert(true)}
              onEffacerFiltres={e.effacerFiltres}
            />
          </View>
        }
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => `${item.id}:${item.activite}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title={TEXTES.comptabilite.listeTransactions.aucuneEcriture}
            subtitle={TEXTES.comptabilite.listeTransactions.ventesEtFacturesDeL}
          />
        }
        renderItem={({ item, index }) => (
          <LigneDeBloc index={index} total={e.filtrees.length}>
            <LigneTransaction item={item} />
          </LigneDeBloc>
        )}
      />
      )}

      <FiltreTransactionsModal
        visible={e.filtreOuvert}
        onClose={() => e.setFiltreOuvert(false)}
        valeur={e.filtres}
        onChange={e.setFiltres}
        annee={e.anneeActive}
        anneeLibre={e.toutesAnnees}
      />

      <Fab
        options={[
                {
                  label: TEXTES.commun.general.debit,
                  icon: 'remove-circle',
                  color: colors.danger,
                  onPress: () =>
                    router.push({
                      pathname: ROUTES.COMPTABILITE_NOUVELLE,
                      params: { type: TYPE_FACTURE.RECUE },
                    }),
                },
                {
                  label: TEXTES.commun.general.credit,
                  icon: 'add-circle',
                  color: colors.primary,
                  onPress: () =>
                    router.push({
                      pathname: ROUTES.COMPTABILITE_NOUVELLE,
                      params: { type: TYPE_FACTURE.EMISE },
                    }),
                },
              ]}
      />
    </Screen>
  );
}
