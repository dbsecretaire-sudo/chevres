import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { Fab } from '@/shared/components/Fab';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { RestaurationGite } from '@/features/bar/components/RestaurationGite';
import { VenteBar } from '@/features/bar/components/VenteBar';
import { nouveauTicket } from '@/features/bar/services/tickets';
import { lireArchiveBar, remplacerTickets, triesSelonOrdre } from '@/features/bar/repository';
import type { ArchiveBar } from '@/features/bar/types';
import { listSejours } from '@/features/gite/repository';
import type { Sejour } from '@/features/gite/types';
import { ONGLET_BAR } from '@/shared/constants/bar';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

type Onglet = ValeurDe<typeof ONGLET_BAR>;

const T = TEXTES.bar;
const PUCES: { valeur: Onglet; label: string }[] = [
  { valeur: ONGLET_BAR.RESTAURATION, label: T.onglets.restauration },
  { valeur: ONGLET_BAR.BAR, label: T.onglets.bar },
];

/**
 * La restauration et le bar du gîte. Restauration : le calendrier des repas à préparer. Bar : la vente de boissons par
 * tickets. Le stock (boissons et nourriture) a son propre onglet en bas de l'écran, comme pour une exploitation agricole.
 */
export default function BarRestauration() {
  const [onglet, setOnglet] = useState<Onglet>(ONGLET_BAR.RESTAURATION);
  const [archive, setArchive] = useState<ArchiveBar>({
    boissons: [],
    aliments: [],
    tickets: [],
    articles: [],
    ordres: {},
  });
  const [sejours, setSejours] = useState<Sejour[]>([]);

  const charger = useCallback(async () => {
    const [bar, tous] = await Promise.all([lireArchiveBar(), listSejours()]);
    setArchive({
      boissons: triesSelonOrdre(bar.boissons, bar.ordres.consommables ?? []),
      aliments: triesSelonOrdre(bar.aliments, bar.ordres.consommables ?? []),
      articles: bar.articles,
      ordres: bar.ordres,
      // Au moins un ticket est toujours ouvert : « Ticket 1 » quand il n'y en a plus.
      tickets: bar.tickets.length > 0 ? bar.tickets : [nouveauTicket([])],
    });
    setSejours(tous);
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        <PucesDefilantes<Onglet> puces={PUCES} valeur={onglet} onChoisir={setOnglet} />

        {onglet === ONGLET_BAR.RESTAURATION ? <RestaurationGite sejours={sejours} /> : null}

        {onglet === ONGLET_BAR.BAR ? (
          <VenteBar
            boissons={archive.boissons}
            tickets={archive.tickets}
            onTickets={async (tickets) => {
              await remplacerTickets(tickets);
              await charger();
            }}
            onVendu={charger}
          />
        ) : null}
      </ScrollView>

      {onglet === ONGLET_BAR.BAR && archive.boissons.length > 0 ? (
        <Fab
          options={[
            {
              label: T.bar.ticket.nouveau,
              icon: 'receipt',
              onPress: async () => {
                await remplacerTickets([...archive.tickets, nouveauTicket(archive.tickets)]);
                await charger();
              },
            },
          ]}
        />
      ) : null}
    </Screen>
  );
}
