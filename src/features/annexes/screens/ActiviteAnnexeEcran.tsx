import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/ScreenList';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { Fab } from '@/shared/components/Fab';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { BlocLignes } from '@/shared/components/BlocListe';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { ActiviteAnnexeModal } from '@/features/annexes/components/ActiviteAnnexeModal';
import { TicketAnnexeCarte } from '@/features/annexes/components/TicketAnnexeCarte';
import {
  ajusterStockArticle,
  enregistrerActivite,
  lireArchiveAnnexes,
  remplacerTicketsActivite,
  supprimerActivite,
} from '@/features/annexes/repository';
import { CalendrierMois, type MarqueJour } from '@/shared/components/CalendrierMois';
import { listSejoursRestaurant } from '@/features/gite/repository';
import { repasParJour } from '@/features/gite/services/repas';
import type { Sejour } from '@/features/gite/types';
import { moisDe, type MoisCalendrier } from '@/shared/utils/calendrier';
import { enregistrerVenteAnnexe } from '@/features/annexes/services/ventes';
import {
  ajouterAuTicket,
  lignesDuTicket,
  nouveauTicket,
  reservationsPayeesDuJour,
  ticketDeReservation,
} from '@/features/annexes/services/tickets';
import type { ArchiveAnnexes, TicketAnnexe } from '@/features/annexes/types';
import { ROUTES } from '@/shared/constants/routes';
import { PREFIXE_FILTRE_ANNEXE, SECTION_ANNEXES } from '@/shared/constants/annexes';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { colors } from '@/shared/theme/colors';
import { formatDateFR, formatMontant, todayISO } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.annexes;

/**
 * Une activité annexe : sa vente par tickets (comme le bar, avec les articles et les prix de l'inventaire — le stock baisse à
 * l'ajout au ticket). Le crayon à côté de la liste des articles mène à l'inventaire, où se gèrent articles, prix et catégories.
 * Le menu en haut à droite modifie ou supprime l'activité.
 */
