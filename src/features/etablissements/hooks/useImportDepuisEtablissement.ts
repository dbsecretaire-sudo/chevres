import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { listAutresEtablissements, type Etablissement } from '@/features/etablissements/repository';

interface Options<T> {
  /** Lit, sans les modifier, les éléments d'un autre établissement. */
  lister: (etablissementId: string) => Promise<T[]>;
  /** Copie l'élément dans l'établissement actif ; renvoie undefined s'il y existe déjà (rien n'est copié). */
  copier: (source: T) => Promise<unknown | undefined>;
  /** Message affiché quand l'élément existe déjà dans l'établissement actif. */
  messageDoublon: (source: T) => string;
}

/**
 * Import d'un élément (fournisseur, client…) depuis un autre établissement : liste des autres établissements,
 * dont un seul est déroulé à la fois (ses éléments sont lus à l'ouverture), puis copie de l'élément choisi.
 */
export function useImportDepuisEtablissement<T extends { id: string }>({
  lister,
  copier,
  messageDoublon,
}: Options<T>) {
  const router = useRouter();
  const [autres, setAutres] = useState<Etablissement[]>([]);
  const [ouvertId, setOuvertId] = useState<string | null>(null);
  const [elements, setElements] = useState<T[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    listAutresEtablissements().then(setAutres);
  }, []);

  /** Déroule l'établissement (en repliant le précédent), ou le replie s'il est déjà déroulé. */
  const basculer = async (etablissementId: string) => {
    if (ouvertId === etablissementId) {
      setOuvertId(null);
      return;
    }
    setOuvertId(etablissementId);
    setElements(await lister(etablissementId));
  };

  const importer = async (source: T) => {
    const copie = await copier(source);
    if (!copie) {
      setErreur(messageDoublon(source));
      return;
    }
    router.back();
  };

  return { autres, ouvertId, elements, basculer, importer, erreur, setErreur };
}
