import { Pressable, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { TOUTES_ACTIVITES, type FiltreActivite } from '@/features/comptabilite/services/filtresTransactions';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { LABEL_ACTIVITE_COMPTABLE } from '@/shared/textes/libelles';
import { styles } from '@/shared/styles/etablissements/SelecteurEspece.styles';
import { TEXTES } from '@/shared/textes';

interface Props {
  valeur: FiltreActivite;
  /** Vues propres à la comptabilité (« toutes », « commun ») ; une espèce, elle, devient l'espèce active de l'application. */
  onChange: (filtre: FiltreActivite) => void;
}

/**
 * « Toutes · Chèvres · Brebis · Commun » : choisir une espèce la rend active dans toute l'application
 * (comme l'année active), « Toutes » et « Commun » ne changent que la liste affichée ici.
 * N'apparaît que pour un établissement qui élève plusieurs espèces.
 */
export function PucesActivite({ valeur, onChange }: Props) {
  const { especes, changerEspece } = useEtablissement();
  const chemin = usePathname();

  if (especes.length < 2) return null;

  type Puce = { filtre: FiltreActivite; label: string };
  // Deux lignes distinctes : les cheptels, puis « Toutes » et « Commun ».
  const cheptels: Puce[] = especes.map((e) => ({ filtre: e, label: LABEL_ACTIVITE_COMPTABLE[e] }));
  const autres: Puce[] = [
    { filtre: TOUTES_ACTIVITES, label: TEXTES.comptabilite.parActivite.toutes },
    { filtre: ACTIVITE_COMMUNE, label: LABEL_ACTIVITE_COMPTABLE[ACTIVITE_COMMUNE] },
  ];

  const choisir = (filtre: FiltreActivite) => {
    if (filtre === TOUTES_ACTIVITES || filtre === ACTIVITE_COMMUNE) onChange(filtre);
    else changerEspece(filtre as EspeceAnimale, chemin);
  };

  const ligne = (puces: Puce[]) => (
    <View style={styles.ligne}>
      {puces.map((p) => {
        const active = p.filtre === valeur;
        return (
          <Pressable
            key={p.filtre}
            style={[styles.puce, active && styles.puceActive]}
            onPress={() => !active && choisir(p.filtre)}
          >
            <Text style={[styles.texte, active && styles.texteActif]}>{p.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <>
      {ligne(cheptels)}
      {ligne(autres)}
    </>
  );
}
