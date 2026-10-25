import { useEffect, useState } from 'react';
import { lireAEnvoyer, surAEnvoyer } from '@/shared/storage/aEnvoyer';

/** Le nombre de saisies du mode normal pas encore envoyées sur Drive, tenu à jour (voir aEnvoyer). */
export function useAEnvoyer(): number {
  const [nombre, setNombre] = useState(0);
  useEffect(() => {
    let actif = true;
    lireAEnvoyer().then((n) => actif && setNombre(n));
    const arreter = surAEnvoyer(setNombre);
    return () => {
      actif = false;
      arreter();
    };
  }, []);
  return nombre;
}
