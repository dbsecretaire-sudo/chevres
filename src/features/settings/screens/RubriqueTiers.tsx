import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { LigneRubrique } from '@/features/settings/components/LigneRubrique';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.reglages;

/** Organisation › Clients et fournisseurs : les deux carnets d'adresses de l'établissement et les catégories de client. */
export default function RubriqueTiers() {
  return (
    <Screen>
      <BlocLignes>
        <LigneRubrique
          titre={TEXTES.contacts.titre}
          aide={TEXTES.contacts.aideRubrique}
          icone="people-circle"
          route={ROUTES.CONTACTS}
          retour={ROUTES.ORGANISATION_TIERS}
        />
        <LigneRubrique
          titre={T.sectionCategoriesClient}
          aide={T.aideCategoriesClient}
          icone="pricetags"
          route={ROUTES.ORGANISATION_CATEGORIES_CLIENT}
          retour={ROUTES.ORGANISATION_TIERS}
        />
        <LigneRubrique
          titre={T.sectionCategoriesTiers}
          aide={T.aideCategoriesTiers}
          icone="pricetags"
          route={ROUTES.ORGANISATION_CATEGORIES_TIERS}
          retour={ROUTES.ORGANISATION_TIERS}
        />
      </BlocLignes>
    </Screen>
  );
}
