import { useEffect, useState } from 'react';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { SelectField } from '@/shared/components/SelectField';
import { nomComplet } from '@/shared/utils/personne';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.cheptel.lots.depart.acheteur;

/** Les clients de l'exploitation (le nom de chacun) : de quoi nommer l'acheteur d'un départ d'animaux vivants. */
export function useClientsDuDepart(): Client[] {
  const [clients, setClients] = useState<Client[]>([]);
  useEffect(() => {
    listClients()
      .then(setClients)
      .catch(() => undefined);
  }, []);
  return clients;
}

/**
 * L'acheteur d'un départ d'animaux vivants : le client qui les a achetés (sa fiche). Le document de circulation du départ se range alors dans ses documents, et non dans ceux
 * d'un abattoir ; le départ peut rester sans acheteur tant qu'il n'est pas connu.
 */
export function ChoixAcheteurDuDepart({ valeur, onChange }: { valeur: string; onChange: (id: string) => void }) {
  const clients = useClientsDuDepart();
  return (
    <SelectField<string>
      label={T.titre}
      value={valeur}
      onChange={onChange}
      searchable
      placeholder={T.nonPrecise}
      options={[
        { value: '', label: T.nonPrecise },
        ...clients.map((c) => ({ value: c.id, label: nomComplet(c) })),
        // Un client choisi qui n'existe plus reste visible.
        ...(valeur && !clients.some((c) => c.id === valeur) ? [{ value: valeur, label: T.introuvable }] : []),
      ]}
    />
  );
}
