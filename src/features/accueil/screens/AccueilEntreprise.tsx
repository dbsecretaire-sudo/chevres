import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { YearPicker } from '@/shared/components/YearPicker';
import { CalendrierMois, type MarqueJour } from '@/shared/components/CalendrierMois';
import { TuileChiffre } from '@/features/accueil/components/TuileChiffre';
import { useAccueilEntreprise } from '@/features/accueil/hooks/useAccueilEntreprise';
import { chambresOccupeesParNuit } from '@/features/gite/services/occupation';
import { NOMBRE_CHAMBRES_GITE } from '@/shared/constants/gite';
import { STATUT_ELEMENT } from '@/shared/constants/dossiers';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { activitesEtablissement } from '@/shared/dictionnaire/entreprise';
import { colors } from '@/shared/theme/colors';
import { moisDe, type MoisCalendrier } from '@/shared/utils/calendrier';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/**
 * Accueil d'une entreprise : l'année active, deux chiffres (le solde des factures et le nombre de réservations ou de
 * tâches de l'année), puis un grand calendrier — les réservations du gîte pour une association, les tâches à réaliser
 * sinon. Un jour ouvre son détail dans l'onglet Activité ; le solde ouvre la balance mois par mois. Les informations de l'entreprise sont dans les Réglages.
 */
export default function AccueilEntreprise() {
  const router = useRouter();
  const accueil = useAccueilEntreprise();
  const [mois, setMois] = useState<MoisCalendrier>(() => moisDe(todayISO()));
  const T = TEXTES.entreprise.accueil;
  const association = activitesEtablissement().includes(ACTIVITE_SOCIETE.ASSOCIATION);
  const aujourdhui = todayISO();
  const annee = String(accueil.annee);

  // Association : les chambres occupées chaque nuit. Sinon : les tâches (contenus à échéance, pas terminés) par jour.
  const occupation = chambresOccupeesParNuit(accueil.sejours);
  const tachesParJour = new Map<string, number>();
  for (const element of accueil.elements) {
    if (element.echeance && element.statut !== STATUT_ELEMENT.TERMINE) {
      tachesParJour.set(element.echeance, (tachesParJour.get(element.echeance) ?? 0) + 1);
    }
  }

  const marque = (jour: string): MarqueJour => {
    if (association) {
      const occupees = occupation.get(jour) ?? 0;
      if (occupees === 0) return {};
      return {
        texte: `${occupees}/${NOMBRE_CHAMBRES_GITE}`,
        niveau: occupees >= NOMBRE_CHAMBRES_GITE ? 'plein' : 'partiel',
      };
    }
    const taches = tachesParJour.get(jour) ?? 0;
    if (taches === 0) return {};
    return { texte: String(taches), niveau: jour < aujourdhui ? 'alerte' : 'partiel' };
  };

  // Le second chiffre : les réservations qui commencent cette année, ou les tâches à échéance cette année.
  const reservations = accueil.sejours.filter((s) => s.arrivee.startsWith(annee)).length;
  const tachesDeLAnnee = [...tachesParJour.entries()]
    .filter(([jour]) => jour.startsWith(annee))
    .reduce((total, [, nombre]) => total + nombre, 0);

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
          valeur={String(association ? reservations : tachesDeLAnnee)}
          label={association ? T.tuiles.reservations(annee) : T.tuiles.taches(annee)}
          onPress={() => router.push(association ? ROUTES.GITE : ROUTES.CLIENTS_EXPLORATEUR)}
        />
      </View>

      <CalendrierMois
        mois={mois}
        onChangerMois={changerMois}
        marque={marque}
        onJour={(jour) => router.push(association ? ROUTES.giteJour(jour) : ROUTES.jourEcheances(jour))}
        legende={association ? T.calendrier.legendeGite : T.calendrier.legendeTaches}
      />
    </Screen>
  );
}
