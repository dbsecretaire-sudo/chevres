import { useCallback, useState } from 'react';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';

/** Ce que les écrans ont gardé, par établissement : il survit à la sortie de l'écran, pas à la fermeture de l'application. */
const conserve = new Map<string, unknown>();

/**
 * Comme `useState`, mais la valeur est gardée quand on quitte l'écran : en y revenant, la recherche ou le filtre est toujours là.
 * `cle` nomme la valeur (une par écran et par champ) ; chaque établissement a la sienne.
 */
export function useEtatConserve<T>(cle: string, initial: T): [T, (valeur: T | ((actuelle: T) => T)) => void] {
  const { actif } = useEtablissement();
  const cleComplete = `${actif.id}:${cle}`;
  const [valeur, setValeur] = useState<T>(() =>
    conserve.has(cleComplete) ? (conserve.get(cleComplete) as T) : initial,
  );

  const changer = useCallback(
    (nouvelle: T | ((actuelle: T) => T)) =>
      setValeur((actuelle) => {
        const suivante = typeof nouvelle === 'function' ? (nouvelle as (a: T) => T)(actuelle) : nouvelle;
        conserve.set(cleComplete, suivante);
        return suivante;
      }),
    [cleComplete],
  );

  return [valeur, changer];
}
