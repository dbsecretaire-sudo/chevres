import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BandeauRestriction } from '@/features/comptabilite/components/BandeauRestriction';
import { PucesRubrique } from '@/features/comptabilite/components/PucesRubrique';
import { BarreRecherche } from '@/features/comptabilite/components/SoldeTransactions';
import type { useListeTransactions } from '@/features/comptabilite/hooks/useListeTransactions';
import type { Transaction } from '@/features/comptabilite/services/transactions';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { SENS_TRANSACTION, SOURCE_TRANSACTION } from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { LABEL_TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/textes/libelles';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';

const T = TEXTES.comptabilite.listeTransactions;

/** Le montant d'une écriture, s'il est une sortie (débit) ou une entrée (crédit) ; sinon rien. */
const montantDe = (t: Transaction, sens: Transaction['sens']): number | undefined =>
  t.sens === sens ? (t.montantComptabilise ?? 0) : undefined;

/** Les colonnes du tableau des écritures (les pages de lieu en reprennent une partie). */
export const COLONNES_ECRITURES: readonly ColonneDuTableau<Transaction>[] = [
  { cle: 'date', titre: 'Date', poids: 1.3, valeur: (t) => t.date, texte: (t) => formatDateFR(t.date) },
  { cle: 'libelle', titre: 'Libellé', poids: 2.4, valeur: (t) => t.titre },
  { cle: 'detail', titre: 'Détail', poids: 2.4, valeur: (t) => t.sousTitre },
  { cle: 'categorie', titre: 'Catégorie', poids: 1.6, valeur: (t) => t.libelleCategorie ?? '' },
  {
    cle: 'activite',
    titre: 'Activité',
    poids: 1.3,
    valeur: (t) => LABEL_TYPE_ANIMAL_ETABLISSEMENT[t.activite] ?? String(t.activite),
  },
  {
    cle: 'debit',
    titre: TEXTES.commun.general.debit,
    poids: 1.1,
    aligne: 'droite',
    valeur: (t) => montantDe(t, SENS_TRANSACTION.SORTIE),
    texte: (t) => (t.sens === SENS_TRANSACTION.SORTIE ? formatMontant(t.montantComptabilise ?? 0) : ''),
  },
  {
    cle: 'credit',
    titre: TEXTES.commun.general.credit,
    poids: 1.1,
    aligne: 'droite',
    valeur: (t) => montantDe(t, SENS_TRANSACTION.ENTREE),
    texte: (t) => (t.sens === SENS_TRANSACTION.ENTREE ? formatMontant(t.montantComptabilise ?? 0) : ''),
  },
];

/** Les colonnes avant les montants : le libellé « Totaux » ou « Balance » s'y écrit. */
const AVANT_LES_MONTANTS = ['date', 'libelle', 'detail', 'categorie', 'activite'];

/**
 * Les écritures (dépenses et recettes) en tableau, pour l'affichage sobre sur un grand écran : la recherche et les filtres au-dessus, une ligne par écriture (date, libellé,
 * détail, catégorie, activité, débit, crédit) qu'on trie d'un clic sur son titre, et sous le tableau le total des débits, des crédits et le solde. Un clic ouvre la fiche.
 */
export function TableauEcritures({ e }: { e: ReturnType<typeof useListeTransactions> }) {
  const router = useRouter();
  const { totalRentrees, totalDepenses, balance } = e.soldes;
  return (
    <View style={styles.cadre}>
      {e.restriction ? <BandeauRestriction titre={e.restriction.titre} onEffacer={e.effacerRestriction} /> : null}
      <View style={styles.filtres}>
        <PucesRubrique valeur={e.rubrique} onChange={e.setRubrique} />
        <View style={styles.recherche}>
          <BarreRecherche
            recherche={e.recherche}
            onRecherche={e.setRecherche}
            filtresActifs={e.filtresActifs}
            onOuvrirFiltres={() => e.setFiltreOuvert(true)}
            onEffacerFiltres={e.effacerFiltres}
          />
        </View>
      </View>
      <TableauDeDonnees
        colonnes={COLONNES_ECRITURES}
        lignes={e.filtrees}
        cleDeLaLigne={(t) => `${t.id}:${t.activite}`}
        tri={{ cle: 'date', decroissant: true }}
        vide={T.aucuneEcriture}
        onLigne={(t) => router.push(t.source === SOURCE_TRANSACTION.FACTURE ? ROUTES.ficheFacture(t.id) : ROUTES.ficheVente(t.id))}
        // Les totaux sous les colonnes Débit et Crédit, puis la balance sur les deux réunies.
        lignesDePied={[
          [
            { colonnes: AVANT_LES_MONTANTS, contenu: 'Totaux' },
            { colonnes: ['debit'], aligne: 'droite', contenu: <Text style={[styles.total, { color: colors.danger }]}>{formatMontant(totalDepenses)}</Text> },
            { colonnes: ['credit'], aligne: 'droite', contenu: <Text style={[styles.total, { color: colors.primary }]}>{formatMontant(totalRentrees)}</Text> },
          ],
          [
            { colonnes: AVANT_LES_MONTANTS, contenu: 'Balance' },
            { colonnes: ['debit', 'credit'], aligne: 'centre', contenu: <Text style={[styles.total, { color: balance >= 0 ? colors.primary : colors.danger }]}>{formatMontant(balance)}</Text> },
          ],
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Un espace sous le tableau : le bouton « + » flotte sans cacher les totaux.
  cadre: { flex: 1, gap: 8, paddingBottom: 64 },
  filtres: { gap: 6 },
  recherche: { maxWidth: 560 },
  total: { fontSize: 14, fontWeight: '800', color: colors.text },
});
