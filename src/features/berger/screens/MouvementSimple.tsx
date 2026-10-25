import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { DateField } from '@/shared/components/DateField';
import { Button } from '@/shared/components/Button';
import type { Chevre } from '@/features/cheptel/types';
import {
  annulerEnvoiALAbattoir,
  annulerSortieSansVente,
  envoyerALAbattoir,
  enregistrerSortieSansVente,
} from '@/features/berger/services/mouvement';
import { dateDuJour } from '@/features/berger/services/soin';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.roles.berger;

/** Les mouvements faits depuis le mode normal. La vente vivante et l'entrée viendront ensuite (elles ont leur propre parcours). */
type Mouvement = 'sortie' | 'abattoir';

interface Props {
  animal: Chevre;
  /** Enregistré : l'écran de confirmation, avec de quoi annuler. */
  onFait: (titre: string, detail: string, annuler: () => Promise<void>) => void;
}

/** Un mouvement d'une chèvre : sortie sans vente (c'est une mort) ou envoi à l'abattoir. */
export function MouvementSimple({ animal, onFait }: Props) {
  const [mouvement, setMouvement] = useState<Mouvement | undefined>(undefined);
  const [date, setDate] = useState(dateDuJour());
  const [enCours, setEnCours] = useState(false);
  const boucle = (animal.numeroBoucle ?? '').trim();

  const valider = async () => {
    if (!mouvement) return;
    setEnCours(true);
    try {
      if (mouvement === 'sortie') {
        const avant = await enregistrerSortieSansVente(animal, date);
        onFait(T.sortieFaite, T.sortieDetail(boucle), () => annulerSortieSansVente(avant));
      } else {
        await envoyerALAbattoir(animal, date);
        onFait(T.abattoirFait, T.abattoirDetail(boucle), () => annulerEnvoiALAbattoir(animal));
      }
    } catch (erreur) {
      Alert.alert(T.erreur, erreur instanceof Error ? erreur.message : String(erreur));
    } finally {
      setEnCours(false);
    }
  };

  const choix: { valeur: Mouvement; libelle: string }[] = [
    { valeur: 'sortie', libelle: T.mouvementSortie },
    { valeur: 'abattoir', libelle: T.mouvementAbattoir },
  ];

  return (
    <View style={commonStyles.flex1}>
      <Text style={commonStyles.cardTitle}>{T.mouvementType}</Text>
      <View style={commonStyles.row}>
        {choix.map(({ valeur, libelle }) => (
          <Pressable
            key={valeur}
            accessibilityRole="button"
            onPress={() => setMouvement(valeur)}
            style={[commonStyles.chip, valeur === mouvement && { backgroundColor: colors.primary }]}
          >
            <Text style={[{ fontWeight: '600', color: colors.text }, valeur === mouvement && commonStyles.textWhite]}>{libelle}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={commonStyles.muted}>{T.mouvementBientot}</Text>

      <DateField label={T.mouvementDate} value={date} onChange={setDate} />

      <Button label={T.mouvementValider} onPress={valider} loading={enCours} disabled={!mouvement} />
    </View>
  );
}
