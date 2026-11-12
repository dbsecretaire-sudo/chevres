import { FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { EmptyState } from '@/shared/components/EmptyState';
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
  const ouvrirNouvelle = (type: typeof TYPE_FACTURE.RECUE | typeof TYPE_FACTURE.EMISE) =>
    router.push({ pathname: ROUTES.COMPTABILITE_NOUVELLE, params: { type } });

  return (
    <Screen scroll={false}>
      {comptable ? (
        <TableauEcritures e={e} />
      ) : (
        <>
          <FlatList
            data={e.filtrees}
            // La liste s'arrête au-dessus des deux boutons du bas : la dernière écriture reste lisible.
            style={{ marginBottom: 40 }}
            // Années, solde et recherche défilent avec la liste : plus de place pour les écritures.
            ListHeaderComponent={
              <View style={[commonStyles.topBox, styles.entete]}>
                {/* Comme sur la maquette : la rubrique d'où vient la page, en légende de la liste. */}
                <Text style={commonStyles.muted}>Argent · toutes les factures</Text>
                {e.restriction ? <BandeauRestriction titre={e.restriction.titre} onEffacer={e.effacerRestriction} /> : null}
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
          {/* Les deux actions de la maquette, en bas : un débit (une dépense) et un crédit (une recette). */}
          <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, flexDirection: 'row', gap: 12 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => ouvrirNouvelle(TYPE_FACTURE.RECUE)}
              style={{ flex: 1, borderWidth: 1, borderColor: colors.danger, borderRadius: 14, padding: 14, alignItems: 'center', backgroundColor: colors.surface }}
            >
              <Text style={{ color: colors.danger, fontWeight: '800', fontSize: 16 }}>{`− ${TEXTES.commun.general.debit}`}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => ouvrirNouvelle(TYPE_FACTURE.EMISE)}
              style={{ flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', backgroundColor: colors.primary }}
            >
              <Text style={{ color: colors.blanc, fontWeight: '800', fontSize: 16 }}>{`+ ${TEXTES.commun.general.credit}`}</Text>
            </Pressable>
          </View>
        </>
      )}

      <FiltreTransactionsModal
        visible={e.filtreOuvert}
        onClose={() => e.setFiltreOuvert(false)}
        valeur={e.filtres}
        onChange={e.setFiltres}
        annee={e.anneeActive}
        anneeLibre={e.toutesAnnees}
      />
    </Screen>
  );
}