export default function ActiviteAnnexeEcran() {
  const { id, jour: jourDemande } = useLocalSearchParams<{ id: string; jour?: string }>();
  const router = useRouter();
  const retour = useAdresseCourante();
  const [archive, setArchive] = useState<ArchiveAnnexes | null>(null);
  const [replies, setReplies] = useState<string[]>([]);
  const [renomme, setRenomme] = useState<TicketAnnexe | null>(null);
  const [menu, setMenu] = useState(false);
  const [modifieActivite, setModifieActivite] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  /** Le calendrier des repas du gîte (restaurant) : le mois affiché et les séjours. */
  const [mois, setMois] = useState<MoisCalendrier>(() => moisDe(todayISO()));
  const [sejours, setSejours] = useState<Sejour[]>([]);

  const charger = useCallback(async () => {
    const [annexes, tous] = await Promise.all([lireArchiveAnnexes(), listSejoursRestaurant()]);
    setArchive(annexes);
    setSejours(tous);
  }, []);
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const activite = archive?.activites.find((a) => a.id === id);
  if (!archive || !activite) {
    return (
      <Screen>
        <Text style={commonStyles.notFound}>{T.introuvable}</Text>
      </Screen>
    );
  }

  const categories = archive.categories.filter((c) => c.activiteId === activite.id);
  const articles = archive.articles.filter((a) => a.activiteId === activite.id);
  const ticketsEnCours = archive.tickets.filter((t) => t.activiteId === activite.id);
  // Avec le calendrier des repas, un jour montre ses tickets (la date du ticket) ; sinon, tous ceux en cours.
  const avecCalendrier = !!activite.repasGite;
  // Deux fenêtres pour une activité avec calendrier : le calendrier, puis (un jour choisi) les tickets de ce jour.
  const vueCalendrier = avecCalendrier && !jourDemande;
  const jour = jourDemande ?? todayISO();
  const duJour = avecCalendrier
    ? ticketsEnCours.filter((t) => (t.date ?? todayISO()) === jour)
    : ticketsEnCours;
  // Chaque réservation payée qui a des repas ce jour-là a son ticket, au nom de son propriétaire et avec ses repas déjà payés ;
  // les autres tickets sont libres. Un ticket de réservation n'est enregistré qu'une fois modifié.
  const reservations = avecCalendrier ? reservationsPayeesDuJour(sejours, jour) : [];
  const deReservations = reservations.map(
    ({ sejour }) =>
      duJour.find((t) => t.sejourId === sejour.id) ?? ticketDeReservation(activite.id, sejour, jour),
  );
  const libres = duJour.filter((t) => !t.sejourId || !reservations.some((r) => r.sejour.id === t.sejourId));
  // Un seul ticket libre vide d'office : « Ticket 1 » quand il n'y a rien d'autre à afficher.
  const virtuel =
    deReservations.length + libres.length === 0 ? nouveauTicket(activite.id, [], jour) : undefined;
  const tickets = [...deReservations, ...libres, ...(virtuel ? [virtuel] : [])];
  const repasDe = (ticket: TicketAnnexe) => reservations.find((r) => r.sejour.id === ticket.sejourId)?.repas;
  const totauxRepas = repasParJour(sejours);
  /**
   * Ouvre la réservation d'un ticket : le séjour quand la réservation est maintenue ; l'historique du gîte, sur cette
   * réservation, quand le client n'a gardé que le restaurant.
   */
  const ouvrirReservation = (ticket: TicketAnnexe) => {
    const sejour = sejours.find((s) => s.id === ticket.sejourId);
    if (!sejour) return;
    router.push(sejour.abandonne ? ROUTES.giteHistorique(sejour.id) : ROUTES.sejour(sejour.id));
  };

  const modifierTickets = async (liste: TicketAnnexe[]) => {
    await remplacerTicketsActivite(activite.id, liste);
    await charger();
  };
  /** Enregistre le ticket modifié : mis à jour s'il l'était déjà, ajouté sinon (ticket vide d'office ou de réservation). */
  const enregistrerTicket = (nouveau: TicketAnnexe) =>
    modifierTickets(
      ticketsEnCours.some((t) => t.id === nouveau.id)
        ? ticketsEnCours.map((t) => (t.id === nouveau.id ? nouveau : t))
        : [...ticketsEnCours, nouveau],
    );
  const modifierTicket = (ticketId: string, patch: (t: TicketAnnexe) => TicketAnnexe) => {
    const cible = tickets.find((t) => t.id === ticketId);
    return cible ? enregistrerTicket(patch(cible)) : Promise.resolve();
  };

  const vendre = async (ticket: TicketAnnexe) => {
    const montant = await enregistrerVenteAnnexe(
      activite,
      lignesDuTicket(ticket, articles),
      ticket.date ?? todayISO(),
      ticket.nom,
      ticket.tauxTva,
    );
    // Un ticket de réservation reste (vendu) : sinon il reviendrait, la réservation ayant toujours ses repas ce jour-là.
    if (ticket.sejourId) await enregistrerTicket({ ...ticket, vendu: true });
    else await modifierTickets(ticketsEnCours.filter((t) => t.id !== ticket.id));
    setMessage(T.ticket.venteEnregistree(formatMontant(montant)));
  };

  return (
    <Screen scroll={false}>
      <Stack.Screen
        options={{
          title: vueCalendrier || !jourDemande ? activite.nom : `${activite.nom} — ${formatDateFR(jour)}`,
          headerRight: () => (
            <Pressable
              style={commonStyles.boutonEnteteDroite}
              onPress={() => setMenu(true)}
              hitSlop={10}
              accessibilityLabel={T.modifierActivite}
            >
              <Ionicons name="menu" size={26} color={colors.blanc} />
            </Pressable>
          ),
        }}
      />
      <OptionsModal
        visible={menu}
        onClose={() => setMenu(false)}
        title={activite.nom}
        options={[
          {
            label: T.modifierActivite,
            icon: 'create',
            onPress: () => {
              setMenu(false);
              setModifieActivite(true);
            },
          },
          {
            label: T.supprimerActivite,
            icon: 'trash',
            onPress: () => {
              setMenu(false);
              setSuppression(true);
            },
          },
        ]}
      />

      <ScrollView contentContainerStyle={commonStyles.listFab}>
        {vueCalendrier ? (
          <CalendrierMois
            mois={mois}
            onChangerMois={setMois}
            marque={(j): MarqueJour => ({
              texte: totauxRepas.has(j) ? String(totauxRepas.get(j)) : undefined,
              niveau: totauxRepas.has(j) ? 'partiel' : 'aucun',
            })}
            onJour={(j) => router.push(ROUTES.annexeJour(activite.id, j))}
          />
        ) : (
          <BlocLignes>
            {tickets.map((ticket) => (
              <TicketAnnexeCarte
                key={ticket.id}
                ticket={ticket}
                articles={articles}
                categories={categories}
                replie={replies.includes(ticket.id)}
                onBasculer={() =>
                  setReplies((actuels) =>
                    actuels.includes(ticket.id)
                      ? actuels.filter((i) => i !== ticket.id)
                      : [...actuels, ticket.id],
                  )
                }
                onRenommer={() => setRenomme(ticket)}
                onChangerDate={(date) => modifierTicket(ticket.id, (t) => ({ ...t, date }))}
                repasReserves={repasDe(ticket)}
                onOuvrirReservation={ticket.sejourId ? () => ouvrirReservation(ticket) : undefined}
                tauxTvaActivite={activite.tauxTva}
                onChangerTva={(tauxTva) => modifierTicket(ticket.id, (t) => ({ ...t, tauxTva }))}
                onEditerInventaire={() =>
                  router.push(
                    ROUTES.stockDepuis(retour, SECTION_ANNEXES, `${PREFIXE_FILTRE_ANNEXE}${activite.id}`),
                  )
                }
                onAjouter={async (articleId, quantite) => {
                  setMessage(null);
                  const avant = ticket.lignes.find((l) => l.articleId === articleId)?.quantite ?? 0;
                  const lignes = ajouterAuTicket(ticket.lignes, articleId, quantite);
                  const ajoutees = (lignes.find((l) => l.articleId === articleId)?.quantite ?? 0) - avant;
                  // Le stock de l'article baisse tout de suite, de ce qui a été ajouté au ticket.
                  if (ajoutees > 0) await ajusterStockArticle(articleId, -ajoutees);
                  await modifierTicket(ticket.id, (t) => ({ ...t, lignes }));
                }}
                onRetirer={async (articleId) => {
                  const retiree = ticket.lignes.find((l) => l.articleId === articleId)?.quantite ?? 0;
                  // Un article retiré du ticket revient en stock.
                  if (retiree > 0) await ajusterStockArticle(articleId, retiree);
                  await modifierTicket(ticket.id, (t) => ({
                    ...t,
                    lignes: t.lignes.filter((l) => l.articleId !== articleId),
                  }));
                }}
                onVendre={() => vendre(ticket)}
              />
            ))}
            {message ? <Text style={commonStyles.note}>{message}</Text> : null}
          </BlocLignes>
        )}
      </ScrollView>

      {vueCalendrier ? null : (
        <Fab
          options={[
            {
              label: T.ticket.nouveau,
              icon: 'receipt',
              onPress: () =>
                modifierTickets([
                  ...ticketsEnCours,
                  ...(virtuel ? [virtuel] : []),
                  nouveauTicket(activite.id, [...libres, ...(virtuel ? [virtuel] : [])], jour),
                ]),
            },
          ]}
        />
      )}

      <NomModal
        visible={!!renomme}
        titre={T.ticket.renommer}
        valeurInitiale={renomme?.nom}
        onValider={(nom) => {
          if (renomme) modifierTicket(renomme.id, (t) => ({ ...t, nom }));
          setRenomme(null);
        }}
        onAnnuler={() => setRenomme(null)}
      />
      <ActiviteAnnexeModal
        visible={modifieActivite}
        activite={activite}
        onValider={async (donnees) => {
          await enregistrerActivite({ ...donnees, id: activite.id });
          setModifieActivite(false);
          charger();
        }}
        onFermer={() => setModifieActivite(false)}
      />
      <ConfirmModal
        visible={suppression}
        title={T.supprimerActiviteQuestion}
        message={T.supprimerActiviteMessage(activite.nom)}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setSuppression(false)}
        onConfirm={async () => {
          setSuppression(false);
          await supprimerActivite(activite.id);
          router.back();
        }}
      />
    </Screen>
  );
}
