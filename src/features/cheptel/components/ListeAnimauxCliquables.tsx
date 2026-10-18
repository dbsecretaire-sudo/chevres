import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { libelleChevreAvecDate } from '@/features/cheptel/utils/chevreLabel';
import type { Chevre } from '@/features/cheptel/types';
import { LIBELLES_STATUT_CHEVRE } from '@/shared/textes/libelles';
import { SEXE } from '@/shared/constants/cheptel';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { formatDateFR } from '@/shared/utils/dates';

/** Des animaux du cheptel, un par ligne (sa boucle, son statut et sa date de sortie) : un appui ouvre sa fiche. Même sortis (abattoir, vendu). */
export function ListeAnimauxCliquables({ animaux, vide }: { animaux: Chevre[]; vide?: string }) {
  const router = useRouter();
  if (animaux.length === 0) return vide ? <Text style={commonStyles.mutedItalic}>{vide}</Text> : null;
  return (
    <BlocLignes>
      {animaux.map((a) => (
        <ListRow
          key={a.id}
          title={libelleChevreAvecDate(a)}
          subtitle={[LIBELLES_STATUT_CHEVRE[a.statut]?.[a.sexe === SEXE.FEMELLE ? 0 : 1] ?? a.statut, a.dateStatut ? formatDateFR(a.dateStatut) : ''].filter(Boolean).join(' · ')}
          onPress={() => router.push(ROUTES.ficheChevre(a.id) as never)}
        />
      ))}
    </BlocLignes>
  );
}
