import { useEffect, useRef, useState } from 'react';
import { useNavigation } from 'expo-router';

/**
 * Quitter un formulaire de création avec une saisie non enregistrée demande confirmation (« Quitter sans enregistrer ? »), qu'on
 * quitte par la flèche, le geste du retour ou le bouton Annuler. `modifie` dit si la saisie n'est pas vide. L'écran affiche la
 * confirmation avec `enAttente` ; `quitter` quitte pour de bon, `rester` ferme la confirmation.
 */
export function useConfirmerSortie(modifie: boolean) {
  const navigation = useNavigation();
  const [enAttente, setEnAttente] = useState(false);
  /** L'action de sortie interceptée, à rejouer si l'on confirme. */
  const action = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);
  /** Vrai une fois confirmé : la sortie rejouée ne doit pas être interceptée une seconde fois. */
  const confirmee = useRef(false);

  useEffect(() => {
    if (!modifie) return;
    return navigation.addListener('beforeRemove', (e) => {
      if (confirmee.current) return;
      e.preventDefault();
      action.current = e.data.action;
      setEnAttente(true);
    });
  }, [navigation, modifie]);

  const quitter = () => {
    setEnAttente(false);
    if (!action.current) return;
    confirmee.current = true;
    navigation.dispatch(action.current);
  };

  const rester = () => setEnAttente(false);

  /** Après un enregistrement réussi, l'écran quitte sans demander : la saisie n'est plus perdue. */
  const laisserPartir = () => {
    confirmee.current = true;
  };

  return { enAttente, quitter, rester, laisserPartir };
}
