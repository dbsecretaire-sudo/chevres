import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/ScreenList';
import { Card } from '@/shared/components/Card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { Fab } from '@/shared/components/Fab';
import { InfoModal } from '@/shared/components/InfoModal';
import { HeaderBackTo } from '@/shared/components/HeaderBackTo';
import { ChambreModal } from '@/features/gite/components/ChambreModal';
import { useChambres } from '@/features/gite/hooks/useChambres';
import { ajouterChambre, listSejours, supprimerChambre } from '@/features/gite/repository';
import { sejourDeLaNuit } from '@/features/gite/services/occupation';
import { totalDuSejour } from '@/features/gite/services/tarifSejour';
import type { Sejour } from '@/features/gite/types';
import { COTE_CHAMBRE } from '@/shared/constants/gite';
import { LOCALE } from '@/shared/constants/format';
import { HEURE_MIDI } from '@/shared/constants/temps';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { ajouterJours } from '@/shared/utils/calendrier';
import { formatDateFR, formatDateShortFR, formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/gite/Gite.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.gite.jour;

/** Une date en toutes lettres : « samedi 4 octobre 2026 ». */
const dateEnToutesLettres = (iso: string) =>
  new Date(`${iso}${HEURE_MIDI}`).toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/**
 * Un jour au gîte : le couloir au milieu, trois chambres à gauche et trois à droite. Chaque chambre montre qui la loue
 * cette nuit-là, le nombre de personnes et le prix payé (qui apparaît aussi en comptabilité) ; une chambre libre
 * propose d'ajouter un séjour. On passe d'un jour à l'autre avec les flèches.
 */
export default function JourGite() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const { chambres, recharger } = useChambres();
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  /** La chambre qu'on est en train de supprimer (en attente de confirmation) et celle qui ne peut pas l'être. */
  const [aSupprimer, setASupprimer] = useState<number | null>(null);
  const [refusee, setRefusee] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      listSejours().then(setSejours);
    }, []),
  );

  const parChambre = (chambre: number) => sejourDeLaNuit(sejours, chambre, date);
  const occupes = chambres.map((c) => parChambre(c.numero)).filter((s): s is Sejour => !!s);
  // Un séjour de plusieurs chambres compte une seule fois ses personnes.
  const personnes = [...new Set(occupes)].reduce((total, s) => total + (s.personnes ?? 0), 0);

  const changerJour = (decalage: number) => router.setParams({ date: ajouterJours(date, decalage) });

  const chambre = (numero: number) => {
    const sejour = parChambre(numero);
    return (
      <Pressable
        key={numero}
        style={[styles.chambre, sejour && styles.chambreOccupee]}
        onPress={() => router.push(sejour ? ROUTES.sejour(sejour.id) : ROUTES.sejourNouveau(numero, date))}
      >
        <View style={styles.enteteChambre}>
          <Text style={styles.chambreNumero}>{TEXTES.gite.jour.chambre(numero)}</Text>
          <Pressable
            onPress={() => setASupprimer(numero)}
            hitSlop={10}
            accessibilityLabel={TEXTES.gite.chambre.supprimer}
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
        {sejour ? (
          <>
            <View style={styles.enteteChambre}>
              <Text style={[styles.chambreNom, commonStyles.flex1]} numberOfLines={2}>
                {sejour.nom}
              </Text>
              {sejour.personnes ? (
                <Text style={styles.chambreInfo}>{T.personnesEntreParentheses(sejour.personnes)}</Text>
              ) : null}
            </View>
            <Text style={styles.chambreInfo}>
              {T.chambresEtRepas(sejour.chambres.length, sejour.repas ?? 0)}
            </Text>
            <Text style={styles.chambreInfo}>
              {T.montantEtTiret(formatMontant(totalDuSejour(sejour)))}
              <Text style={sejour.paye ? styles.chambrePaye : styles.chambreAlerte}>
                {sejour.paye ? T.paye : T.aRegler}
              </Text>
            </Text>
            <Text style={styles.chambreDates}>
              {T.dates(formatDateFR(sejour.arrivee), formatDateFR(sejour.depart))}
            </Text>
          </>
        ) : (
          <Text style={styles.chambreLibre}>{T.libre}</Text>
        )}
      </Pressable>
    );
  };

  const duCote = (cote: string) => chambres.filter((c) => c.cote === cote).map((c) => c.numero);
  const prochainNumero = Math.max(0, ...chambres.map((c) => c.numero)) + 1;

  return (
    <Screen scroll={false}>
      <Stack.Screen
        options={{
          title: formatDateShortFR(date),
          // On revient toujours au calendrier du gîte, d'où que l'on arrive.
          headerLeft: () => <HeaderBackTo to={ROUTES.GITE} />,
        }}
      />
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        <View style={styles.enteteJour2}>
          <Pressable
            style={styles.boutonJour}
            onPress={() => changerJour(-1)}
            accessibilityLabel={T.jourPrecedent}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.titreJour}>{dateEnToutesLettres(date)}</Text>
          <Pressable
            style={styles.boutonJour}
            onPress={() => changerJour(1)}
            accessibilityLabel={T.jourSuivant}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </Pressable>
        </View>

        <Card>
          <Text style={commonStyles.lineBold}>{T.resume(occupes.length, chambres.length, personnes)}</Text>
        </Card>

        <View style={styles.couloir}>
          <View style={styles.colonneChambres}>
            <Text style={styles.titreCote}>{T.gauche}</Text>
            {duCote(COTE_CHAMBRE.GAUCHE).map(chambre)}
          </View>
          <View style={styles.bandeCouloir} />
          <View style={styles.colonneChambres}>
            <Text style={styles.titreCote}>{T.droite}</Text>
            {duCote(COTE_CHAMBRE.DROITE).map(chambre)}
          </View>
        </View>
      </ScrollView>

      <Fab
        options={[
          {
            label: TEXTES.gite.chambre.ajouterUneChambre,
            icon: 'add-circle',
            onPress: () => setAjoutOuvert(true),
          },
        ]}
      />
      <ConfirmModal
        visible={aSupprimer !== null}
        title={TEXTES.gite.chambre.supprimerQuestion}
        message={TEXTES.gite.chambre.supprimerMessage(aSupprimer ?? 0)}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setASupprimer(null)}
        onConfirm={async () => {
          const numero = aSupprimer;
          setASupprimer(null);
          if (numero === null) return;
          if (!(await supprimerChambre(numero))) setRefusee(numero);
          recharger();
        }}
      />
      <InfoModal
        visible={refusee !== null}
        title={TEXTES.gite.chambre.suppressionImpossible}
        message={TEXTES.gite.chambre.suppressionImpossibleMessage(refusee ?? 0)}
        onClose={() => setRefusee(null)}
      />
      <ChambreModal
        visible={ajoutOuvert}
        prochainNumero={prochainNumero}
        onValider={async (cote) => {
          await ajouterChambre(cote);
          setAjoutOuvert(false);
          recharger();
        }}
        onFermer={() => setAjoutOuvert(false)}
      />
    </Screen>
  );
}
