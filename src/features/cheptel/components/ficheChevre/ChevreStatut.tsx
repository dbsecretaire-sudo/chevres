import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { DateField } from '@/shared/components/DateField';
import { ChampPoids } from '@/features/cheptel/components/ChampPoids';
import { AvertissementDelais } from '@/features/exploitation/components/AvertissementDelais';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { statutLabel } from '@/features/cheptel/utils/chevreLabel';
import type { Chevre, StatutChevre } from '@/features/cheptel/types';
import { colors } from '@/shared/theme/colors';
import { formatDateFR } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface DeclarationProps {
  chevre: Chevre;
  statut: StatutChevre;
  date: string;
  onDateChange: (date: string) => void;
  /** Le poids donné à la sortie (abattoir, vente) : facultatif. */
  poidsKg?: number;
  onPoidsChange: (poidsKg: number | undefined) => void;
  onAnnuler: () => void;
  onConfirmer: () => void;
}

/** Carte de confirmation d'un changement de statut (morte, abattoir, vendue…) avec sa date. */
export function ChevreStatutDeclaration({
  chevre,
  statut,
  date,
  onDateChange,
  poidsKg,
  onPoidsChange,
  onAnnuler,
  onConfirmer,
}: DeclarationProps) {
  return (
    <Card>
      <Text style={commonStyles.cardTitle}>
        {TEXTES.cheptel.ficheChevre.declarerDeuxPoints}
        {statutLabel(statut, chevre.sexe)}
      </Text>
      <DateField label={TEXTES.commun.general.date} value={date} onChange={onDateChange} />
      {/* L'abattoir donne le poids de la carcasse : il se note ici, avec la sortie. */}
      {statut === STATUT_CHEVRE.ABATTOIR || statut === STATUT_CHEVRE.VENDUE ? (
        <ChampPoids
          value={poidsKg ?? chevre.poidsKg}
          onChange={onPoidsChange}
          label={statut === STATUT_CHEVRE.ABATTOIR ? TEXTES.cheptel.ficheChevre.poidsAbattoir : undefined}
        />
      ) : null}
      {/* Envoyée à l'abattoir, vendue ou consommée : pas pendant un délai d'attente pour la viande. */}
      {chevre.numeroBoucle &&
      ([STATUT_CHEVRE.ABATTOIR, STATUT_CHEVRE.VENDUE, STATUT_CHEVRE.AUTOCONSOMMEE] as string[]).includes(
        statut,
      ) ? (
        <AvertissementDelais type="viande" date={date} boucles={[chevre.numeroBoucle]} />
      ) : null}
      <View style={commonStyles.row}>
        <Button
          style={commonStyles.flex1}
          variant="secondary"
          label={TEXTES.commun.general.annuler}
          onPress={onAnnuler}
        />
        <Button
          style={commonStyles.flex1}
          variant="danger"
          label={TEXTES.commun.general.confirmer}
          onPress={onConfirmer}
        />
      </View>
    </Card>
  );
}

/**
 * La sortie d'un animal sorti (mort, abattoir, vendu…) : une seule carte pour sa date de sortie et son retour au cheptel actif, verrouillée
 * d'office pour éviter les erreurs. Le cadenas la déverrouille : on y corrige la date (le recensement et les bordereaux la suivent) ou on
 * remet l'animal dans le cheptel actif ; il se referme après un enregistrement.
 */
export function ChevreSortie({
  chevre,
  onEnregistrerDate,
  onReactiver,
  figee = false,
  facturesDuClient = [],
  onOuvrirFacture,
}: {
  chevre: Chevre;
  onEnregistrerDate: (date: string) => void;
  onReactiver: () => void;
  /** Vrai : l'animal est d'un lot d'abattoir vendu — sa sortie est figée tant que la facture du client existe. */
  figee?: boolean;
  /** Les factures du client qui portent encore cet animal (ce qui fige sa sortie) : un appui ouvre la facture. */
  facturesDuClient?: { id: string; libelle: string }[];
  onOuvrirFacture?: (id: string) => void;
}) {
  const T = TEXTES.cheptel.ficheChevre.sortie;
  const [deverrouillee, setDeverrouillee] = useState(false);
  const [date, setDate] = useState(chevre.dateStatut ?? '');
  const titre = chevre.dateStatut
    ? T.titreAvecDate(statutLabel(chevre.statut, chevre.sexe, !!chevre.enlevementId), formatDateFR(chevre.dateStatut))
    : statutLabel(chevre.statut, chevre.sexe, !!chevre.enlevementId);
  return (
    <Card style={commonStyles.gap8}>
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={[commonStyles.cardTitle, commonStyles.flex1]}>{titre}</Text>
        <Pressable
          disabled={figee}
          onPress={() => setDeverrouillee((ouvert) => !ouvert)}
          hitSlop={8}
          accessibilityLabel={deverrouillee ? T.verrouiller : T.deverrouiller}
        >
          <Ionicons
            name={deverrouillee && !figee ? 'lock-open' : 'lock-closed'}
            size={24}
            color={figee ? colors.textMuted : deverrouillee ? colors.danger : colors.primary}
          />
        </Pressable>
      </View>
      {figee ? (
        <>
          <Text style={commonStyles.note}>{T.figee}</Text>
          {facturesDuClient.map((f) => (
            <Pressable key={f.id} onPress={() => onOuvrirFacture?.(f.id)} hitSlop={8} accessibilityRole="link">
              <Text style={commonStyles.lien}>{T.voirLaFacture(f.libelle)}</Text>
            </Pressable>
          ))}
        </>
      ) : deverrouillee ? (
        <>
          <DateField label={TEXTES.cheptel.ficheChevre.dateDeSortie} value={date} onChange={setDate} />
          <Button
            variant="secondary"
            label={TEXTES.cheptel.ficheChevre.enregistrerLaDate}
            onPress={() => {
              onEnregistrerDate(date);
              setDeverrouillee(false);
            }}
            disabled={!date || date === chevre.dateStatut}
          />
          <Button
            label={TEXTES.cheptel.ficheChevre.remettreDansLeCheptelActif}
            variant="danger"
            onPress={onReactiver}
          />
          <Button variant="secondary" label={T.verrouiller} onPress={() => setDeverrouillee(false)} />
        </>
      ) : (
        <Text style={commonStyles.note}>{T.aideVerrou}</Text>
      )}
    </Card>
  );
}
