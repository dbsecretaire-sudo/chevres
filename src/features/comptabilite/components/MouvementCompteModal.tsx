import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { enregistrerFacture } from '@/features/comptabilite/repository/factures';
import { CATEGORIE_DEPENSE, CATEGORIE_RECETTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { SENS_MOUVEMENT } from '@/shared/constants/trading';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { estDateISO } from '@/shared/utils/dates';
import { useAnneeImposee } from '@/features/settings/hooks/useAnneeImposee';
import { parseDecimal } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

type SensMouvement = ValeurDe<typeof SENS_MOUVEMENT>;

interface Props {
  /** Le sens du mouvement à saisir ; la fenêtre est fermée quand il est absent. */
  sens: SensMouvement | null;
  onFermer: () => void;
  /** Appelé une fois le mouvement enregistré (pour recharger la liste). */
  onEnregistre: () => void;
}

/**
 * Petite fenêtre flottante pour un dépôt (+) ou un retrait (−) sur le compte de trading : le montant et la date, c'est
 * tout. Il ajuste le solde sans compter dans le chiffre d'affaires ; les gains et pertes viennent du journal.
 */
export function MouvementCompteModal({ sens, onFermer, onEnregistre }: Props) {
  const T = TEXTES.trading.compte;
  const depot = sens !== SENS_MOUVEMENT.RETRAIT;
  const [montant, setMontant] = useState('');
  const { anneeImposee, dateDuJour } = useAnneeImposee();
  const [date, setDate] = useState(dateDuJour);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // Chaque ouverture repart d'un formulaire vide, à la date du jour.
    if (sens) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMontant('');
      setDate(dateDuJour);
      setErreur(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sens]);

  const enregistrer = async () => {
    const valeur = parseDecimal(montant);
    if (!(valeur > 0)) return setErreur(T.montantInvalide);
    if (!estDateISO(date)) return setErreur(TEXTES.commun.dateField.invalide);
    await enregistrerFacture({
      activite: ACTIVITE_COMMUNE,
      date,
      type: depot ? TYPE_FACTURE.EMISE : TYPE_FACTURE.RECUE,
      tiers: T.compteParDefaut,
      description: depot ? T.descriptionDepot : T.descriptionRetrait,
      montant: valeur,
      ...(depot
        ? { categorieRecette: CATEGORIE_RECETTE.DEPOT }
        : { categorieDepense: CATEGORIE_DEPENSE.RETRAIT }),
    });
    onEnregistre();
    onFermer();
  };

  return (
    <Modal visible={!!sens} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <AccentColorProvider
            color={depot ? colors.primary : colors.danger}
            softColor={depot ? colors.badgeBg : colors.ajoutBadgeBg}
          >
            <Text style={commonStyles.subheading}>{depot ? T.nouveauDepot : T.nouveauRetrait}</Text>
            <FormField
              label={T.montant}
              required
              value={montant}
              onChangeText={(texte) => {
                setMontant(texte);
                setErreur(null);
              }}
              keyboardType="decimal-pad"
              placeholder="0,00"
            />
            <DateField
              label={T.date}
              required
              value={date}
              onChange={setDate}
              anneeImposee={anneeImposee}
              jourMoisAnnee
            />
            {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}
            <View style={commonStyles.row}>
              <Button
                style={commonStyles.flex1}
                variant="secondary"
                label={TEXTES.commun.general.annuler}
                onPress={onFermer}
              />
              <Button
                style={commonStyles.flex1}
                label={TEXTES.commun.general.enregistrer}
                onPress={enregistrer}
              />
            </View>
          </AccentColorProvider>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
