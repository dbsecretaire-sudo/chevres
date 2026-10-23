import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Contact } from '@/features/contacts/services/contacts';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.contacts;

interface Props {
  contacts: readonly Contact[];
  /** Le nom de la catégorie d'un contact (« à choisir » quand elle est en conflit). */
  categorieDe: (contact: Contact) => string;
}

/**
 * Les contacts en tableau (affichage sobre sur un grand écran) : le nom, la catégorie, le type (recettes, dépenses), le téléphone et le courriel ; on trie d'un clic sur
 * un titre, et un clic ouvre la fiche.
 */
export function TableauContacts({ contacts, categorieDe }: Props) {
  const router = useRouter();
  const colonnes: readonly ColonneDuTableau<Contact>[] = [
    { cle: 'nom', titre: 'Nom', poids: 2.4, valeur: (c) => c.nom },
    { cle: 'categorie', titre: 'Catégorie', poids: 1.8, valeur: categorieDe },
    {
      cle: 'type',
      titre: 'Type',
      poids: 1.3,
      valeur: (c) => [c.client ? T.recettes : undefined, c.fournisseur ? T.depenses : undefined].filter(Boolean).join(' + '),
    },
    { cle: 'telephone', titre: 'Téléphone', poids: 1.4, valeur: (c) => (c.client ?? c.fournisseur)?.telephone ?? '' },
    { cle: 'email', titre: 'E-mail', poids: 2.2, valeur: (c) => (c.client ?? c.fournisseur)?.email ?? '' },
  ];
  return (
    <View style={styles.cadre}>
      <TableauDeDonnees
        colonnes={colonnes}
        lignes={contacts}
        cleDeLaLigne={(c) => c.cle}
        tri={{ cle: 'nom' }}
        vide={T.aucun}
        onLigne={(c) => router.push(ROUTES.ficheContact(c.cle) as never)}
        pied={<Text style={styles.total}>{contacts.length} contact{contacts.length > 1 ? 's' : ''}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cadre: { flex: 1 },
  total: { fontSize: 14, fontWeight: '800', color: colors.text },
});
