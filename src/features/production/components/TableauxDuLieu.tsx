import type { Contact } from '@/features/contacts/services/contacts';
import { COLONNES_ECRITURES } from '@/features/comptabilite/components/TableauEcritures';
import type { Transaction } from '@/features/comptabilite/services/transactions';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { SOURCE_TRANSACTION } from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

/** Les tableaux d'une page de lieu (poste de comptabilité) : ses intervenants et ses écritures, sans recherche ni totaux (la page a les siens). Les boutons d'ajout sont dessous. */

const T = TEXTES.contacts;

/** Les intervenants d'un lieu : le nom, la catégorie, le téléphone et le courriel ; un clic ouvre la fiche. */
export function TableauTiersDuLieu({
  tiers,
  categorieDe,
  ouvrir,
  vide,
}: {
  tiers: readonly Contact[];
  categorieDe: (contact: Contact) => string;
  ouvrir: (route: string) => void;
  vide: string;
}) {
  const colonnes: readonly ColonneDuTableau<Contact>[] = [
    { cle: 'nom', titre: 'Nom', poids: 2.4, valeur: (c) => c.nom },
    { cle: 'categorie', titre: 'Catégorie', poids: 1.8, valeur: categorieDe },
    { cle: 'type', titre: 'Type', poids: 1.3, valeur: (c) => [c.client ? T.recettes : undefined, c.fournisseur ? T.depenses : undefined].filter(Boolean).join(' + ') },
    { cle: 'telephone', titre: 'Téléphone', poids: 1.4, valeur: (c) => (c.client ?? c.fournisseur)?.telephone ?? '' },
    { cle: 'email', titre: 'E-mail', poids: 2.2, valeur: (c) => (c.client ?? c.fournisseur)?.email ?? '' },
  ];
  return (
    <TableauDeDonnees
      integre
      colonnes={colonnes}
      lignes={tiers}
      cleDeLaLigne={(c) => c.cle}
      tri={{ cle: 'nom' }}
      vide={vide}
      onLigne={(c) => ouvrir(ROUTES.ficheContact(c.cle))}
    />
  );
}

/** Les écritures d'un lieu : la date, le libellé, le détail, le débit et le crédit ; un clic ouvre la fiche. */
export function TableauEcrituresDuLieu({ ecritures, ouvrir, vide }: { ecritures: readonly Transaction[]; ouvrir: (route: string) => void; vide: string }) {
  const colonnes = COLONNES_ECRITURES.filter((c) => ['date', 'libelle', 'detail', 'debit', 'credit'].includes(c.cle));
  return (
    <TableauDeDonnees
      integre
      colonnes={colonnes}
      lignes={ecritures}
      cleDeLaLigne={(t) => `${t.id}:${t.activite}`}
      tri={{ cle: 'date', decroissant: true }}
      vide={vide}
      onLigne={(t) => ouvrir(t.source === SOURCE_TRANSACTION.FACTURE ? ROUTES.ficheFacture(t.id) : ROUTES.ficheVente(t.id))}
    />
  );
}
