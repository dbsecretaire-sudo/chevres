import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';
import type { SoldesTransactions } from '@/features/comptabilite/services/filtresTransactions';
import { colors } from '@/shared/theme/colors';
import { formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/comptabilite/ListeTransactions.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface CarteSoldeProps {
  soldes: SoldesTransactions;
  anneeActive: number;
  filtresActifs: boolean;
}

/**
 * Solde (hors « autre »), rentrées, dépenses, et solde toutes catégories incluses. Replié par défaut : le solde
 * et les deux totaux en couleur tiennent sur deux lignes ; un appui déplie le détail.
 */
export function CarteSolde({ soldes, anneeActive, filtresActifs }: CarteSoldeProps) {
  const [deplie, setDeplie] = useState(false);
  const couleurSolde = soldes.balance >= 0 ? colors.primary : colors.danger;
  // Le signe « - » seulement s'il y a des dépenses (pas de « -0,00 € »).
  const depenses = `${soldes.totalDepenses > 0 ? '-' : ''}${formatMontant(soldes.totalDepenses)}`;

  if (!deplie) {
    return (
      <Pressable onPress={() => setDeplie(true)}>
        <Card style={styles.soldeCompact}>
          <View style={styles.soldeCompactLigne}>
            <Text style={commonStyles.lineSemiBold}>
              {TEXTES.comptabilite.listeTransactions.soldeEspace}
              {filtresActifs ? TEXTES.comptabilite.listeTransactions.filtre : anneeActive}
            </Text>
            <View style={styles.soldeCompactValeur}>
              <Text style={[styles.soldeCompactMontant, { color: couleurSolde }]}>
                {formatMontant(soldes.balance)}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </View>
          </View>
          <View style={styles.soldeCompactLigne}>
            <Text style={[styles.statValeur, { color: colors.primary }]}>
              {formatMontant(soldes.totalRentrees)}
            </Text>
            <Text style={[styles.statValeur, { color: colors.danger }]}>{depenses}</Text>
          </View>
        </Card>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={() => setDeplie(false)}>
      <Card style={styles.balanceCard}>
        <Text style={commonStyles.caption}>
          {TEXTES.comptabilite.listeTransactions.soldeEspace}
          {filtresActifs ? TEXTES.comptabilite.listeTransactions.filtre : anneeActive}{' '}
          {TEXTES.comptabilite.listeTransactions.horsAlimentationAutre}
        </Text>
        <Text style={[styles.balanceValeur, { color: couleurSolde }]}>{formatMontant(soldes.balance)}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBloc}>
            <Text style={styles.statLabel}>{TEXTES.comptabilite.listeTransactions.rentrees}</Text>
            <Text style={[styles.statValeur, { color: colors.primary }]}>
              {formatMontant(soldes.totalRentrees)}
            </Text>
          </View>
          <View style={styles.statSeparateur} />
          <View style={styles.statBloc}>
            <Text style={styles.statLabel}>{TEXTES.commun.general.depenses}</Text>
            <Text style={[styles.statValeur, { color: colors.danger }]}>{depenses}</Text>
          </View>
        </View>

        <Text style={commonStyles.captionTop}>
          {TEXTES.comptabilite.listeTransactions.soldeToutesCategoriesInclusesDeuxPoints}
          {formatMontant(soldes.balanceAvecAutre)}
        </Text>
      </Card>
    </Pressable>
  );
}

interface BarreRechercheProps {
  recherche: string;
  onRecherche: (texte: string) => void;
  filtresActifs: boolean;
  onOuvrirFiltres: () => void;
  onEffacerFiltres: () => void;
}

/** Champ de recherche, bouton « Filtrer » et, quand des filtres sont actifs, « Effacer ». */
export function BarreRecherche({
  recherche,
  onRecherche,
  filtresActifs,
  onOuvrirFiltres,
  onEffacerFiltres,
}: BarreRechercheProps) {
  return (
    <View style={styles.rowFiltre}>
      <View style={commonStyles.flex1}>
        <FormField
          value={recherche}
          onChangeText={onRecherche}
          placeholder={TEXTES.comptabilite.listeTransactions.rechercherPoints}
        />
      </View>
      <Pressable style={commonStyles.chip} onPress={onOuvrirFiltres}>
        <Text style={commonStyles.labelMuted}>
          {filtresActifs
            ? TEXTES.comptabilite.listeTransactions.filtresActifs
            : TEXTES.commun.general.filtrer}
        </Text>
      </Pressable>
      {filtresActifs && (
        <Pressable style={styles.filtreEffacer} onPress={onEffacerFiltres}>
          <Text style={styles.filtreEffacerTexte}>{TEXTES.comptabilite.listeTransactions.effacer}</Text>
        </Pressable>
      )}
    </View>
  );
}
