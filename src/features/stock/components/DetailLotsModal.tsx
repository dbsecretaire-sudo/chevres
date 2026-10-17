import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
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
import { parseDecimal } from '@/shared/utils/nombres';
import { listClients } from '@/features/clients/repository';
import { estParticulier } from '@/features/clients/services/categorie';
import type { Client } from '@/features/clients/types';
import type { LotFromage } from '@/features/stock/types';
import { CATEGORIE_RECETTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { ETAT_LOT } from '@/shared/constants/stock';
import { ROUTES } from '@/shared/constants/routes';
import { nomComplet } from '@/shared/utils/personne';
import { commonStyles } from '@/shared/styles/commonStyles';
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
}

/**
 * Le détail d'un fromage dans l'inventaire : ses lots, sans bouton d'ajout ni de retrait (ils entrent par une fabrication et
 * sortent par une vente ou un rappel), la case du contrôle, et le mode « Réserver / Facturer » : on choisit un ou plusieurs lots
 * d'un appui, puis on les réserve pour un client particulier, ou on inscrit leur vente sans facture.
 */
export function DetailLotsModal({ visible, article, lots, sansLot, onChange, onFermer }: Props) {
  const router = useRouter();
  const liste = useListeLots(lots, article?.cle);
  const [selectionner, setSelectionner] = useState(false);
  const [choisis, setChoisis] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<'reserver' | 'ecriture' | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (visible) listClients().then((liste) => setClients(liste.filter(estParticulier)));
  }, [visible]);

  /** Le prix à la pièce à demander : ni le tarif du contact ni l'inventaire n'en donnent. */
  const [questionPrix, setQuestionPrix] = useState<{ client: Client } | null>(null);
  /** Les lots choisis rejoignent le bon de commande ouvert de ce client (créé s'il n'y en a pas). */
  const reserverLesLots = async (client: Client, prix?: number) => {
    await reserverLotsPourClient(lotsChoisis.filter((l) => !l.reservation), article!, client, prix);
    terminer();
    onChange();
  };
  const terminer = () => {
    setSelectionner(false);
    setChoisis(new Set());
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

  /** L'écriture sans facture d'un client particulier : la vente s'ouvre avec les lots choisis. */
  const ouvrirEcriture = (clientId: string) => {
    if (!article) return;
    const fromage = estArticleFromage(article.cle);
    const ids = [...choisis].join(';');
    fermer();
    router.push({
      pathname: ROUTES.COMPTABILITE_NOUVELLE,
      params: {
        type: TYPE_FACTURE.EMISE,
        categorie: fromage ? CATEGORIE_RECETTE.FROMAGE : CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE,
        facture: 'non',
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
                {estArticleFromage(article?.cle)
                  ? T.titreFromage(article?.libelle ?? '')
                  : T.titre(article?.libelle ?? '')}
              </Text>
            </View>
            {/* Le bouton qui bascule : réserver / facturer, ou revenir à la simple liste. */}
            <Button
              variant="secondary"
              label={selectionner ? T.annulerLaSelection : T.reserverFacturer}
              onPress={() => (selectionner ? terminer() : setSelectionner(true))}
            />
          </View>
          {article ? (
            <View style={commonStyles.gap10}>
              <FiltresLots liste={liste} />
              {selectionner ? <Text style={commonStyles.note}>{T.aideSelection(choisis.size)}</Text> : null}
              <TableauLots
                liste={liste}
                onChange={onChange}
                selection={selectionner ? choisis : undefined}
                onBasculer={selectionner ? basculer : undefined}
              />
              {selectionner && choisis.size > 0 ? (
                <View style={commonStyles.gap6}>
                  <Button label={T.reserverPour} variant="secondary" onPress={() => setAction('reserver')} />
                  <Button label={T.ecritureSansFacture} variant="secondary" onPress={() => setAction('ecriture')} />
                  {reserves.length > 0 ? (
                    <Button
                      label={T.liberer}
                      variant="secondary"
                      onPress={async () => {
                        await libererLotsReserves(reserves.map((l) => l.id));
                        terminer();
                        onChange();
                      }}
                    />
                  ) : null}
                </View>
              ) : null}
              {sansLot > 0 ? <Text style={commonStyles.mutedItalic}>{T.sansLot(sansLot)}</Text> : null}
            </View>
          ) : null}
          <Text style={[commonStyles.note, commonStyles.required]}>{T.rappel}</Text>
          <Button label={T.ok} onPress={fermer} />
          <NomModal
            visible={!!questionPrix}
            titre={TEXTES.stock.lots.questionPrix(article?.libelle ?? '')}
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
            titre={clients.length === 0 ? TEXTES.cheptel.reservation.aucunClient : TEXTES.stock.lots.pourQuelClient}
            value=""
            searchable
            options={clients.map((c) => ({ value: c.id, label: nomComplet(c) }))}
            onSelect={async (clientId) => {
              const client = clients.find((c) => c.id === clientId);
              const choix = action;
              setAction(null);
              if (!client) return;
              if (choix === 'ecriture') return ouvrirEcriture(client.id);
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
