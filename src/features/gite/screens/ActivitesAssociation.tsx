import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/ScreenList';
import { BlocLignes } from '@/shared/components/BlocListe';
import { EmptyState } from '@/shared/components/EmptyState';
import { Fab } from '@/shared/components/Fab';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { ListRow } from '@/shared/components/ListRow';
import { ActiviteAnnexeModal } from '@/features/annexes/components/ActiviteAnnexeModal';
import { enregistrerActivite, lireArchiveAnnexes } from '@/features/annexes/repository';
import type { ArchiveAnnexes } from '@/features/annexes/types';
import { libelleTauxTva } from '@/features/comptabilite/utils/tva';
import { getSettings } from '@/features/settings/settings';
import { CATEGORIE_RECETTE, TAUX_TVA_RECETTE_ENTREPRISE } from '@/shared/constants/comptabilite';
import { COMPTE_PAR_RECETTE } from '@/shared/constants/planComptable';
import { listSejours } from '@/features/gite/repository';
import type { Sejour } from '@/features/gite/types';
import { normaliser } from '@/features/dossiers/services/recherche';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { activitesEtablissement } from '@/shared/dictionnaire/entreprise';
import { formatDateShortFR, formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/gite/Gite.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface TuileProps {
  icone: keyof typeof Ionicons.glyphMap;
  titre: string;
  details: readonly string[];
  /** Sans destination, la tuile est annoncée comme « bientôt disponible ». */
  onPress?: () => void;
  /** De petites lignes en haut à droite (le compte du plan comptable, la TVA). */
  reperes?: readonly string[];
}

/** Une activité de l'association : son nom, ce qu'elle comprend, et l'écran qu'elle ouvre. */
function Tuile({ icone, titre, details, onPress, reperes = [] }: TuileProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tuile,
        !onPress && styles.tuileInactive,
        details.length === 0 && styles.tuileCompacte,
        pressed && commonStyles.pressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.enteteTuile}>
        <Ionicons name={icone} size={34} color={colors.primary} />
        <View style={styles.reperesTuile}>
          {reperes.map((repere) => (
            <Text key={repere} style={styles.repereTuile}>
              {repere}
            </Text>
          ))}
        </View>
      </View>
      <Text style={styles.tuileTitre}>{titre}</Text>
      {details.map((detail) => (
        <Text key={detail} style={styles.tuileDetail}>
          {detail}
        </Text>
      ))}
      {!onPress ? <Text style={styles.tuileBientot}>{TEXTES.gite.activites.bientot}</Text> : null}
    </Pressable>
  );
}

/**
 * Écran Activité d'une association : une recherche dans les séjours et une tuile par activité (le gîte, avec la
 * restauration et le ménage ; le bar ; les activités annexes). Les clients restent dans le menu burger.
 */
