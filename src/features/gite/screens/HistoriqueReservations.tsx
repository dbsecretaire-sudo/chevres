import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/shared/components/EmptyState';
import { FormField } from '@/shared/components/FormField';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/Screen';
import { YearPicker } from '@/shared/components/YearPicker';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { normaliser } from '@/features/dossiers/services/recherche';
import { listTousLesSejours } from '@/features/gite/repository';
import { totalDuSejour } from '@/features/gite/services/tarifSejour';
import type { Sejour } from '@/features/gite/types';
import { ROUTES } from '@/shared/constants/routes';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { colors } from '@/shared/theme/colors';
import { formatDateShortFR, formatMontant } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.gite;

/** L'année d'un jour AAAA-MM-JJ. */
const anneeDe = (jour: string) => Number(jour.slice(0, 4));

/** Une date saisie en entier (07/10/2026 ou 7/10/26) en AAAA-MM-JJ ; rien si ce n'en est pas une. */
function dateSaisie(texte: string): string | undefined {
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(texte.trim());
  if (!m) return undefined;
  const annee = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${annee}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

/** Vrai quand la réservation répond à la recherche : le nom du client, ou une date (écrite en partie, ou une nuit du séjour). */
function correspond(s: Sejour, requete: string): boolean {
  const jour = dateSaisie(requete);
  if (jour && s.arrivee <= jour && jour <= s.depart) return true;
  const texte = normaliser(
    `${s.nom} ${formatDateShortFR(s.arrivee)} ${formatDateShortFR(s.depart)} ${s.arrivee} ${s.depart}`,
  );
  return normaliser(requete)
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => texte.includes(t));
}

/**
 * L'historique des réservations du gîte : celles de l'année active (la puce d'année), les plus récentes d'abord, abandonnées
 * comprises. Chacune ouvre son séjour. Ouvert depuis le restaurant (`sejour`), l'écran se place sur cette réservation, qu'il
 * met en évidence — l'année active suit alors celle de son arrivée.
 */
export default function HistoriqueReservations() {
  const router = useRouter();
  const { sejour: sejourDemande } = useLocalSearchParams<{ sejour?: string }>();
  const { settings, setAnneeActive, choisirToutesAnnees } = useAppSettings();
  /** « Tout » est choisi : les réservations de toutes les années. */
  const regrouper = !!settings.toutesAnnees;
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const defilement = useRef<ScrollView>(null);
  const [requete, setRequete] = useState('');
  /** Vrai une fois l'année de la réservation demandée adoptée (on ne la réimpose pas quand l'utilisateur change d'année). */
  const [anneeAdoptee, setAnneeAdoptee] = useState(false);
  /** Vrai une fois l'écran placé sur la réservation demandée. */
  const [place, setPlace] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([listTousLesSejours(), toutesLesAnneesConnues()]).then(([tous, connues]) => {
        setSejours(tous);
        setAnnees([...new Set([...connues, ...tous.map((s) => anneeDe(s.arrivee))])]);
      });
    }, []),
  );

  // Venu pour une réservation : l'année active devient celle de son arrivée.
  useEffect(() => {
    if (anneeAdoptee || !sejourDemande || sejours.length === 0) return;
    const cible = sejours.find((s) => s.id === sejourDemande);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnneeAdoptee(true);
    // Avec « Tout », toutes les années sont déjà là : on ne change pas d'année.
    if (cible && !regrouper && anneeDe(cible.arrivee) !== settings.anneeActive) {
      setAnneeActive(anneeDe(cible.arrivee));
    }
  }, [anneeAdoptee, sejourDemande, sejours, settings.anneeActive, regrouper, setAnneeActive]);

  // Sans recherche, les réservations de l'année active ; avec une recherche, celles de toutes les années qui y répondent.
  const recherche = requete.trim().length > 0;
  const reservations = sejours
    .filter((s) =>
      recherche ? correspond(s, requete) : regrouper || anneeDe(s.arrivee) === settings.anneeActive,
    )
    .sort((a, b) => b.arrivee.localeCompare(a.arrivee));

  return (
    <Screen scroll={false}>
      <View style={commonStyles.topBox}>
        <LigneFiltres>
          <YearPicker
            annees={annees}
            value={settings.anneeActive}
            onChange={setAnneeActive}
            tout={regrouper}
            onChoisirTout={choisirToutesAnnees}
          />
        </LigneFiltres>
        <FormField
          label={TEXTES.commun.general.rechercher}
          value={requete}
          onChangeText={setRequete}
          placeholder={T.historique.rechercher}
        />
      </View>
      <ScrollView ref={defilement} contentContainerStyle={commonStyles.listBottom}>
        {reservations.length === 0 ? (
          <EmptyState
            title={recherche ? T.historique.aucuneRecherche : T.historique.aucune(settings.anneeActive)}
          />
        ) : (
          reservations.map((s) => (
            <View
              key={s.id}
              onLayout={(e) => {
                // La réservation demandée se place en haut de l'écran, une seule fois.
                if (s.id !== sejourDemande || place || !anneeAdoptee) return;
                defilement.current?.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - 8), animated: false });
                setPlace(true);
              }}
            >
              <ListRow
                grise={s.abandonne}
                surlignee={s.id === sejourDemande}
                title={`${s.nom} — ${T.jour.dates(formatDateShortFR(s.arrivee), formatDateShortFR(s.depart))}`}
                subtitle={
                  s.abandonne
                    ? s.restaurantMaintenu
                      ? T.reservationsClient.abandonneeRestaurantMaintenu
                      : T.reservationsClient.abandonnee
                    : `${T.sejour.chambresListe(s.chambres)} · ${s.paye ? T.jour.paye : T.jour.aRegler}`
                }
                trailing={
                  <View style={commonStyles.headerDroite}>
                    {s.paye ? null : <Ionicons name="alert-circle" size={20} color={colors.danger} />}
                    <Text style={[commonStyles.lineBold, s.abandonne && commonStyles.muted]}>
                      {formatMontant(totalDuSejour(s))}
                    </Text>
                  </View>
                }
                onPress={() => router.push(ROUTES.sejour(s.id))}
              />
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
