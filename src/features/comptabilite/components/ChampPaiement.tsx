import { View } from 'react-native';
import { ChoixPastilles } from '@/shared/components/ChoixPastilles';
import { DateField } from '@/shared/components/DateField';
import { TEXTES } from '@/shared/textes';

interface Props {
  /** Les deux réglages en pastilles : « Payé » ou « Encaissé » (à sa date), « À payer » ou « À encaisser » (pas encore). */
  libellePayee: string;
  libelleAttente: string;
  enAttente: boolean;
  onEnAttente: (enAttente: boolean) => void;
  echeance: string;
  onEcheance: (echeance: string) => void;
  /** Grisé et non modifiable : une facture offerte n'a pas de règlement à choisir. */
  desactive?: boolean;
}

/** Le règlement d'une écriture : payée à sa date (d'office), ou pas encore, avec la date prévue : la trésorerie la compte à cette date. */
export function ChampPaiement({ libellePayee, libelleAttente, enAttente, onEnAttente, echeance, onEcheance, desactive }: Props) {
  const T = TEXTES.comptabilite.tresorerie.paiement;
  return (
    <View style={desactive ? { opacity: 0.4 } : undefined} pointerEvents={desactive ? 'none' : 'auto'}>
      <ChoixPastilles
        options={[
          { value: 'payee', label: libellePayee },
          { value: 'attente', label: libelleAttente },
        ]}
        value={enAttente ? 'attente' : 'payee'}
        onChange={(choix) => onEnAttente(choix === 'attente')}
      />
      {enAttente ? <DateField label={T.echeance} value={echeance} onChange={onEcheance} /> : null}
    </View>
  );
}
