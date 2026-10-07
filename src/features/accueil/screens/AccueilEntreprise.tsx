import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import { EmptyState } from '@/shared/components/EmptyState';
import { YearPicker } from '@/shared/components/YearPicker';
import { CalendrierMois, type MarqueJour } from '@/shared/components/CalendrierMois';
import { TuileChiffre } from '@/features/accueil/components/TuileChiffre';
import { useAccueilEntreprise } from '@/features/accueil/hooks/useAccueilEntreprise';
import { LigneElement } from '@/features/dossiers/components/LigneElement';
import { enregistrerElement } from '@/features/dossiers/repository';
import { cheminDuDossier } from '@/features/dossiers/services/arborescence';
import { statutEffectif } from '@/features/dossiers/services/avancement';
import { chambresOccupeesParNuit, nuitsAvecPaiementEnAttente } from '@/features/gite/services/occupation';
import { AccueilTrading } from '@/features/accueil/components/AccueilTrading';
import { calculerStatistiques, tradesDeLAnnee } from '@/features/trading/services/calculs';
import { STATUT_ELEMENT } from '@/shared/constants/dossiers';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { activiteFinanciereSeule, activitesEtablissement } from '@/shared/dictionnaire/entreprise';
import { colors } from '@/shared/theme/colors';
import { moisDe, type MoisCalendrier } from '@/shared/utils/calendrier';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { styles as stylesAccueil } from '@/shared/styles/accueil/Accueil.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/**
 * Accueil d'une entreprise : l'année active, deux chiffres, puis selon l'activité — le calendrier des chambres occupées
 * pour un gîte, le calendrier des résultats de trading pour une activité financière, la liste des tâches à faire (avec
 * un lien vers chacune) pour le secrétariat. Le solde ouvre la balance mois par mois ; les informations de l'entreprise
 * s'ouvrent par un bouton sous les deux chiffres.
 */
export default function AccueilEntreprise() {
  const router = useRouter();
  const accueil = useAccueilEntreprise();
  const [mois, setMois] = useState<MoisCalendrier>(() => moisDe(todayISO()));
  const T = TEXTES.entreprise.accueil;
  const gite = activitesEtablissement().includes(ACTIVITE_SOCIETE.ASSOCIATION);
  const finance = !gite && activiteFinanciereSeule();
  const annee = String(accueil.annee);

  // Les tâches : tous les contenus pas encore terminés (à faire, en cours), avec ou sans échéance — les mêmes que ceux comptés « à
  // faire » dans les dossiers des clients. Les plus pressées d'abord ; celles sans échéance suivent, par titre.
  const taches = accueil.elements
    .filter((e) => statutEffectif(e) !== STATUT_ELEMENT.TERMINE)
    .sort((a, b) =>
      a.echeance && b.echeance
        ? a.echeance.localeCompare(b.echeance)
        : a.echeance
          ? -1
          : b.echeance
            ? 1
            : a.titre.localeCompare(b.titre),
    );
  /** Les tâches de l'année : celles dont l'échéance est cette année, et celles qui n'ont pas d'échéance. */
  const tachesDeLAnnee = taches.filter((e) => !e.echeance || e.echeance.startsWith(annee)).length;

  // Gîte : les chambres occupées chaque nuit.
  const occupation = chambresOccupeesParNuit(accueil.sejours);
  const impayees = nuitsAvecPaiementEnAttente(accueil.sejours);
  const reservations = accueil.sejours.filter((s) => s.arrivee.startsWith(annee)).length;

  // Activité financière : le résultat net des trades de l'année.
  const resultatDeLAnnee = calculerStatistiques(tradesDeLAnnee(accueil.trades, annee)).resultatNet;

  const marque = (jour: string): MarqueJour => {
    if (gite) {
      const occupees = occupation.get(jour) ?? 0;
      if (occupees === 0) return {};
      return {
        texte: `${occupees}/${accueil.nombreChambres}`,
        niveau: occupees >= accueil.nombreChambres ? 'plein' : 'partiel',
        attention: impayees.has(jour),
      };
    }
    return {};
  };

  /** Changer l'année active ramène le calendrier sur le même mois de cette année. */
  const changerAnnee = (nouvelle: number) => {
    accueil.setAnneeActive(nouvelle);
    setMois((actuel) => ({ ...actuel, annee: nouvelle }));
  };

  /** Passer en janvier ou en décembre d'une autre année change aussi l'année active. */
  const changerMois = (nouveau: MoisCalendrier) => {
    setMois(nouveau);
    if (nouveau.annee !== accueil.annee) accueil.setAnneeActive(nouveau.annee);
  };

  const solde = accueil.balance?.balance;
  const secondeTuile = gite
    ? { valeur: String(reservations), label: T.tuiles.reservations(annee), vers: ROUTES.GITE }
    : finance
      ? {
          valeur: formatMontant(resultatDeLAnnee),
          label: T.tuiles.resultatTrading(annee),
          couleur: resultatDeLAnnee < 0 ? colors.danger : undefined,
          vers: ROUTES.CLIENTS_EXPLORATEUR,
        }
      : { valeur: String(tachesDeLAnnee), label: T.tuiles.taches(annee), vers: ROUTES.CLIENTS_EXPLORATEUR };

  return (
    <Screen>
      <YearPicker annees={accueil.annees} value={accueil.annee} onChange={changerAnnee} />

      <View style={commonStyles.row}>
        <TuileChiffre
          valeur={solde === undefined ? '—' : formatMontant(solde)}
          label={T.tuiles.solde}
          couleur={solde !== undefined && solde < 0 ? colors.danger : undefined}
          onPress={() => router.push(ROUTES.BALANCE)}
        />
        <TuileChiffre
          valeur={secondeTuile.valeur}
          label={secondeTuile.label}
          couleur={'couleur' in secondeTuile ? secondeTuile.couleur : undefined}
          onPress={() => router.push(secondeTuile.vers)}
        />
      </View>

      {/* Les informations de l'entreprise : juste sous les deux chiffres, au-dessus du calendrier (elles ne sont plus dans les Réglages). */}
      <Button
        variant="secondary"
        label={TEXTES.commun.general.informationsDeLEntreprise}
        onPress={() => router.push(ROUTES.INFORMATIONS_EXPLOITATION)}
      />

      {gite ? (
        <CalendrierMois
          mois={mois}
          onChangerMois={changerMois}
          marque={marque}
          onJour={(jour) => router.push(ROUTES.giteJour(jour))}
          legende={T.calendrier.legendeGite}
          compact
        />
      ) : finance ? (
        <AccueilTrading trades={accueil.trades} annee={annee} />
      ) : (
        <View style={commonStyles.gap10}>
          <Text style={stylesAccueil.sectionTitle}>{T.taches.titre}</Text>
          {taches.length === 0 ? (
            <EmptyState title={T.taches.aucune} subtitle={T.taches.aucuneDetail} />
          ) : (
            taches.map((tache) => (
              <LigneElement
                key={tache.id}
                element={tache}
                chemin={cheminDuDossier(tache.dossierId, accueil.sousDossiers, accueil.clients)}
                onStatut={async (statut) => {
                  await enregistrerElement({ ...tache, statut });
                  accueil.recharger();
                }}
              />
            ))
          )}
        </View>
      )}
    </Screen>
  );
}