export default function ActivitesAssociation() {
  const router = useRouter();
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [requete, setRequete] = useState('');
  const [annexes, setAnnexes] = useState<ArchiveAnnexes>({
    activites: [],
    categories: [],
    articles: [],
    tickets: [],
  });
  /** La fenêtre d'une nouvelle activité (le bouton +). */
  const [ajoutActivite, setAjoutActivite] = useState(false);
  /** Le compte et la TVA de l'hébergement du gîte (ceux d'office tant qu'on ne les a pas modifiés). */
  const [reglagesGite, setReglagesGite] = useState<{ compte: string; tva: number }>({
    compte: COMPTE_PAR_RECETTE[CATEGORIE_RECETTE.HEBERGEMENT].numero,
    tva: TAUX_TVA_RECETTE_ENTREPRISE[CATEGORIE_RECETTE.HEBERGEMENT],
  });
  const T = TEXTES.gite.activites;
  const aussiFinance = activitesEtablissement().includes(ACTIVITE_SOCIETE.LIBERAL);
  const aussiPrestations = activitesEtablissement().includes(ACTIVITE_SOCIETE.PRESTATIONS_SERVICE);

  useFocusEffect(
    useCallback(() => {
      listSejours().then(setSejours);
      lireArchiveAnnexes().then(setAnnexes);
      getSettings().then((settings) => {
        const infos = settings.exploitation?.entreprise;
        setReglagesGite({
          compte: infos?.giteCompte ?? COMPTE_PAR_RECETTE[CATEGORIE_RECETTE.HEBERGEMENT].numero,
          tva: infos?.giteTauxTva ?? TAUX_TVA_RECETTE_ENTREPRISE[CATEGORIE_RECETTE.HEBERGEMENT],
        });
      });
    }, []),
  );

  const termes = normaliser(requete).split(/\s+/).filter(Boolean);
  const activitesTrouvees = annexes.activites.filter((a) => {
    const texte = normaliser(`${a.nom} ${a.compte}`);
    return termes.every((t) => texte.includes(t));
  });
  const trouves = sejours
    .filter((s) => {
      const texte = normaliser(
        `${s.nom} ${s.notes ?? ''} ${TEXTES.gite.jour.chambres(s.chambres)} ${formatDateShortFR(s.arrivee)}`,
      );
      return termes.every((t) => texte.includes(t));
    })
    .sort((a, b) => b.arrivee.localeCompare(a.arrivee));

  /** La tuile d'une activité annexe : son icône, son compte et sa TVA, son nom, et ce qu'elle contient. */
  const tuileActivite = (id: string) => {
    const a = annexes.activites.find((x) => x.id === id);
    if (!a) return null;
    return (
      <Pressable
        key={a.id}
        style={({ pressed }) => [styles.tuile, pressed && commonStyles.pressed]}
        onPress={() => router.push(ROUTES.annexe(a.id))}
      >
        <View style={styles.enteteTuile}>
          <Ionicons name={a.icone as keyof typeof Ionicons.glyphMap} size={34} color={colors.primary} />
          <View style={styles.reperesTuile}>
            <Text style={styles.repereTuile}>{TEXTES.annexes.carte.pcg(a.compte)}</Text>
            {a.tauxTva !== undefined ? (
              <Text style={styles.repereTuile}>{TEXTES.annexes.carte.tva(libelleTauxTva(a.tauxTva))}</Text>
            ) : null}
          </View>
        </View>
        <Text style={styles.tuileTitre}>{a.nom}</Text>
        <Text style={styles.tuileDetail}>
          {TEXTES.annexes.activite.resume(
            annexes.articles.filter((x) => x.activiteId === a.id).length,
            annexes.categories.filter((x) => x.activiteId === a.id).length,
          )}
        </Text>
      </Pressable>
    );
  };

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        <ChampRecherche value={requete} onChangeText={setRequete} placeholder={T.rechercher} />

        {termes.length === 0 ? (
          <BlocLignes>
            <Tuile
              icone="bed"
              titre={T.gite}
              details={[]}
              reperes={[
                TEXTES.annexes.carte.pcg(reglagesGite.compte),
                TEXTES.annexes.carte.tva(libelleTauxTva(reglagesGite.tva)),
              ]}
              onPress={() => router.push(ROUTES.GITE)}
            />
            {annexes.activites.map((a) => tuileActivite(a.id))}
            {aussiFinance ? (
              <Tuile
                icone="stats-chart"
                titre={TEXTES.trading.journal.titre}
                details={[]}
                onPress={() => router.push(ROUTES.JOURNAL_TRADING)}
              />
            ) : null}
            {aussiPrestations ? (
              <Tuile
                icone="people"
                titre={T.dossiersClients}
                details={[]}
                onPress={() => router.push(ROUTES.CLIENTS_DOSSIERS)}
              />
            ) : null}
          </BlocLignes>
        ) : trouves.length === 0 && activitesTrouvees.length === 0 ? (
          <EmptyState title={T.aucunResultat} subtitle={T.modifiezLaRecherche} />
        ) : (
          <>
            {activitesTrouvees.length > 0 ? (
              <BlocLignes>{activitesTrouvees.map((a) => tuileActivite(a.id))}</BlocLignes>
            ) : null}
            {trouves.map((sejour) => (
              <ListRow
                key={sejour.id}
                title={`${sejour.nom} — ${TEXTES.gite.jour.chambres(sejour.chambres)}`}
                subtitle={`${TEXTES.gite.jour.dates(formatDateShortFR(sejour.arrivee), formatDateShortFR(sejour.depart))} · ${formatMontant(sejour.prix)} · ${sejour.paye ? TEXTES.gite.jour.paye : TEXTES.gite.jour.aRegler}`}
                onPress={() => router.push(ROUTES.sejour(sejour.id))}
              />
            ))}
          </>
        )}
      </ScrollView>

      <Fab
        options={[
          {
            label: TEXTES.annexes.ajouterActivite,
            icon: 'add-circle',
            onPress: () => setAjoutActivite(true),
          },
        ]}
      />

      <ActiviteAnnexeModal
        visible={ajoutActivite}
        onValider={async (donnees) => {
          const id = await enregistrerActivite(donnees);
          setAjoutActivite(false);
          router.push(ROUTES.annexe(id));
        }}
        onFermer={() => setAjoutActivite(false)}
      />
    </Screen>
  );
}
