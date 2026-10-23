import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { LigneRubrique } from '@/features/settings/components/LigneRubrique';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { activitesEtablissement } from '@/shared/dictionnaire/entreprise';
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
        {/* La structure des dossiers créés pour chaque nouveau contact : elle va avec les contacts, et ne sert qu'au secrétariat. */}
        {activitesEtablissement().includes(ACTIVITE_SOCIETE.PRESTATIONS_SERVICE) ? (
          <LigneRubrique
            titre={TEXTES.dossiers.structure.titre}
            aide={T.aideStructure}
            icone="folder-open"
            route={ROUTES.STRUCTURE_DOSSIERS}
            retour={ROUTES.ORGANISATION_TIERS}
          />
        ) : null}
      </BlocLignes>
    </Screen>
  );
}
