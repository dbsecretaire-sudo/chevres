import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { LigneRubrique } from '@/features/settings/components/LigneRubrique';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.reglages;

/** Organisation › Clients et fournisseurs : les deux carnets d'adresses de l'établissement. */
export default function RubriqueTiers() {
  return (
    <Screen>
      <BlocLignes>
        <LigneRubrique
          titre={TEXTES.commun.general.clients}
          aide={T.aideClients}
          icone="person"
          route={ROUTES.CLIENTS}
          retour={ROUTES.ORGANISATION_TIERS}
        />
        <LigneRubrique
          titre={TEXTES.commun.general.fournisseurs}
          aide={T.aideFournisseurs}
          icone="people"
          route={ROUTES.FOURNISSEURS}
          retour={ROUTES.ORGANISATION_TIERS}
        />
      </BlocLignes>
    </Screen>
  );
}
