import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { BoutonDeBarre } from '@/shared/components/BoutonDeBarre';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { PastilleDeMenu } from '@/shared/components/PastilleDeMenu';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { LABEL_TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/textes/libelles';

interface Props {
  annees: number[];
  annee: number;
  onChoisirAnnee: (annee: number) => void;
  /** Vrai quand « Tout » est choisi (toutes les années regroupées) : la pastille le dit au lieu de l'année. */
  tout?: boolean;
  /** Quand elle est donnée, la liste propose « Tout » en plus des années (les listes qui regroupent les années le suivent). */
  onChoisirTout?: () => void;
  /** En gros boutons de la barre du bas (Windows), ou en pastilles dans la barre du haut (téléphone : on les touche rarement). */
  forme: 'barre' | 'pastille';
}

/**
 * Le choix de l'année et celui de l'espèce : un appui ouvre la liste. Le libellé de l'espèce est celui de l'espèce active (il change avec elle) ;
 * quand l'établissement n'a qu'une espèce, l'appui mène à ses informations, où l'on en ajoute.
 */
export function SelecteursFerme({ annees, annee, onChoisirAnnee, tout = false, onChoisirTout, forme }: Props) {
  const router = useRouter();
  const { especes, espece, changerEspece } = useEtablissement();
  const [anneeOuverte, setAnneeOuverte] = useState(false);
  const [especeOuverte, setEspeceOuverte] = useState(false);
  const listeAnnees = [...new Set([...annees, annee])].sort((a, b) => b - a);
  const libelleEspece = LABEL_TYPE_ANIMAL_ETABLISSEMENT[espece] ?? espece;
  const ouvrirAnnee = () => setAnneeOuverte(true);
  // Toujours la liste des animaux (même avec une seule espèce) ; son dernier choix mène aux informations de l'exploitation, pour en ajouter.
  const ouvrirEspece = () => setEspeceOuverte(true);
  return (
    <>
      {forme === 'barre' ? (
        <>
          <BoutonDeBarre
            icone={<Ionicons name="calendar" size={26} color={colors.blanc} />}
            libelle={String(annee)}
            onPress={ouvrirAnnee}
          />
          <BoutonDeBarre
            icone={<Ionicons name="swap-horizontal" size={26} color={colors.blanc} />}
            libelle={libelleEspece}
            onPress={ouvrirEspece}
          />
        </>
      ) : (
        <>
          <PastilleDeMenu libelle={tout && onChoisirTout ? TEXTES.commun.choix.toutesAnnees : String(annee)} onPress={ouvrirAnnee} />
          <PastilleDeMenu libelle={libelleEspece} onPress={ouvrirEspece} />
        </>
      )}
      <OptionsModal
        visible={anneeOuverte}
        onClose={() => setAnneeOuverte(false)}
        title={TEXTES.commun.choix.annee}
        options={[
          ...(onChoisirTout
            ? [
                {
                  label: TEXTES.commun.choix.toutesAnnees,
                  icon: (tout ? 'checkmark-circle' : 'calendar-outline') as 'checkmark-circle' | 'calendar-outline',
                  onPress: () => {
                    setAnneeOuverte(false);
                    onChoisirTout();
                  },
                },
              ]
            : []),
          ...listeAnnees.map((a) => ({
            label: String(a),
            icon: (a === annee && !tout ? 'checkmark-circle' : 'calendar-outline') as
              | 'checkmark-circle'
              | 'calendar-outline',
            onPress: () => {
              setAnneeOuverte(false);
              onChoisirAnnee(a);
            },
          })),
        ]}
      />
      <OptionsModal
        visible={especeOuverte}
        onClose={() => setEspeceOuverte(false)}
        title={TEXTES.commun.choix.animal}
        options={[
          ...especes.map((e) => ({
            label: LABEL_TYPE_ANIMAL_ETABLISSEMENT[e] ?? e,
            icon: (e === espece ? 'checkmark-circle' : 'paw-outline') as 'checkmark-circle' | 'paw-outline',
            onPress: () => {
              setEspeceOuverte(false);
              changerEspece(e);
            },
          })),
          {
            label: TEXTES.commun.choix.ajouterAnimal,
            icon: 'add-circle-outline' as const,
            onPress: () => router.push(ROUTES.INFORMATIONS_EXPLOITATION as never),
          },
        ]}
      />
    </>
  );
}
