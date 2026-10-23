import { useMemo } from 'react';
import { Pressable, Text } from 'react-native';
import { entreeDuContact } from '@/features/contacts/components/DossiersDuContact';
import type { Contact } from '@/features/contacts/services/contacts';
import { dossiersEnfants, nombreDeContenus } from '@/features/exploitation/services/dossiersDeContenus';
import type { Controle, DossierDeContenus } from '@/features/exploitation/types';
import { COLONNES_ECRITURES } from '@/features/comptabilite/components/TableauEcritures';
import type { Transaction } from '@/features/comptabilite/services/transactions';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { SOURCE_TRANSACTION } from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';

/** Les tableaux d'une page de lieu (poste de comptabilité) : ses intervenants et ses écritures, sans recherche ni totaux (la page a les siens). Les boutons d'ajout sont dessous. */


/** Une ligne du tableau des intervenants : un dossier de l'intervenant, ou l'intervenant seul quand il n'en a pas. */
interface LigneTiers {
  id: string;
  tiers: Contact;
  dossier?: DossierDeContenus;
  contenus?: number;
}

/**
 * Les intervenants d'un lieu : le nom (lien vers la fiche), le dossier, le nombre de contenus, la catégorie, le téléphone et le courriel. Les dossiers d'un intervenant sont groupés avec lui,
 * une ligne chacun (comme les contrats sous leur assureur) ; un clic sur la ligne ouvre le dossier, ou la fiche de l'intervenant qui n'en a pas.
 */
export function TableauTiersDuLieu({
  tiers,
  controles,
  categorieDe,
  ouvrir,
  vide,
}: {
  tiers: readonly Contact[];
  /** Les contenus rangés des partenaires : les dossiers de chaque intervenant en viennent. */
  controles: readonly Controle[];
  categorieDe: (contact: Contact) => string;
  ouvrir: (route: string) => void;
  vide: string;
}) {
  const lignes = useMemo<LigneTiers[]>(
    () =>
      tiers.flatMap((c) => {
        const entree = entreeDuContact(controles, c);
        const dossiers = dossiersEnfants(entree?.dossiers);
        return entree && dossiers.length > 0
          ? dossiers.map((dossier) => ({ id: `${c.cle}:${dossier.id}`, tiers: c, dossier, contenus: nombreDeContenus(entree, dossier.id) }))
          : [{ id: c.cle, tiers: c }];
      }),
    [tiers, controles],
  );
  const colonnes: readonly ColonneDuTableau<LigneTiers>[] = [
    {
      cle: 'nom',
      titre: 'Nom',
      poids: 2.2,
      valeur: (l) => l.tiers.nom,
      rendu: (l) => (
        <Pressable onPress={() => ouvrir(ROUTES.ficheContact(l.tiers.cle))} accessibilityRole="link">
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primaryDark, textDecorationLine: 'underline' }} numberOfLines={2}>
            {l.tiers.nom}
          </Text>
        </Pressable>
      ),
    },
    { cle: 'dossier', titre: 'Dossier', poids: 2.2, valeur: (l) => l.dossier?.nom ?? '' },
    { cle: 'contenus', titre: 'Contenus', poids: 1, aligne: 'centre', valeur: (l) => l.contenus ?? 0, texte: (l) => (l.dossier ? String(l.contenus ?? 0) : '') },
    { cle: 'categorie', titre: 'Catégorie', poids: 1.6, valeur: (l) => categorieDe(l.tiers) },
    { cle: 'telephone', titre: 'Téléphone', poids: 1.4, valeur: (l) => (l.tiers.client ?? l.tiers.fournisseur)?.telephone ?? '' },
    { cle: 'email', titre: 'E-mail', poids: 2, valeur: (l) => (l.tiers.client ?? l.tiers.fournisseur)?.email ?? '' },
  ];
  return (
    <TableauDeDonnees
      integre
      colonnes={colonnes}
      lignes={lignes}
      cleDeLaLigne={(l) => l.id}
      tri={{ cle: 'nom' }}
      vide={vide}
      onLigne={(l) => ouvrir(l.dossier ? ROUTES.contactDossier(l.tiers.cle, l.dossier.id) : ROUTES.ficheContact(l.tiers.cle))}
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
