import { useEffect, useState } from 'react';
import { listFournisseurs } from '@/features/fournisseurs/repository';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { SelectField } from '@/shared/components/SelectField';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';
import { categorieFournisseurDe } from '@/shared/dictionnaire/categoriesFournisseur';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.cheptel.lots.contactDuLot;

const nomDuContact = (f: Fournisseur): string => (f.nomEntreprise || f.nom || '').trim();

/**
 * Le contact d'un lot : l'équarrisseur qui a enlevé les animaux morts, ou l'abattoir où ils sont partis (on peut en avoir plusieurs). Le lot se range alors
 * dans les documents de ce contact (le bon d'équarrissage, le document de circulation).
 */
export function ChoixContactDuLot({
  genre,
  valeur,
  onChange,
}: {
  genre: 'equarrissage' | 'abattoir';
  /** L'identifiant du contact choisi ; vide : aucun. */
  valeur: string;
  onChange: (id: string) => void;
}) {
  const [contacts, setContacts] = useState<Fournisseur[]>([]);
  const categorie = genre === 'equarrissage' ? CATEGORIE_FOURNISSEUR.EQUARRISSAGE : CATEGORIE_FOURNISSEUR.ABATTOIR;
  useEffect(() => {
    listFournisseurs()
      .then((tous) =>
        setContacts(
          tous.filter((f) => f.categorie === categorie || categorieFournisseurDe(f.categorie).id === categorie),
        ),
      )
      .catch(() => undefined);
  }, [categorie]);
  return (
    <SelectField<string>
      label={genre === 'equarrissage' ? T.equarrisseur : T.abattoir}
      value={valeur}
      onChange={onChange}
      options={[
        { value: '', label: T.nonPrecise },
        ...contacts.map((f) => ({ value: f.id, label: nomDuContact(f) })),
        // Un contact choisi qui n'existe plus reste visible.
        ...(valeur && !contacts.some((f) => f.id === valeur) ? [{ value: valeur, label: T.contactIntrouvable }] : []),
      ]}
    />
  );
}
