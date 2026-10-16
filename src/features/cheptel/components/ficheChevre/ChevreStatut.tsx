import { Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { DateField } from '@/shared/components/DateField';
import { ChampPoids } from '@/features/cheptel/components/ChampPoids';
import { AvertissementDelais } from '@/features/exploitation/components/AvertissementDelais';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { statutLabel } from '@/features/cheptel/utils/chevreLabel';
import type { Chevre, StatutChevre } from '@/features/cheptel/types';
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
      ([STATUT_CHEVRE.ABATTOIR, STATUT_CHEVRE.VENDUE, STATUT_CHEVRE.AUTOCONSOMMEE] as string[]).includes(statut) ? (
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

/** Carte proposant de remettre dans le cheptel actif un animal sorti (morte, vendue, abattoir…). */
export function ChevreReactivation({ onReactiver }: { onReactiver: () => void }) {
  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{TEXTES.commun.general.statut}</Text>
      <Button
        label={TEXTES.cheptel.ficheChevre.remettreDansLeCheptelActif}
        variant="secondary"
        onPress={onReactiver}
      />
    </Card>
  );
}
