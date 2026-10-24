import { BlocLignes } from '@/shared/components/BlocListe';
import { GroupeAccueil } from '@/shared/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { bouclesDuLot } from '@/features/exploitation/services/lots';
import type { LotAnimaux } from '@/features/settings/settings';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.exploitation.bonsDeLivraison;

/**
 * Les bons de livraison de l'abattoir, du plus récent au plus ancien : un par livraison d'animaux (le jour, les animaux, le document de circulation à générer puis à téléverser),
 * qui se lie ensuite à une facture de l'abattoir, choisie dans une liste. Un appui ouvre le bon ; « Ajouter un bon de livraison » en crée un.
 */
export function BonsDeLivraison({ lots, ouvrir }: { lots: readonly LotAnimaux[]; ouvrir: (route: string) => void }) {
  const bons = lots.filter((l) => !!l.abattoir).sort((a, b) => (b.abattoir ?? '').localeCompare(a.abattoir ?? ''));
  return (
    <GroupeAccueil titre={T.titre}>
      <BlocLignes>
        {bons.length === 0 ? <ListRow grise title={T.aucun} /> : null}
        {bons.map((lot) => (
          <ListRow
            key={lot.id}
            title={T.bonDu(formatDateFR(lot.abattoir as string))}
            subtitle={[
              T.animaux(bouclesDuLot(lot).length),
              lot.documentCirculation ? T.documentDepose : T.documentManque,
              lot.factureId ? T.factureLiee : T.aFacturer,
            ].join(' · ')}
            icone="document-text"
            onPress={() => ouvrir(ROUTES.lotDeProduction(lot.id))}
          />
        ))}
        <ListRow title={T.ajouter} icone="add-circle" onPress={() => ouvrir(ROUTES.lotAbattoirNouveau())} />
      </BlocLignes>
    </GroupeAccueil>
  );
}
