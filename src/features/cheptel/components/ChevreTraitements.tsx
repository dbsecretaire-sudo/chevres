import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Card } from '@/shared/components/Card';
import { ListRow } from '@/shared/components/ListRow';
import { Button } from '@/shared/components/Button';
import { listTraitementsPourChevre } from '@/features/sante/repository/traitements';
import { delaisDeLAnimal, finDuDelai } from '@/features/sante/services/delaisAttente';
import type { Traitement } from '@/features/sante/types';
import type { Chevre } from '@/features/cheptel/types';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, todayISO } from '@/shared/utils/dates';

const T = TEXTES.cheptel.traitements;

/**
 * Sur la fiche d'un animal : ses délais d'attente d'aujourd'hui (lait, viande) en rouge, et ses derniers traitements — ceux qui nomment sa
 * boucle et ceux de tout le troupeau.
 */
export function ChevreTraitements({ chevre }: { chevre: Chevre }) {
  const router = useRouter();
  const [traitements, setTraitements] = useState<Traitement[]>([]);
  useFocusEffect(
    useCallback(() => {
      listTraitementsPourChevre(chevre)
        .then(setTraitements)
        .catch(() => undefined);
    }, [chevre]),
  );
  const delais = delaisDeLAnimal(chevre.numeroBoucle, traitements, todayISO());

  return (
    <Card style={commonStyles.gap8}>
      <Text style={commonStyles.cardTitle}>{T.fiche.titre}</Text>
      {delais.lait ? (
        <Text style={[commonStyles.lineBold, { color: colors.danger }]}>{T.fiche.laitJusquau(formatDateFR(delais.lait.fin))}</Text>
      ) : null}
      {delais.viande ? (
        <Text style={[commonStyles.lineBold, { color: colors.danger }]}>{T.fiche.viandeJusquau(formatDateFR(delais.viande.fin))}</Text>
      ) : null}
      {traitements.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.fiche.aucun}</Text> : null}
      {traitements.slice(0, 3).map((t) => (
        <ListRow
          key={t.id}
          title={t.produit}
          subtitle={[
            formatDateFR(t.date),
            finDuDelai(t, 'lait') ? T.delaiLait(t.delaiLaitJours ?? 0, formatDateFR(finDuDelai(t, 'lait')!)) : undefined,
            finDuDelai(t, 'viande') ? T.delaiViande(t.delaiViandeJours ?? 0, formatDateFR(finDuDelai(t, 'viande')!)) : undefined,
          ]
            .filter(Boolean)
            .join(' · ')}
          onPress={() => router.push(ROUTES.traitement(t.id) as never)}
        />
      ))}
      <Button variant="secondary" label={T.fiche.voirTout} onPress={() => router.push(ROUTES.CHEPTEL_TRAITEMENTS as never)} />
    </Card>
  );
}
