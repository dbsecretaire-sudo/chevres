import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { LigneRubrique } from '@/features/settings/components/LigneRubrique';
import { laiterieActive } from '@/features/comptabilite/utils/recettes';
import { especesActives } from '@/shared/dictionnaire/animaux';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.reglages;

/** Organisation › Inventaire : le conditionnement des fromages (la structure des listes s'ouvre depuis l'en-tête de l'inventaire). */
export default function RubriqueInventaire() {
  // Le conditionnement des fromages : pour les espèces qui font du lait (chèvres, brebis, vaches).
  const fromagerie = especesActives().some((espece) => laiterieActive(espece));
  return (
    <Screen>
      <BlocLignes>
        {fromagerie ? (
          <LigneRubrique
            titre={TEXTES.stock.conditionnement.titre}
            aide={T.aideConditionnement}
            icone="layers"
            route={ROUTES.ORGANISATION_CONDITIONNEMENT}
          />
        ) : null}
      </BlocLignes>
    </Screen>
  );
}
