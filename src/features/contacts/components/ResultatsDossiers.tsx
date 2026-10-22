import { Text } from 'react-native';
import {
  cheminDuDossier,
  rechercherDansLesContenus,
} from '@/features/exploitation/services/dossiersDeContenus';
import type { Controle } from '@/features/exploitation/types';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const D = TEXTES.production.lieux.groupement.dossiers;

/**
 * Ce que la recherche trouve dans les dossiers d'un contact : les dossiers puis les contenus, chacun avec le dossier où il est rangé. Un appui ouvre le
 * dossier, ou le contenu.
 */
export function ResultatsDossiers({
  entree,
  requete,
  dansDossier,
  contactCle,
  ouvrir,
}: {
  entree: Controle | undefined;
  requete: string;
  /** Le dossier ouvert : la recherche s'y limite (absent : tous les dossiers du contact). */
  dansDossier?: string;
  contactCle: string;
  ouvrir: (route: string) => void;
}) {
  const { dossiers, contenus } = rechercherDansLesContenus(entree, requete, dansDossier);
  if (dossiers.length === 0 && contenus.length === 0)
    return <Text style={commonStyles.mutedItalic}>{D.aucunResultat}</Text>;
  /** Le dossier où se trouve un résultat (rien à la racine). */
  const lieu = (dossierId: string | undefined): string | undefined => {
    const chemin = cheminDuDossier(entree?.dossiers, dossierId)
      .map((d) => d.nom)
      .join(' > ');
    return chemin ? D.dans(chemin) : undefined;
  };
  return (
    <BlocLignes>
      {dossiers.map((d) => (
        <ListRow
          key={d.id}
          title={d.nom}
          subtitle={lieu(d.parentId)}
          icone="folder"
          onPress={() => ouvrir(ROUTES.contactDossier(contactCle, d.id))}
        />
      ))}
      {contenus.map((c) => (
        <ListRow
          key={c.id}
          title={c.titre}
          subtitle={[formatDateFR(c.date), lieu(c.dossierId)].filter(Boolean).join(' · ')}
          icone="document-text"
          onPress={() => entree && ouvrir(ROUTES.contactContenu(entree.id, c.id))}
        />
      ))}
    </BlocLignes>
  );
}
