import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { LigneRubrique } from '@/features/settings/components/LigneRubrique';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.reglages;

/** Organisation › Inventaire : la structure des listes (les catégories et les listes d'articles de l'inventaire). */
export default function RubriqueInventaire() {
  return (
    <Screen>
      <BlocLignes>
        <LigneRubrique
          titre={TEXTES.stock.structure.titre}
          aide={T.aideStructureListes}
          icone="albums"
          route={ROUTES.STOCK_STRUCTURE}
        />
      </BlocLignes>
    </Screen>
  );
}
