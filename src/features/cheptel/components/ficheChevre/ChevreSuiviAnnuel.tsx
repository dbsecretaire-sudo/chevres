import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { FiltresExclusifs } from '@/shared/components/FiltresExclusifs';
import { useLots } from '@/features/exploitation/hooks/useLots';
import { useTiptags } from '@/features/stock/hooks/useTiptags';
import { bouclesDuLot } from '@/features/exploitation/services/lots';
import {
  anneeDuLot,
  lotsAnnuels,
  lotsAnnuelsDeLAnimal,
  nombreDAvortements,
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
import { styles } from '@/shared/styles/cheptel/SuiviAnnuel.styles';
import { TEXTES } from '@/shared/textes';
import { CATEGORIE_ANIMAL, SEXE } from '@/shared/constants/cheptel';
import { categorieAnimal } from '@/features/cheptel/utils/chevreLabel';
import { currentYear, todayISO, yearOf } from '@/shared/utils/dates';

const T = TEXTES.cheptel.lots.suiviAnnuel;

/** La couleur du label de chaque lot d'une année. */
const COULEURS: Record<CategorieAnnuelle, string> = {
  [CATEGORIE_LOT.RENOUVELLEMENT]: colors.primary,
  [CATEGORIE_LOT.REPRODUCTION]: colors.ajout,
  [CATEGORIE_LOT.AVORTEMENT]: colors.danger,
};

interface Props {
  chevre: Chevre;
  /** Une mère vivante : « Ajouter un cabri » (sa nouvelle naissance), à côté de « Signaler un avortement ». */
  onAjouterUnCabri?: () => void;
}

/**
 * Le suivi de l'année d'un animal : en label, les lots d'une année où il figure (renouvellement, mises à la reproduction, avortements —
 * un appui ouvre le lot) ; en boutons, ce qu'on peut lui ajouter pour l'année courante : « Ajouter au renouvellement » (tout animal),
 * « Mettre à la reproduction » (une femelle de plus de 6 mois) ; « Signaler un avortement » est à droite des labels. Un animal ne figure que dans
 * un seul classement de renouvellement : dès qu'il en a un (quelle que soit l'année), il n'y a plus de bouton « Ajouter au renouvellement ».
 * L'année se change ensuite dans le lot.
 */
export function ChevreSuiviAnnuel({ chevre, onAjouterUnCabri }: Props) {
  const router = useRouter();
  const { lots, ajouterAuLotAnnuel, signalerUnAvortement } = useLots();
  /** Le choix de l'année d'un avortement à signaler : fermé, ou ouvert avec l'année proposée (l'année courante). */
  const [anneeAvortement, setAnneeAvortement] = useState<string | null>(null);
  const tiptags = useTiptags();
  const boucle = chevre.numeroBoucle?.trim();
  const dedans = lotsAnnuelsDeLAnimal(lots, boucle);
  const annee = currentYear();
  const aujourdhui = todayISO();
  const femelle = vocabulaire(especeDe(chevre)).femelle.singulier;

  /** Un animal n'est que dans un classement de renouvellement : déjà dans l'un d'eux, il ne se rajoute pas. */
  const dejaRenouvele = dedans.some((l) => l.categorie === CATEGORIE_LOT.RENOUVELLEMENT);
  /** Les boutons : une catégorie qu'on peut ajouter à cet animal et dont le lot de l'année courante ne l'a pas déjà. */
  const peutAjouter = (categorie: CategorieAnnuelle) =>
    peutRejoindreLeLot(categorie, chevre, aujourdhui, tiptags) &&
    !lotsAnnuels(lots, categorie, annee).some((l) => bouclesDuLot(l).includes(boucle ?? '')) &&
    !(categorie === CATEGORIE_LOT.RENOUVELLEMENT && dejaRenouvele);
  const boutons: { categorie: CategorieAnnuelle; label: string }[] = [
    { categorie: CATEGORIE_LOT.RENOUVELLEMENT, label: T.renouvellement },
    { categorie: CATEGORIE_LOT.REPRODUCTION, label: T.reproduction },
  ].filter((b) => peutAjouter(b.categorie));
  // « Signaler un avortement » (comme « Ajouter un cabri ») n'est proposé qu'à une femelle qui a atteint sa majorité sexuelle (6 mois pour les chèvres) et a
  // une boucle ; elle y est toujours, même déjà dans le lot de l'année : on choisit l'année, et un avortement de plus la même année s'ajoute au compte.
  const avortement = chevre.sexe === SEXE.FEMELLE && categorieAnimal(chevre) === CATEGORIE_ANIMAL.CHEVRE && !!boucle;
  /** Les années proposées : de l'année courante à quatre ans en arrière, sans remonter avant la naissance de la femelle. */
  const anneesPossibles = Array.from({ length: 5 }, (_, i) => annee - i)
    .filter((a) => a >= yearOf(chevre.dateNaissance))
    .map(String);

  const aDesLots = dedans.length > 0 || boutons.length > 0;
  if (!aDesLots && !avortement && !onAjouterUnCabri) return null;
  return (
    <>
      {aDesLots ? (
        <Card style={commonStyles.gap8}>
          <Text style={commonStyles.cardTitle}>{T.titre}</Text>
          <View style={styles.lots}>
            {dedans.map((lot) => (
              <Pressable key={lot.id} onPress={() => router.push(`${ROUTES.lot(lot.id)}&retour=${encodeURIComponent(ROUTES.ficheChevre(chevre.id))}` as never)} hitSlop={6} accessibilityLabel={lot.nom}>
                <Badge
                  label={
                    lot.categorie === CATEGORIE_LOT.AVORTEMENT && boucle
                      ? T.avortements(nombreDAvortements(lot, boucle), anneeDuLot(lot) ?? lot.nom)
                      : lot.nom
                  }
                  color={COULEURS[lot.categorie as CategorieAnnuelle] ?? colors.primary}
                />
              </Pressable>
            ))}
          </View>
          {boutons.map((b) => (
            <Button key={b.categorie} variant="secondary" label={b.label} onPress={() => boucle && ajouterAuLotAnnuel(b.categorie, boucle)} />
          ))}
          {boutons.length > 0 ? <Text style={commonStyles.note}>{T.aide(annee)}</Text> : null}
        </Card>
      ) : null}
      {/* Sous le suivi, côte à côte : une naissance (« Ajouter un cabri ») et un avortement de l'année. */}
      {onAjouterUnCabri || avortement ? (
        <View style={styles.actions}>
          {onAjouterUnCabri ? (
            <Pressable style={styles.cabri} onPress={onAjouterUnCabri} accessibilityRole="button">
              <Text style={styles.cabriTexte}>{TEXTES.cheptel.ficheChevre.ajouterUnCabri}</Text>
              <Ionicons name="paw" size={22} color={colors.ajout} />
            </Pressable>
          ) : null}
          {avortement ? (
            <Pressable
              style={styles.avortement}
              onPress={() => setAnneeAvortement(anneeAvortement === null ? String(annee) : null)}
              accessibilityRole="button"
              accessibilityLabel={T.avorte(femelle)}
            >
              <Text style={styles.avortementTexte}>{T.signalerAvortement}</Text>
              <Ionicons name="ban" size={26} color={colors.danger} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {/* Le choix de l'année de l'avortement : un signalement de plus la même année compte un avortement de plus. */}
      {avortement && anneeAvortement !== null ? (
        <Card style={commonStyles.gap8}>
          <Text style={commonStyles.cardTitle}>{T.anneeDeLAvortement}</Text>
          <FiltresExclusifs
            choix={anneesPossibles}
            valeur={anneeAvortement}
            onChoisir={(a) => a && setAnneeAvortement(a)}
          />
          <View style={styles.actions}>
            <Button variant="secondary" label={T.annuler} style={{ flex: 1 }} onPress={() => setAnneeAvortement(null)} />
            <Button
              label={T.signaler}
              style={{ flex: 1 }}
              onPress={async () => {
                if (boucle) await signalerUnAvortement(boucle, Number(anneeAvortement));
                setAnneeAvortement(null);
              }}
            />
          </View>
        </Card>
      ) : null}
    </>
  );
}
