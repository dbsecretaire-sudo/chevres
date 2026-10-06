import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import type { RubriqueComptabilite } from '@/features/comptabilite/services/filtresTransactions';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { RUBRIQUE_COMPTABILITE } from '@/shared/constants/comptabilite';
import { activitesEtablissement } from '@/shared/dictionnaire/entreprise';
import { TEXTES } from '@/shared/textes';

interface Props {
  valeur: RubriqueComptabilite;
  onChange: (rubrique: RubriqueComptabilite) => void;
}

const T = TEXTES.comptabilite.rubriques;
const PUCES: { valeur: RubriqueComptabilite; label: string }[] = [
  { valeur: RUBRIQUE_COMPTABILITE.TOUT, label: T.tout },
  { valeur: RUBRIQUE_COMPTABILITE.GITE, label: T.gite },
  { valeur: RUBRIQUE_COMPTABILITE.BAR, label: T.bar },
  { valeur: RUBRIQUE_COMPTABILITE.ACTIVITE, label: T.activite },
];

/**
 * Une puce « Tout », « Gîte », « Bar » ou « Activité » dont la liste s'ouvre au clic : trie la liste des écritures d'un gîte
 * par rubrique. N'apparaît que pour un établissement qui gère un gîte.
 */
export function PucesRubrique({ valeur, onChange }: Props) {
  if (!activitesEtablissement().includes(ACTIVITE_SOCIETE.ASSOCIATION)) return null;

  return (
    <ChoixDeroulant
      titre={TEXTES.commun.choix.rubrique}
      valeur={valeur}
      options={PUCES.map((p) => ({ value: p.valeur, label: p.label }))}
      onChoisir={onChange}
    />
  );
}
