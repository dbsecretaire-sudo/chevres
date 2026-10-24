import { BlocLignes } from '@/shared/components/BlocListe';
import { GroupeAccueil } from '@/shared/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { TableauEnlevements } from '@/features/exploitation/components/TableauxDesDeparts';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { numerosDeBoucles } from '@/features/cheptel/utils/numerosBoucles';
import { enlevementsRecentsDabord, titreDeLEnlevement } from '@/features/exploitation/services/enlevements';
import type { EnlevementEquarrissage } from '@/features/settings/settings';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.exploitation.enlevements;

/**
 * Les bons d'enlèvement de l'équarrisseur, du plus récent au plus ancien : un par passage (le jour, le n° du bon, les animaux enlevés, le bon lui-même en pièce jointe). Un appui
 * ouvre le bon ; « Ajouter un bon d'enlèvement » en crée un.
 */
export function BonsDEnlevement({ enlevements, ouvrir }: { enlevements: readonly EnlevementEquarrissage[]; ouvrir: (route: string) => void }) {
  // Le poste de comptabilité (Windows, affichage sobre) montre les bons en tableau.
  const comptable = useDispositionComptable();
  if (comptable) {
    return (
      <GroupeAccueil titre={T.groupe}>
        <TableauEnlevements enlevements={enlevements} onOuvrir={(e) => ouvrir(ROUTES.enlevement(e.id))} vide={T.aucun} />
        <BlocLignes>
          <ListRow title={T.ajouter} icone="add-circle" onPress={() => ouvrir(ROUTES.enlevement())} />
        </BlocLignes>
      </GroupeAccueil>
    );
  }
  return (
    <GroupeAccueil titre={T.groupe}>
      <BlocLignes>
        {enlevementsRecentsDabord(enlevements).map((e) => (
          <ListRow
            key={e.id}
            title={titreDeLEnlevement(e)}
            subtitle={[T.animaux(numerosDeBoucles(e.boucles).length), (e.fichiers ?? []).length === 0 ? T.bonManque : T.bonJoint].join(' · ')}
            icone="document-text"
            onPress={() => ouvrir(ROUTES.enlevement(e.id))}
          />
        ))}
        <ListRow title={T.ajouter} icone="add-circle" onPress={() => ouvrir(ROUTES.enlevement())} />
      </BlocLignes>
    </GroupeAccueil>
  );
}
