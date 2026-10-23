import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { contratsDe, estUnAssureur, contratDuNumero, numeroDuContrat } from '@/features/fournisseurs/services/contratsAssureur';
import type { ContratAssureur, Fournisseur } from '@/features/fournisseurs/types';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.contacts.contrat;
/** La valeur du choix qui ouvre la création d'un contrat. */
const NOUVEAU = '__nouveau__';

interface Props {
  /** Le fournisseur de l'écriture : un assureur propose ses contrats. */
  fournisseur?: Fournisseur;
  /** Ce que l'écriture affiche comme numéro de facture. */
  valeur: string;
  /** Un numéro saisi, ou le contrat choisi (avec son numéro) : l'écriture reprend aussi ce qu'il couvre (le véhicule). */
  onChoix: (numero: string, contrat?: ContratAssureur) => void;
  label: string;
  placeholder?: string;
}

/**
 * Le numéro de la facture d'une écriture : un champ libre, sauf pour un assureur — dès qu'il est sélectionné, le numéro se choisit parmi ses contrats (leur dénomination),
 * et c'est le numéro de contrat qui s'inscrit dans la facture. Un contrat se crée depuis le choix ; « Autre » laisse saisir un numéro à la main.
 */
export function ChampNumeroOuContrat({ fournisseur, valeur, onChoix, label, placeholder }: Props) {
  const router = useRouter();
  if (!fournisseur || !estUnAssureur(fournisseur)) {
    return <FormField label={label} value={valeur} onChangeText={(texte) => onChoix(texte)} placeholder={placeholder} />;
  }
  const contrats = contratsDe(fournisseur);
  const choisi = contratDuNumero(fournisseur, valeur);
  return (
    <>
      <SelectField
        label={T.champ}
        value={choisi?.id ?? ''}
        onChange={(id) => {
          if (id === NOUVEAU) return router.push(ROUTES.contratAssureur({ fournisseur: fournisseur.id }) as never);
          const contrat = contrats.find((c) => c.id === id);
          onChoix(contrat ? numeroDuContrat(contrat) : '', contrat);
        }}
        options={[
          { value: '', label: T.sansContrat },
          ...contrats.map((c) => ({ value: c.id, label: c.numero ? `${c.denomination} · ${c.numero}` : c.denomination })),
          { value: NOUVEAU, label: T.nouveau },
        ]}
        aide={contrats.length > 0 ? T.champAide : T.aucunContrat}
      />
      {/* Sans contrat de la liste : le numéro de la facture se saisit à la main. */}
      {choisi ? null : (
        <>
          <FormField label={label} value={valeur} onChangeText={(texte) => onChoix(texte)} placeholder={placeholder} />
          {contrats.length === 0 ? <Text style={commonStyles.note}>{T.aucunContrat}</Text> : null}
        </>
      )}
    </>
  );
}
