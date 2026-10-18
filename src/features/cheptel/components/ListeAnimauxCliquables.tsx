import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { libelleChevreAvecDate } from '@/features/cheptel/utils/chevreLabel';
import type { Chevre } from '@/features/cheptel/types';
import { LIBELLES_STATUT_CHEVRE } from '@/shared/textes/libelles';
import { SEXE } from '@/shared/constants/cheptel';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import type { InconsommableDuLot } from '@/features/settings/settings';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

/** Des animaux du cheptel, un par ligne (sa boucle, son statut et sa date de sortie) : un appui ouvre sa fiche. Même sortis (abattoir, vendu). */
export function ListeAnimauxCliquables({
  animaux,
  vide,
  inconsommables = [],
}: {
  animaux: Chevre[];
  vide?: string;
  /** Les bêtes déclarées inconsommables (saisie sanitaire, morte pendant le transport) : leur motif est écrit en rouge, à droite de leur ligne. */
  inconsommables?: InconsommableDuLot[];
}) {
  const motifs = new Map(inconsommables.map((i) => [i.id, i.motif]));
  const router = useRouter();
  if (animaux.length === 0) return vide ? <Text style={commonStyles.mutedItalic}>{vide}</Text> : null;
  return (
    <BlocLignes>
      {animaux.map((a) => (
        <ListRow
          key={a.id}
          title={libelleChevreAvecDate(a)}
          subtitle={[LIBELLES_STATUT_CHEVRE[a.statut]?.[a.sexe === SEXE.FEMELLE ? 0 : 1] ?? a.statut, a.dateStatut ? formatDateFR(a.dateStatut) : ''].filter(Boolean).join(' · ')}
          trailing={
            motifs.has(a.id) ? (
              <Text style={[commonStyles.lineBold, { color: colors.danger }]}>
                {motifs.get(a.id) === 'transport'
                  ? TEXTES.cheptel.lots.inconsommables.motifsListe.transport(a.sexe === SEXE.FEMELLE)
                  : TEXTES.cheptel.lots.inconsommables.motifs.sanitaire}
              </Text>
            ) : undefined
          }
          onPress={() => router.push(ROUTES.ficheChevre(a.id) as never)}
        />
      ))}
    </BlocLignes>
  );
}
