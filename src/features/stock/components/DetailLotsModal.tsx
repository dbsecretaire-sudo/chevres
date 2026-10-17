import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { SelectModal } from '@/shared/components/SelectModal';
import { FiltresLots, TableauLots } from '@/features/stock/components/TableauLots';
import { useListeLots } from '@/features/stock/hooks/useListeLots';
import { estArticleFromage, etatDuLot } from '@/features/stock/services/lots';
import {
  libererLotsReserves,
  prixDuProduitPourClient,
  reserverLotsPourClient,
} from '@/features/commercial/services/reservations';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import type { LotFromage } from '@/features/stock/types';
import { CATEGORIE_RECETTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { ETAT_LOT } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { ROUTES } from '@/shared/constants/routes';
import { parseDecimal } from '@/shared/utils/nombres';
import { nomComplet } from '@/shared/utils/personne';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/stock/DetailLots.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.lots;

interface Props {
  visible: boolean;
  /** Le fromage dont on montre les lots (il reste en place pendant que la fenêtre se ferme). */
  article: { cle: string; libelle: string } | null;
  lots: LotFromage[];
  /** Les fromages en stock qui n'ont pas de numéro de lot (saisis avant le suivi par lot). */
  sansLot: number;
  /** Relit les lots après un changement (la case de contrôle, une réservation). */
  onChange: () => void;
  onFermer: () => void;
  /** L'état des lots montré à l'ouverture (« Tout » par défaut ; Production ouvre sur « En stock »). */
  etatInitial?: ValeurDe<typeof ETAT_LOT>;
}

type Action = 'reserver' | 'facturer';

/**
 * Le détail d'un fromage dans l'inventaire : ses lots, sans bouton d'ajout ni de retrait (ils entrent par une fabrication et
 * sortent par une vente ou un rappel), la case du contrôle, et la sélection : un appui sur une ligne la choisit. Le bouton du haut,
 * gris tant que rien n'est choisi, devient « Réserver / Facturer » : une fenêtre propose de réserver les lots, de les facturer, ou de
 * libérer leur réservation, puis demande le client.
 */
export function DetailLotsModal({ visible, article, lots, sansLot, onChange, onFermer, etatInitial }: Props) {
  const router = useRouter();
  const liste = useListeLots(lots, article?.cle, etatInitial);
  const [choisis, setChoisis] = useState<Set<string>>(new Set());
  const [actions, setActions] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  /** Le prix à la pièce à demander : ni le tarif du contact ni l'inventaire n'en donnent. */
  const [questionPrix, setQuestionPrix] = useState<{ client: Client } | null>(null);

  useEffect(() => {
    if (visible) listClients().then(setClients);
  }, [visible]);

  const terminer = () => {
    setChoisis(new Set());
    setActions(false);
    setAction(null);
  };
  const fermer = () => {
    terminer();
    onFermer();
  };

  /** Un lot se choisit s'il est encore en stock (ni vendu, ni rappelé). */
  const basculer = (lot: LotFromage) => {
    if (etatDuLot(lot) !== ETAT_LOT.EN_STOCK) return;
    setChoisis((courants) => {
      const suivants = new Set(courants);
      if (!suivants.delete(lot.id)) suivants.add(lot.id);
      return suivants;
    });
  };
  const lotsChoisis = lots.filter((l) => choisis.has(l.id));
  const reserves = lotsChoisis.filter((l) => l.reservation);
  const libres = lotsChoisis.filter((l) => !l.reservation);
  /** Le client de la réservation quand tous les lots choisis sont réservés pour le même (sinon on le demande). */
  const clientDesReserves = (() => {
    if (reserves.length === 0 || libres.length > 0) return undefined;
    const cles = new Set(reserves.map((l) => l.reservation!.clientId ?? l.reservation!.client));
    if (cles.size !== 1) return undefined;
    const [cle] = [...cles];
    const client = clients.find((c) => c.id === cle || nomComplet(c) === cle);
    return client ? { id: client.id, nom: nomComplet(client) } : undefined;
  })();
  const fromage = estArticleFromage(article?.cle);

  /** Les lots choisis rejoignent le bon de commande ouvert de ce client (créé s'il n'y en a pas). */
  const reserverLesLots = async (client: Client, prix?: number) => {
    await reserverLotsPourClient(
      lotsChoisis.filter((l) => !l.reservation),
      article!,
      client,
      prix,
    );
    terminer();
    onChange();
  };

  /** La facture du client : la vente s'ouvre avec les lots choisis (avec facture d'office, le contact peut la refuser). */
  const ouvrirEcriture = (clientId: string) => {
    if (!article) return;
    const ids = [...choisis].join(';');
    fermer();
    router.push({
      pathname: ROUTES.COMPTABILITE_NOUVELLE,
      params: {
        type: TYPE_FACTURE.EMISE,
        categorie: fromage ? CATEGORIE_RECETTE.FROMAGE : CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE,
        client: clientId,
        fromages: ids,
        produit: article.cle,
        produitLibelle: article.libelle,
      },
    } as never);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={fermer}>
      <Pressable style={commonStyles.backdrop} onPress={fermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <View style={commonStyles.rowSpaceBetween}>
            <View style={commonStyles.flex1}>
              <Text style={commonStyles.subheading}>
                {fromage ? T.titreFromage(article?.libelle ?? '') : T.titre(article?.libelle ?? '')}
              </Text>
            </View>
            {/* Le bouton qui bascule : « Sélectionner… » en gris tant que rien n'est choisi, puis « Réserver / Facturer » en vert. */}
            {choisis.size > 0 ? (
              <Button variant="secondary" label={T.reserverFacturer} onPress={() => setActions(true)} />
            ) : (
              <View style={styles.selectionnerGris}>
                <Text style={styles.selectionnerTexte}>
                  {fromage ? T.selectionnerFromages : T.selectionnerProduits}
                </Text>
              </View>
            )}
          </View>
          {article ? (
            <View style={commonStyles.gap10}>
              <FiltresLots liste={liste} />
              {choisis.size > 0 ? <Text style={commonStyles.note}>{T.nChoisis(choisis.size)}</Text> : null}
              <TableauLots liste={liste} onChange={onChange} selection={choisis} onBasculer={basculer} />
              {sansLot > 0 ? <Text style={commonStyles.mutedItalic}>{T.sansLot(sansLot)}</Text> : null}
            </View>
          ) : null}
          <Text style={[commonStyles.note, commonStyles.required]}>{T.rappel}</Text>
          <Button label={T.ok} onPress={fermer} />

          {/* Que faire des lots choisis : les réserver, les facturer, ou libérer leur réservation. */}
          <OptionsModal
            visible={actions}
            onClose={() => setActions(false)}
            title={T.nChoisis(choisis.size)}
            options={[
              // Pas réservés : on les réserve.
              ...(libres.length > 0
                ? [{ label: T.reserver, icon: 'bookmark' as const, onPress: () => setAction('reserver') }]
                : []),
              // Réservés pour un même client : on les lui facture d'un appui ; on peut aussi libérer la réservation.
              ...(reserves.length > 0
                ? [
                    {
                      label: clientDesReserves ? T.facturerA(clientDesReserves.nom) : T.facturer,
                      icon: 'receipt' as const,
                      onPress: () => (clientDesReserves ? ouvrirEcriture(clientDesReserves.id) : setAction('facturer')),
                    },
                    {
                      label: T.liberer,
                      icon: 'lock-open' as const,
                      onPress: async () => {
                        await libererLotsReserves(reserves.map((l) => l.id));
                        terminer();
                        onChange();
                      },
                    },
                  ]
                : []),
            ]}
          />
          <NomModal
            visible={!!questionPrix}
            titre={T.questionPrix(article?.libelle ?? '')}
            placeholder="0,00"
            onValider={async (texte) => {
              const client = questionPrix?.client;
              setQuestionPrix(null);
              const prix = parseDecimal(texte);
              if (client && prix > 0) await reserverLesLots(client, prix);
            }}
            onAnnuler={() => setQuestionPrix(null)}
          />
          <SelectModal<string>
            visible={!!action}
            titre={clients.length === 0 ? TEXTES.cheptel.reservation.aucunClient : T.pourQuelClient}
            value=""
            searchable
            options={clients.map((c) => ({ value: c.id, label: nomComplet(c) }))}
            onSelect={async (clientId) => {
              const client = clients.find((c) => c.id === clientId);
              const choix = action;
              setAction(null);
              if (!client) return;
              if (choix === 'facturer') return ouvrirEcriture(client.id);
              // Le prix à la pièce : demandé s'il manque (ni tarif de ce contact, ni prix dans l'inventaire).
              const prix = await prixDuProduitPourClient(article!.cle, client);
              if (prix === undefined) return setQuestionPrix({ client });
              await reserverLesLots(client, prix);
            }}
            onClose={() => setAction(null)}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
