import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import type { SoldesTransactions } from '@/features/comptabilite/services/filtresTransactions';
import { colors } from '@/shared/theme/colors';
import { ROUTES } from '@/shared/constants/routes';
import { formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/comptabilite/ListeTransactions.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface CarteSoldeProps {
  soldes: SoldesTransactions;
  anneeActive: number;
  /** « Tout » est choisi : le solde regroupe toutes les années. */
  toutesAnnees?: boolean;
  filtresActifs: boolean;
}

/**
 * Solde, rentrées et dépenses, avec le lien « Détails » vers le détail par catégorie. Déplié d'office ; un appui sur la carte
 * la replie : le solde et les deux totaux en couleur tiennent alors sur deux lignes.
 */
export function CarteSolde({ soldes, anneeActive, toutesAnnees, filtresActifs }: CarteSoldeProps) {
  const router = useRouter();
  const [deplie, setDeplie] = useState(true);
  const couleurSolde = soldes.balance >= 0 ? colors.primary : colors.danger;
  // Le fond de la carte dit le résultat d'un coup d'œil : vert clair quand il est positif, rouge clair quand il est négatif.
  const fondSolde = { backgroundColor: soldes.balance >= 0 ? colors.badgeBg : colors.dangerFond };
  // Le signe « - » seulement s'il y a des dépenses (pas de « -0,00 € »).
  const periode = filtresActifs
    ? TEXTES.comptabilite.listeTransactions.filtre
    : toutesAnnees
      ? TEXTES.comptabilite.listeTransactions.toutesLesAnnees
      : anneeActive;
  const depenses = `${soldes.totalDepenses > 0 ? '-' : ''}${formatMontant(soldes.totalDepenses)}`;

  if (!deplie) {
    return (
      <Pressable onPress={() => setDeplie(true)}>
        <Card style={{ ...styles.soldeCompact, ...fondSolde }}>
          <View style={styles.soldeCompactLigne}>
            <Text style={commonStyles.lineSemiBold}>
              {TEXTES.comptabilite.listeTransactions.soldeEspace}
              {periode}
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
      <Card style={{ ...styles.balanceCard, ...fondSolde }}>
        <Pressable
          style={styles.soldeDetails}
          hitSlop={8}
          onPress={() => router.push(ROUTES.COMPTABILITE_DETAIL)}
        >
          <Text style={styles.soldeDetailsTexte}>{TEXTES.comptabilite.listeTransactions.details}</Text>
        </Pressable>
        <Text style={commonStyles.caption}>
          {TEXTES.comptabilite.listeTransactions.soldeEspace}
          {periode}
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
        <ChampRecherche
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
