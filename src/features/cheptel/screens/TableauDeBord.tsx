import { Screen } from '@/shared/components/Screen';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { TableauDeBordCheptel } from '@/features/cheptel/components/TableauDeBordCheptel';

/** Le tableau de bord du cheptel : la pyramide des âges et les mouvements de l'année (Cheptel › Statistiques). */
export default function TableauDeBord() {
  return (
    <Screen>
      <SelecteurEspece />
      <TableauDeBordCheptel afficherVide />
    </Screen>
  );
}
