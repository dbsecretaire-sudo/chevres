import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { useLots } from '@/features/exploitation/hooks/useLots';
import { useTiptags } from '@/features/stock/hooks/useTiptags';
import { bouclesDuLot } from '@/features/exploitation/services/lots';
import {
  lotsAnnuels,
  lotsAnnuelsDeLAnimal,
  peutRejoindreLeLot,
  type CategorieAnnuelle,
} from '@/features/exploitation/services/lotsAnnuels';
import { especeDe } from '@/features/cheptel/utils/espece';
import type { Chevre } from '@/features/cheptel/types';
import { vocabulaire } from '@/shared/dictionnaire/animaux';
import { CATEGORIE_LOT } from '@/shared/constants/lots';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { currentYear, todayISO } from '@/shared/utils/dates';

const T = TEXTES.cheptel.lots.suiviAnnuel;

/** La couleur du label de chaque lot d'une année. */
const COULEURS: Record<CategorieAnnuelle, string> = {
  [CATEGORIE_LOT.RENOUVELLEMENT]: colors.primary,
  [CATEGORIE_LOT.REPRODUCTION]: colors.ajout,
  [CATEGORIE_LOT.AVORTEMENT]: colors.danger,
};

interface Props {
  chevre: Chevre;
}

/**
 * Le suivi de l'année d'un animal : en label, les lots d'une année où il figure (renouvellement, mises à la reproduction, avortements —
 * un appui ouvre le lot) ; en boutons, ce qu'on peut lui ajouter pour l'année courante : « Ajouter au renouvellement » (tout animal),
 * « Mettre à la reproduction » et « Cette chèvre a avorté » (une femelle de plus de 6 mois). L'année se change ensuite dans le lot.
 */
export function ChevreSuiviAnnuel({ chevre }: Props) {
  const router = useRouter();
  const { lots, ajouterAuLotAnnuel } = useLots();
  const tiptags = useTiptags();
  const boucle = chevre.numeroBoucle?.trim();
  const dedans = lotsAnnuelsDeLAnimal(lots, boucle);
  const annee = currentYear();
  const aujourdhui = todayISO();
  const femelle = vocabulaire(especeDe(chevre)).femelle.singulier;

  /** Les boutons : une catégorie qu'on peut ajouter à cet animal et dont le lot de l'année courante ne l'a pas déjà. */
  const boutons: { categorie: CategorieAnnuelle; label: string }[] = [
    { categorie: CATEGORIE_LOT.RENOUVELLEMENT, label: T.renouvellement },
    { categorie: CATEGORIE_LOT.REPRODUCTION, label: T.reproduction },
    { categorie: CATEGORIE_LOT.AVORTEMENT, label: T.avorte(femelle) },
  ].filter(
    (b) =>
      peutRejoindreLeLot(b.categorie, chevre, aujourdhui, tiptags) &&
      !lotsAnnuels(lots, b.categorie, annee).some((l) => bouclesDuLot(l).includes(boucle ?? '')),
  );

  if (dedans.length === 0 && boutons.length === 0) return null;
  return (
    <Card style={commonStyles.gap8}>
      <Text style={commonStyles.cardTitle}>{T.titre}</Text>
      {dedans.length > 0 ? (
        <View style={commonStyles.rowWrap}>
          {dedans.map((lot) => (
            <Pressable key={lot.id} onPress={() => router.push(`${ROUTES.lot(lot.id)}&retour=${encodeURIComponent(ROUTES.ficheChevre(chevre.id))}` as never)} hitSlop={6} accessibilityLabel={lot.nom}>
              <Badge label={lot.nom} color={COULEURS[lot.categorie as CategorieAnnuelle] ?? colors.primary} />
            </Pressable>
          ))}
        </View>
      ) : null}
      {boutons.map((b) => (
        <Button key={b.categorie} variant="secondary" label={b.label} onPress={() => boucle && ajouterAuLotAnnuel(b.categorie, boucle)} />
      ))}
      {boutons.length > 0 ? <Text style={commonStyles.note}>{T.aide(annee)}</Text> : null}
    </Card>
  );
}
