import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { ROUTES } from '@/shared/constants/routes';
import { Text, View } from 'react-native';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { TicketBarCarte } from '@/features/bar/components/TicketBarCarte';
import { ajusterStock } from '@/features/bar/repository';
import { FILTRE_RUBRIQUE_BAR, ONGLET_STOCK_BAR, ORIGINE_MOUVEMENT_GITE } from '@/shared/constants/bar';
import { ajouterAuTicket, lignesDuTicket } from '@/features/bar/services/tickets';
import { enregistrerVenteBar } from '@/features/bar/services/ventes';
import type { Boisson, TicketBar } from '@/features/bar/types';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.bar.bar;

interface Props {
  boissons: Boisson[];
  /** Les tickets en cours (toujours au moins un). */
  tickets: TicketBar[];
  /** Enregistre la nouvelle liste de tickets. */
  onTickets: (tickets: TicketBar[]) => Promise<void>;
  /** Appelé après une vente enregistrée (pour recharger les stocks). */
  onVendu: () => void;
}

/**
 * La vente au bar par tickets : chaque ticket est une commande en cours (nommée « Ticket 1 », « Ticket 2 »… ou comme on
 * veut), à laquelle on ajoute des boissons de la liste du stock. Enregistrer la vente d'un ticket l'efface de la liste,
 * l'inscrit en comptabilité (recette « Bar ») ; le ticket suivant reprend le plus petit numéro libre. Le stock baisse dès
 * qu'une boisson est ajoutée au ticket (« OK ») et remonte si on la retire : la vente n'y touche plus.
 */
export function VenteBar({ boissons, tickets, onTickets, onVendu }: Props) {
  const router = useRouter();
  const retour = useAdresseCourante();
  const [replies, setReplies] = useState<string[]>([]);
  const [renomme, setRenomme] = useState<TicketBar | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const modifier = (id: string, patch: (ticket: TicketBar) => TicketBar) =>
    onTickets(tickets.map((t) => (t.id === id ? patch(t) : t)));

  const vendre = async (ticket: TicketBar) => {
    const montant = await enregistrerVenteBar(
      lignesDuTicket(ticket, boissons),
      ticket.date ?? todayISO(),
      ticket.nom,
    );
    await onTickets(tickets.filter((t) => t.id !== ticket.id));
    setMessage(T.venteEnregistree(formatMontant(montant)));
    onVendu();
  };

  if (boissons.length === 0) return <Text style={commonStyles.mutedItalic}>{T.aucuneBoisson}</Text>;

  return (
    <View style={commonStyles.gap10}>
      {tickets.map((ticket) => (
        <TicketBarCarte
          key={ticket.id}
          ticket={ticket}
          boissons={boissons}
          replie={replies.includes(ticket.id)}
          onBasculer={() =>
            setReplies((actuels) =>
              actuels.includes(ticket.id) ? actuels.filter((i) => i !== ticket.id) : [...actuels, ticket.id],
            )
          }
          onRenommer={() => setRenomme(ticket)}
          onChangerDate={(date) => modifier(ticket.id, (t) => ({ ...t, date }))}
          onEditerInventaire={() =>
            router.push(ROUTES.stockDepuis(retour, ONGLET_STOCK_BAR.CONSOMMABLES, FILTRE_RUBRIQUE_BAR))
          }
          onAjouter={async (boissonId, quantite) => {
            setMessage(null);
            const avant = ticket.lignes.find((l) => l.boissonId === boissonId)?.quantite ?? 0;
            const lignes = ajouterAuTicket(ticket.lignes, boissonId, quantite);
            const ajoutees = (lignes.find((l) => l.boissonId === boissonId)?.quantite ?? 0) - avant;
            // Le stock de la boisson baisse tout de suite, de ce qui a été ajouté au ticket.
            if (ajoutees > 0)
              await ajusterStock('boisson', boissonId, -ajoutees, ORIGINE_MOUVEMENT_GITE.VENTE);
            await modifier(ticket.id, (t) => ({ ...t, lignes }));
          }}
          onRetirer={async (boissonId) => {
            const retiree = ticket.lignes.find((l) => l.boissonId === boissonId)?.quantite ?? 0;
            // Une boisson retirée du ticket revient en stock.
            if (retiree > 0) await ajusterStock('boisson', boissonId, retiree, ORIGINE_MOUVEMENT_GITE.VENTE);
            await modifier(ticket.id, (t) => ({
              ...t,
              lignes: t.lignes.filter((l) => l.boissonId !== boissonId),
            }));
          }}
          onVendre={() => vendre(ticket)}
        />
      ))}
      {message ? <Text style={commonStyles.note}>{message}</Text> : null}

      <NomModal
        visible={!!renomme}
        titre={T.ticket.renommer}
        valeurInitiale={renomme?.nom}
        onValider={(nom) => {
          if (renomme) modifier(renomme.id, (t) => ({ ...t, nom }));
          setRenomme(null);
        }}
        onAnnuler={() => setRenomme(null)}
      />
    </View>
  );
}
