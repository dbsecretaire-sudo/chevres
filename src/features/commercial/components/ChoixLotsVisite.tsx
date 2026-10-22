import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import {
  besoinsDeLaVisite,
  choixParDefaut,
  choixValide,
  lotsPourVisite,
} from '@/features/commercial/services/stockVisite';
import type { FormuleAgritourisme, StockDeVisite } from '@/features/commercial/types';
import { lireArchiveStock } from '@/features/stock/repository';
import { libelleArticle } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.commercial.agritourisme.stock;

/**
 * La réalisation d'une visite qui consomme du stock : pour chaque produit de la formule, les lots à sortir (les plus anciens sont cochés d'office, autant que
 * la quantité demandée). Ce qui n'est pas coché sort du stock sans numéro de lot. « Réaliser » sort le stock et inscrit la recette.
 */
export function ChoixLotsVisite({
  visible,
  visiteId,
  formule,
  participants,
  onValider,
  onAnnuler,
}: {
  visible: boolean;
  visiteId?: string;
  formule: FormuleAgritourisme | undefined;
  participants: number;
  onValider: (stock: StockDeVisite[]) => void;
  onAnnuler: () => void;
}) {
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [choix, setChoix] = useState<StockDeVisite[]>([]);
  const besoins = besoinsDeLaVisite(formule, participants);

  // À chaque ouverture : le stock du moment, et les lots les plus anciens cochés.
  useEffect(() => {
    if (!visible) return;
    lireArchiveStock()
      .then((a) => {
        setArchive(a);
        setChoix(choixParDefaut(besoinsDeLaVisite(formule, participants), a, visiteId));
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const basculer = (article: string, lotId: string) =>
    setChoix((courant) =>
      courant.map((c) =>
        c.article !== article
          ? c
          : { ...c, lotIds: c.lotIds.includes(lotId) ? c.lotIds.filter((x) => x !== lotId) : [...c.lotIds, lotId] },
      ),
    );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onAnnuler}>
      <Pressable style={commonStyles.backdrop} onPress={onAnnuler}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{T.choixTitre}</Text>
          <Text style={commonStyles.note}>{T.choixAide}</Text>
          <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={commonStyles.gap10}>
            {archive
              ? besoins.map((b) => {
                  const lots = lotsPourVisite(archive, b.article, visiteId);
                  const pris = choix.find((c) => c.article === b.article)?.lotIds ?? [];
                  const entier = Math.floor(b.quantite);
                  return (
                    <View key={b.article} style={commonStyles.gap6}>
                      <Text style={commonStyles.lineBold}>{T.ligne(b.quantite, libelleArticle(b.article, archive))}</Text>
                      {lots.length === 0 ? <Text style={commonStyles.note}>{T.sansLot(b.quantite)}</Text> : null}
                      {lots.map((l) => (
                        <Checkbox
                          key={l.id}
                          label={`${l.numero} · ${formatDateFR(l.dateFabrication)}`}
                          value={pris.includes(l.id)}
                          onChange={() => basculer(b.article, l.id)}
                          disabled={!pris.includes(l.id) && pris.length >= entier}
                        />
                      ))}
                      {lots.length > 0 ? (
                        <Text style={commonStyles.note}>
                          {T.compteur(pris.length, b.quantite)}
                          {pris.length < b.quantite ? ` ${T.resteSansLot(Math.max(0, b.quantite - pris.length))}` : ''}
                        </Text>
                      ) : null}
                    </View>
                  );
                })
              : null}
          </ScrollView>
          <View style={commonStyles.row}>
            <Button style={commonStyles.flex1} variant="secondary" label={TEXTES.commun.general.annuler} onPress={onAnnuler} />
            <Button
              style={commonStyles.flex1}
              label={T.realiser}
              disabled={!choixValide(choix)}
              onPress={() => onValider(choix)}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
