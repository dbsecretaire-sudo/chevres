import { useState } from 'react';
import { useRouter } from 'expo-router';
import { CalendrierMois, type MarqueJour } from '@/shared/components/CalendrierMois';
import type { Sejour } from '@/features/gite/types';
import { repasParJour } from '@/features/gite/services/repas';
import { ROUTES } from '@/shared/constants/routes';
import { moisDe, type MoisCalendrier } from '@/shared/utils/calendrier';
import { todayISO } from '@/shared/utils/dates';

/**
 * La restauration du gîte : un calendrier du nombre de repas à préparer chaque jour (menu unique). Un jour avec des
 * repas ouvre la page de ses réservations ; un jour sans repas ne fait rien.
 */
export function RestaurationGite({ sejours }: { sejours: Sejour[] }) {
  const router = useRouter();
  const [mois, setMois] = useState<MoisCalendrier>(() => moisDe(todayISO()));
  const totaux = repasParJour(sejours);

  const marque = (jour: string): MarqueJour => {
    const repas = totaux.get(jour);
    return repas ? { texte: String(repas), niveau: 'partiel' } : {};
  };

  return (
    <CalendrierMois
      mois={mois}
      onChangerMois={setMois}
      marque={marque}
      onJour={(jour) => {
        if (totaux.has(jour)) router.push(ROUTES.repasDuJour(jour));
      }}
    />
  );
}
