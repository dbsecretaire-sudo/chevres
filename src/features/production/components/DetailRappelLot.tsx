import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { LigneInfo } from '@/shared/components/LigneInfo';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { getVente } from '@/features/comptabilite/repository/ventes';
import type { Vente } from '@/features/comptabilite/types';
import { etatDuLot } from '@/features/stock/services/lots';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { libelleArticle } from '@/features/stock/services/stock';
import { ETAT_LOT } from '@/shared/constants/stock';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import { nomComplet } from '@/shared/utils/personne';
import { LABEL_CATEGORIE_VENTE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.rappelsLots.detail;

interface Props {
  /** Le lot dont on montre le détail (il reste en place pendant que la fenêtre se ferme). */
  lot: LotFromage | null;
  archive: ArchiveStock | null;
  visible: boolean;
  onFermer: () => void;
}

/**
 * Le détail d'un lot à rappeler : le lot (produit, n°, dates, contrôle), la facture de la vente où il est parti (n°, date,
 * montant, un lien vers la vente) et le client à contacter (la fiche client qui porte le nom saisi dans la vente, avec ses
 * coordonnées).
 */
export function DetailRappelLot({ lot, archive, visible, onFermer }: Props) {
  const router = useRouter();
  const [venteLue, setVenteLue] = useState<Vente | undefined>();
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (!visible) return;
    if (lot?.venteId) getVente(lot.venteId).then(setVenteLue);
    listClients().then(setClients);
  }, [visible, lot?.venteId]);

  // La vente lue appartient peut-être au lot précédent : on ne la montre que si c'est celle de ce lot.
  const vente = venteLue && venteLue.id === lot?.venteId ? venteLue : undefined;
  const nomDuClient = vente?.client?.trim();
  const fiche = nomDuClient
    ? clients.find((c) => nomComplet(c).trim().toLowerCase() === nomDuClient.toLowerCase())
    : undefined;
  const etat = lot ? etatDuLot(lot) : undefined;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>
            {lot && archive ? `${libelleArticle(lot.article, archive)} · ${lot.numero}` : ''}
          </Text>
          {lot ? (
            <ScrollView style={commonStyles.listeDeFenetre} contentContainerStyle={commonStyles.gap10}>
              <Text style={commonStyles.lineBold}>{T.lot}</Text>
              <LigneInfo label={T.fabrication} valeur={formatDateFR(lot.dateFabrication)} />
              <LigneInfo label={T.vente} valeur={lot.dateVente ? formatDateFR(lot.dateVente) : undefined} />
              <LigneInfo
                label={T.rappel}
                valeur={
                  lot.dateRappel
                    ? lot.dateRappelValide
                      ? `${formatDateFR(lot.dateRappel)} · ${T.valideLe(formatDateFR(lot.dateRappelValide))}`
                      : formatDateFR(lot.dateRappel)
                    : T.aRappeler
                }
              />
              <LigneInfo label={T.controle} valeur={lot.controleOk ? T.controleOk : T.controleNonOk} />

              <Text style={commonStyles.lineBold}>{T.facture}</Text>
              {etat === ETAT_LOT.EN_STOCK ? (
                <Text style={commonStyles.mutedItalic}>{T.pasVendu}</Text>
              ) : !vente ? (
                <Text style={commonStyles.mutedItalic}>{T.venteIntrouvable}</Text>
              ) : (
                <View style={commonStyles.gap10}>
                  <LigneInfo label={T.numeroFacture} valeur={vente.numeroFacture} />
                  <LigneInfo
                    label={T.venteDu}
                    valeur={`${formatDateFR(vente.date)} · ${LABEL_CATEGORIE_VENTE[vente.categorie]}`}
                  />
                  <LigneInfo label={T.montant} valeur={vente.prix ? formatMontant(vente.prix) : undefined} />
                </View>
              )}

              <Text style={commonStyles.lineBold}>{T.client}</Text>
              <LigneInfo label={T.nom} valeur={fiche ? nomComplet(fiche) : nomDuClient} />
              {fiche ? (
                <>
                  <LigneInfo label={T.telephone} valeur={fiche.telephone} />
                  <LigneInfo label={T.email} valeur={fiche.email} />
                  <LigneInfo label={T.adresse} valeur={fiche.adressePostale} />
                  <Button
                    variant="secondary"
                    label={T.ouvrirLaFicheClient}
                    onPress={() => {
                      onFermer();
                      router.push(ROUTES.ficheClient(fiche.id) as never);
                    }}
                  />
                </>
              ) : nomDuClient ? (
                <Text style={commonStyles.mutedItalic}>{T.pasDeFiche}</Text>
              ) : null}
            </ScrollView>
          ) : null}
          <Button label={T.fermer} onPress={onFermer} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
