import { useMemo } from 'react';
import { Pressable, Text } from 'react-native';
import { contratsDe } from '@/features/fournisseurs/services/contratsAssureur';
import type { Contact } from '@/features/contacts/services/contacts';
import type { ContratAssureur } from '@/features/fournisseurs/types';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.contacts.contrat.tableau;

/** Une ligne du tableau : un contrat avec son assureur, ou un assureur qui n'a encore aucun contrat. */
interface LigneAssurance {
  id: string;
  assureur: Contact;
  contrat?: ContratAssureur;
}

const coordonnee = (c: Contact, champ: 'telephone' | 'email') => (c.client ?? c.fournisseur)?.[champ] ?? '';

/**
 * Les assureurs et leurs contrats en tableau (poste de comptabilité) : une ligne par contrat, avec l'assureur et ses coordonnées ; un assureur sans contrat a sa ligne
 * quand même. Un clic sur la ligne ouvre le contrat ; le nom de l'assureur ouvre sa fiche.
 */
export function TableauAssurance({ assureurs, ouvrir }: { assureurs: Contact[]; ouvrir: (route: string) => void }) {
  const lignes = useMemo<LigneAssurance[]>(
    () =>
      assureurs.flatMap((assureur) => {
        const contrats = contratsDe(assureur.fournisseur);
        return contrats.length > 0
          ? contrats.map((contrat) => ({ id: `${assureur.cle}:${contrat.id}`, assureur, contrat }))
          : [{ id: assureur.cle, assureur }];
      }),
    [assureurs],
  );
  const colonnes: ColonneDuTableau<LigneAssurance>[] = [
    {
      cle: 'assureur',
      titre: T.assureur,
      poids: 2,
      valeur: (l) => l.assureur.nom,
      // Le nom est un lien vers la fiche de l'assureur (le reste de la ligne ouvre le contrat).
      rendu: (l) => (
        <Pressable onPress={() => ouvrir(ROUTES.ficheContact(l.assureur.cle))} accessibilityRole="link">
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primaryDark, textDecorationLine: 'underline' }} numberOfLines={2}>
            {l.assureur.nom}
          </Text>
        </Pressable>
      ),
    },
    { cle: 'contrat', titre: T.contrat, poids: 2, valeur: (l) => l.contrat?.denomination ?? '' },
    { cle: 'numero', titre: T.numero, poids: 2, valeur: (l) => l.contrat?.numero ?? '' },
    { cle: 'telephone', titre: T.telephone, valeur: (l) => coordonnee(l.assureur, 'telephone') },
    { cle: 'email', titre: T.email, poids: 2, valeur: (l) => coordonnee(l.assureur, 'email') },
  ];
  return (
    <TableauDeDonnees
      integre
      colonnes={colonnes}
      lignes={lignes}
      cleDeLaLigne={(l) => l.id}
      vide={T.aucun}
      tri={{ cle: 'assureur' }}
      onLigne={(l) => ouvrir(l.contrat ? ROUTES.contratAssureur({ id: l.contrat.id }) : ROUTES.ficheContact(l.assureur.cle))}
    />
  );
}
