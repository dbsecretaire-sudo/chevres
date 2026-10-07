import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { SelectField } from '@/shared/components/SelectField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { lignesDuTicket } from '@/features/bar/services/tickets';
import { totalVenteBar } from '@/features/bar/services/ventes';
import type { Boisson, TicketBar } from '@/features/bar/types';
import { NOMBRE_MAX_BOISSONS_TICKET } from '@/shared/constants/bar';
import { colors } from '@/shared/theme/colors';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/bar/Bar.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.bar.bar;

const QUANTITES = Array.from({ length: NOMBRE_MAX_BOISSONS_TICKET }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

interface Props {
  ticket: TicketBar;
  boissons: Boisson[];
  replie: boolean;
  onBasculer: () => void;
  onRenommer: () => void;
  onChangerDate: (date: string) => void;
  /** Le crayon à côté de la liste : l'inventaire du gîte, où se gèrent les boissons et leurs prix. */
  onEditerInventaire: () => void;
  /** Ajoute une boisson (et sa quantité) au ticket. */
  onAjouter: (boissonId: string, quantite: number) => void;
  onRetirer: (boissonId: string) => void;
  /** Enregistre la vente du ticket : il quitte la liste et son total entre en comptabilité. */
  onVendre: () => void;
}

/**
 * Un ticket du bar : son nom (renommable avec le crayon), les boissons commandées avec leur quantité, un choix de boisson
 * dans la liste du stock avec sa quantité (1 à 50) et « OK » pour l'ajouter, le total, et « Enregistrer la vente ». Il se
 * replie avec la flèche.
 */
export function TicketBarCarte({
  ticket,
  boissons,
  replie,
  onBasculer,
  onRenommer,
  onChangerDate,
  onEditerInventaire,
  onAjouter,
  onRetirer,
  onVendre,
}: Props) {
  const [boissonId, setBoissonId] = useState('');
  const [quantite, setQuantite] = useState('1');

  const lignes = lignesDuTicket(ticket, boissons);
  const total = totalVenteBar(lignes);

  const ajouter = () => {
    if (!boissonId) return;
    onAjouter(boissonId, Number(quantite));
    setBoissonId('');
    setQuantite('1');
  };

  return (
    <Card>
      <View style={styles.enteteTicket}>
        <View style={styles.ticketTitre}>
          <Text style={styles.nomTicket}>{ticket.nom}</Text>
          <Pressable onPress={onRenommer} hitSlop={8} accessibilityLabel={T.ticket.renommer}>
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </Pressable>
        </View>
        <Text>{ticket.date ?? todayISO()}</Text>
        {replie ? <Text style={styles.totalTicketReplie}>{formatMontant(total)}</Text> : null}
        <Pressable
          onPress={onBasculer}
          hitSlop={8}
          accessibilityLabel={replie ? T.ticket.deplier : T.ticket.replier}
        >
          <Ionicons name={replie ? 'chevron-down' : 'chevron-up'} size={24} color={colors.primary} />
        </Pressable>
      </View>

      {replie ? null : (
        <>
          {lignes.map(({ boisson, quantite: nombre }) => (
            <View key={boisson.id} style={styles.ligneTicket}>
              <Text style={styles.nomLigneTicket}>{boisson.nom}</Text>
              <Text style={styles.quantiteLigneTicket}>{nombre}</Text>
              <Pressable
                onPress={() => onRetirer(boisson.id)}
                hitSlop={8}
                accessibilityLabel={T.ticket.retirerLigne}
              >
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}

          <View style={styles.ajoutTicket}>
            <View style={commonStyles.flex1}>
              <SelectFieldEditable<string>
                label={T.ticket.boisson}
                libelleCache
                searchable
                placeholder={T.ticket.listeDuStock}
                value={boissonId}
                options={boissons.map((b) => ({ value: b.id, label: b.nom }))}
                onChange={setBoissonId}
                onEdit={onEditerInventaire}
              />
            </View>
            <View style={styles.quantiteAjout}>
              <SelectField<string>
                label={T.ticket.quantite}
                libelleCache
                value={quantite}
                options={QUANTITES}
                onChange={setQuantite}
              />
            </View>
          </View>
          <View style={styles.boutonOk}>
            <Button label={T.ticket.ok} disabled={!boissonId} onPress={ajouter} />
          </View>

          <Text style={styles.totalTicket}>{T.total(formatMontant(total))}</Text>
          <Button label={T.enregistrerVente} disabled={total <= 0} onPress={onVendre} />
        </>
      )}
    </Card>
  );
}
