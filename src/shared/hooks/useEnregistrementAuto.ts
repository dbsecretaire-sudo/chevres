import { useEffect, useRef } from 'react';
import { DELAI_ENREGISTREMENT_AUTO } from '@/shared/constants/temps';

interface Options {
  /** Vrai pendant qu'on modifie un enregistrement existant : sinon, rien ne s'enregistre tout seul. */
  actif: boolean;
  /** Ce qu'on a saisi, sous forme de texte : un changement de ce texte déclenche l'enregistrement. */
  signature: string;
  /** Enregistre sans rien afficher ; rend faux quand la saisie n'est pas (encore) valide, elle sera retentée au prochain changement. */
  enregistrer: () => Promise<boolean | void>;
}

/**
 * Enregistre tout seul les modifications d'un formulaire : peu après le dernier changement, et une dernière fois en quittant
 * l'écran. Une saisie incomplète n'est pas perdue pour autant : elle reste à l'écran, et s'enregistre dès qu'elle est valide.
 */
export function useEnregistrementAuto({ actif, signature, enregistrer }: Options): void {
  /** La signature déjà enregistrée (celle du début de la modification, puis celle de chaque enregistrement réussi). */
  const enregistree = useRef<string | null>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const derniere = useRef({ signature, enregistrer, actif });
  useEffect(() => {
    derniere.current = { signature, enregistrer, actif };
  });

  const sauver = async () => {
    minuterie.current = null;
    const { signature: aSauver, enregistrer: faire } = derniere.current;
    if ((await faire()) !== false) enregistree.current = aSauver;
  };

  // Le début de la modification : ce qui est à l'écran est ce qui est enregistré.
  useEffect(() => {
    enregistree.current = actif ? derniere.current.signature : null;
    return () => {
      if (minuterie.current) clearTimeout(minuterie.current);
      minuterie.current = null;
    };
    // La signature de départ est celle de l'ouverture : seul le passage en modification la fixe.
  }, [actif]);

  // Chaque changement relance le compte à rebours.
  useEffect(() => {
    if (!actif || signature === enregistree.current) return;
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(sauver, DELAI_ENREGISTREMENT_AUTO);
  }, [signature, actif]);

  // On quitte l'écran avec une modification en attente : elle s'enregistre tout de suite.
  useEffect(
    () => () => {
      const { actif: modifie, signature: courante } = derniere.current;
      if (modifie && courante !== enregistree.current) sauver();
    },
    [],
  );
}
