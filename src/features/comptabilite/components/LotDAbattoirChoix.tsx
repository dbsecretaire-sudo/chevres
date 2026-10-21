import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ListRow } from '@/shared/components/ListRow';
import { listTousLesAnimauxDeLEspece } from '@/features/cheptel/repository/chevres';
import { numerosDeBoucles } from '@/features/cheptel/utils/numerosBoucles';
import { lotsDAbattoirAFacturer } from '@/features/exploitation/services/departDAnimaux';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { LotAnimaux } from '@/features/settings/settings';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.comptabilite.nouvelleEcriture.lotAbattoir;

interface Props {
  /** Le lot choisi (son identifiant). */
  lotId?: string;
  onChoisir: (lotId: string | undefined) => void;
  /** Les animaux du lot choisi (leurs identifiants) : la dépense les garde en mémoire, sans les déplacer (ils sont déjà sortis du cheptel). */
  animauxEnvoyes: readonly string[];
  onAnimaux: (ids: string[]) => void;
}

/** Le résumé d'un lot : sa date de départ, ses animaux et l'état de son document de circulation. */
function ResumeDuLot({ lot }: { lot: LotAnimaux }) {
  const nombre = numerosDeBoucles(lot.boucles).length;
  return (
    <View>
      <Text style={commonStyles.muted}>
        {[lot.abattoir ? formatDateFR(lot.abattoir) : '', T.nAnimaux(nombre)].filter(Boolean).join(' · ')}
      </Text>
      <Text style={[commonStyles.note, { color: lot.documentCirculation ? colors.primary : colors.danger }]}>
        {lot.documentCirculation ? T.avecDocument : T.manqueDocument}
      </Text>
    </View>
  );
}

/**
 * Le lot d'abattoir que la dépense facture : sans lot, pas de facture. Le lot est créé avant (au départ des animaux, avec leur document de
 * circulation) ; la facture, émise quelques jours après, s'y rattache, et ses animaux (déjà sortis du cheptel à la date du départ) sont ceux du lot.
 * On choisit parmi les lots qui attendent leur facture, ou on en crée un.
 */
export function LotDAbattoirChoix({ lotId, onChoisir, animauxEnvoyes, onAnimaux }: Props) {
  const router = useRouter();
  const { settings } = useAppSettings();
  const lots = settings.exploitation?.lots ?? [];
  const choisi = lots.find((l) => l.id === lotId);
  const [changer, setChanger] = useState(false);
  const enAttente = lotsDAbattoirAFacturer(lots);

  // Les animaux du lot choisi : ceux du cheptel qui portent ses boucles (même sortis).
  const boucles = choisi?.boucles;
  useEffect(() => {
    if (!choisi || animauxEnvoyes.length > 0) return;
    let actuel = true;
    listTousLesAnimauxDeLEspece()
      .then((tous) => {
        if (!actuel) return;
        const voulues = new Set(numerosDeBoucles(boucles ?? ''));
        onAnimaux(tous.filter((a) => a.numeroBoucle && voulues.has(a.numeroBoucle.trim())).map((a) => a.id));
      })
      .catch(() => undefined);
    return () => {
      actuel = false;
    };
    // Une fois par lot choisi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choisi?.id, boucles]);

  return (
    <Card style={commonStyles.gap10}>
      <Text style={commonStyles.cardTitle}>{T.titre}</Text>
      <Text style={commonStyles.note}>{T.aide}</Text>
      {choisi && !changer ? (
        <>
          <ListRow
            title={choisi.nom}
            subtitle={<ResumeDuLot lot={choisi} />}
            onPress={() => router.push(ROUTES.lot(choisi.id) as never)}
          />
          <Button
            variant="secondary"
            label={T.modifier}
            onPress={() => {
              setChanger(true);
            }}
          />
        </>
      ) : (
        <>
          {enAttente.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.aucunLot}</Text> : null}
          {enAttente.map((lot) => (
            <ListRow
              key={lot.id}
              title={lot.nom}
              subtitle={<ResumeDuLot lot={lot} />}
              onPress={() => {
                setChanger(false);
                onAnimaux([]);
                onChoisir(lot.id);
              }}
            />
          ))}
          <Button
            variant="secondary"
            label={T.nouveau}
            onPress={() => router.push(ROUTES.lotAbattoirNouveau() as never)}
          />
        </>
      )}
    </Card>
  );
}
