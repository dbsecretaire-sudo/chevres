import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { LigneRubrique } from '@/features/settings/components/LigneRubrique';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { activitesEtablissement, modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.reglages;

/** Organisation › Mon établissement : ses informations et, pour un secrétariat, la structure de ses dossiers. */
export default function RubriqueEtablissement() {
  // La structure type des dossiers ne sert qu'au secrétariat (dossiers clients).
  const avecDossiersClients = activitesEtablissement().includes(ACTIVITE_SOCIETE.PRESTATIONS_SERVICE);
  return (
    <Screen>
      <BlocLignes>
        <LigneRubrique
          titre={
            modeEntreprise()
              ? TEXTES.commun.general.informationsDeLEntreprise
              : TEXTES.commun.general.informationsDeLExploitation
          }
          aide={T.aideInformations}
          icone="business"
          route={ROUTES.INFORMATIONS_EXPLOITATION}
        />
        {avecDossiersClients ? (
          <LigneRubrique
            titre={TEXTES.dossiers.structure.titre}
            aide={T.aideStructure}
            icone="folder-open"
            route={ROUTES.STRUCTURE_DOSSIERS}
          />
        ) : null}
      </BlocLignes>
    </Screen>
  );
}
