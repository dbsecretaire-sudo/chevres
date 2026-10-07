import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { remboursementPropose } from '@/features/gite/services/tarifSejour';
import { TYPE_AJUSTEMENT_SEJOUR } from '@/shared/constants/gite';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

type TypeAjustement = ValeurDe<typeof TYPE_AJUSTEMENT_SEJOUR>;

interface Props {
  /** Ce qu'on ajoute au séjour payé ; la fenêtre est fermée quand il est absent. */
  type: TypeAjustement | null;
  /** Le total payé par le client à ce jour : proposé comme montant d'un remboursement (rendre tout), modifiable. */
  totalPaye: number;
  /** Vrai quand la réservation a des repas : le client peut alors garder le restaurant en abandonnant le reste. */
  avecRepas: boolean;
  /** Le prix des repas du séjour : le montant proposé suit ce que le client garde (restaurant, réservation). */
  montantRepas: number;
  onValider: (valeurs: {
    montant: number;
    date: string;
    maintenue: boolean;
    restaurantMaintenu: boolean;
  }) => void;
  onFermer: () => void;
}

const T = TEXTES.gite.sejour.ajustement;

/**
 * Petite fenêtre flottante pour un remboursement du client (montant, date, et s'il garde sa réservation) ou une prestation
 * supplémentaire (montant et date). L'un comme l'autre est inscrit en comptabilité.
 */
export function AjustementSejourModal({
  type,
  totalPaye,
  avecRepas,
  montantRepas,
  onValider,
  onFermer,
}: Props) {
  const [montant, setMontant] = useState('');
  const [date, setDate] = useState(todayISO());
  const [maintenue, setMaintenue] = useState(true);
  const [restaurantMaintenu, setRestaurantMaintenu] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  /** Vrai dès que le montant a été saisi à la main : les cases ne le recalculent plus. */
  const [montantSaisi, setMontantSaisi] = useState(false);

  /** Le montant proposé pour ce que le client garde ; une chaîne comme on la saisit (virgule). */
  const proposition = (garderReservation: boolean, garderRestaurant: boolean) => {
    const montantPropose = remboursementPropose({
      totalPaye,
      montantRepas: avecRepas ? montantRepas : 0,
      maintenue: garderReservation,
      restaurantMaintenu: garderRestaurant,
    });
    return montantPropose > 0 ? String(montantPropose).replace('.', ',') : '';
  };

  useEffect(() => {
    // Chaque ouverture repart d'un formulaire vide, à la date du jour.
    if (type) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMontant(type === TYPE_AJUSTEMENT_SEJOUR.REMBOURSEMENT ? proposition(true, true) : '');
      setMontantSaisi(false);
      setDate(todayISO());
      setMaintenue(true);
      setRestaurantMaintenu(true);
      setErreur(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const valider = () => {
    const valeur = parseDecimal(montant);
    if (!(valeur > 0)) return setErreur(T.montantInvalide);
    onValider({ montant: valeur, date, maintenue, restaurantMaintenu });
  };

  const remboursement = type === TYPE_AJUSTEMENT_SEJOUR.REMBOURSEMENT;

  return (
    <Modal visible={!!type} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{remboursement ? T.remboursement : T.prestation}</Text>
          <View style={commonStyles.row}>
            <View style={commonStyles.flex1}>
              <FormField
                label={T.montant}
                required
                value={montant}
                onChangeText={(texte) => {
                  setMontant(texte);
                  setMontantSaisi(true);
                  setErreur(null);
                }}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
            <View style={commonStyles.flex1}>
              <DateField label={T.date} required value={date} onChange={setDate} />
            </View>
          </View>
          {remboursement ? (
            <Checkbox
              label={T.maintenue}
              value={maintenue}
              onChange={(valeur) => {
                setMaintenue(valeur);
                if (!montantSaisi) setMontant(proposition(valeur, restaurantMaintenu));
              }}
            />
          ) : null}
          {/* Avec des repas, le client garde ou non le restaurant (coché d'office), que la réservation soit maintenue ou non. */}
          {remboursement && avecRepas ? (
            <Checkbox
              label={T.restaurantMaintenu}
              value={restaurantMaintenu}
              onChange={(valeur) => {
                setRestaurantMaintenu(valeur);
                if (!montantSaisi) setMontant(proposition(maintenue, valeur));
              }}
            />
          ) : null}
          {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={onFermer}
            />
            <Button style={commonStyles.flex1} label={TEXTES.commun.general.enregistrer} onPress={valider} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
