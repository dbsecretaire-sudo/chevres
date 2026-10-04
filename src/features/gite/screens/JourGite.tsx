import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/ScreenList';
import { Card } from '@/shared/components/Card';
import { listSejours } from '@/features/gite/repository';
import { sejourDeLaNuit } from '@/features/gite/services/occupation';
import type { Sejour } from '@/features/gite/types';
import { CHAMBRES_PAR_COTE, NOMBRE_CHAMBRES_GITE } from '@/shared/constants/gite';
import { LOCALE } from '@/shared/constants/format';
import { HEURE_MIDI } from '@/shared/constants/temps';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { ajouterJours } from '@/shared/utils/calendrier';
import { formatDateShortFR, formatMontant } from '@/shared/utils/dates';
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

  useFocusEffect(
    useCallback(() => {
      listSejours().then(setSejours);
    }, []),
  );

  const parChambre = (chambre: number) => sejourDeLaNuit(sejours, chambre, date);
  const occupes = Array.from({ length: NOMBRE_CHAMBRES_GITE }, (_, i) => parChambre(i + 1)).filter(
    (s): s is Sejour => !!s,
  );
  const personnes = occupes.reduce((total, s) => total + s.personnes, 0);

  const changerJour = (decalage: number) => router.setParams({ date: ajouterJours(date, decalage) });

  const chambre = (numero: number) => {
    const sejour = parChambre(numero);
    return (
      <Pressable
        key={numero}
        style={[styles.chambre, sejour && styles.chambreOccupee]}
        onPress={() => router.push(sejour ? ROUTES.sejour(sejour.id) : ROUTES.sejourNouveau(numero, date))}
      >
        <Text style={styles.chambreNumero}>{TEXTES.gite.jour.chambre(numero)}</Text>
        {sejour ? (
          <>
            <Text style={styles.chambreNom} numberOfLines={2}>
              {sejour.nom}
            </Text>
            <Text style={styles.chambreInfo}>{T.personnes(sejour.personnes)}</Text>
            <Text style={styles.chambreInfo}>{formatMontant(sejour.prix)}</Text>
            <Text style={styles.chambreDates}>
              {T.dates(formatDateShortFR(sejour.arrivee), formatDateShortFR(sejour.depart))}
            </Text>
          </>
        ) : (
          <Text style={styles.chambreLibre}>{T.libre}</Text>
        )}
      </Pressable>
    );
  };

  const numeros = Array.from({ length: CHAMBRES_PAR_COTE }, (_, i) => i + 1);

  return (
    <Screen scroll={false}>
      <Stack.Screen options={{ title: formatDateShortFR(date) }} />
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
          <Text style={commonStyles.lineBold}>
            {T.resume(occupes.length, NOMBRE_CHAMBRES_GITE, personnes)}
          </Text>
        </Card>

        <View style={styles.couloir}>
          <View style={styles.colonneChambres}>
            <Text style={styles.titreCote}>{T.gauche}</Text>
            {numeros.map((n) => chambre(n))}
          </View>
          <View style={styles.bandeCouloir} />
          <View style={styles.colonneChambres}>
            <Text style={styles.titreCote}>{T.droite}</Text>
            {numeros.map((n) => chambre(n + CHAMBRES_PAR_COTE))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
