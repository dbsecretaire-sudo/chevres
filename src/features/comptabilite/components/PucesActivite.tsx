import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { TOUTES_ACTIVITES, type FiltreActivite } from '@/features/comptabilite/services/filtresTransactions';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { LABEL_ACTIVITE_COMPTABLE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

interface Props {
  valeur: FiltreActivite;
  /** Vues propres à la comptabilité (« toutes », « commun ») ; une espèce, elle, devient l'espèce active de l'application. */
  onChange: (filtre: FiltreActivite) => void;
}

/**
 * Une puce « Tout », « Commun », « Chèvres »… dont la liste s'ouvre au clic : choisir une
 * espèce la rend active dans toute l'application (comme l'année active), « Tout » et « Commun » ne changent que
 * la liste affichée ici. N'apparaît que pour un établissement qui élève plusieurs espèces.
 */
export function PucesActivite({ valeur, onChange }: Props) {
  const { especes, changerEspece } = useEtablissement();

  if (especes.length < 2) return null;

  const puces: { valeur: FiltreActivite; label: string }[] = [
    { valeur: TOUTES_ACTIVITES, label: TEXTES.comptabilite.parActivite.toutes },
    { valeur: ACTIVITE_COMMUNE, label: LABEL_ACTIVITE_COMPTABLE[ACTIVITE_COMMUNE] },
    ...especes.map((e) => ({ valeur: e, label: LABEL_ACTIVITE_COMPTABLE[e] })),
  ];

  const choisir = (filtre: FiltreActivite) => {
    onChange(filtre);
    // Un cheptel devient aussi l'espèce active de l'application ; l'écran, lui, n'est pas recréé.
    if (filtre !== TOUTES_ACTIVITES && filtre !== ACTIVITE_COMMUNE) changerEspece(filtre as EspeceAnimale);
  };

  return (
    <ChoixDeroulant
      titre={TEXTES.commun.choix.animal}
      valeur={valeur}
      options={puces.map((p) => ({ value: p.valeur, label: p.label }))}
      onChoisir={choisir}
    />
  );
}
