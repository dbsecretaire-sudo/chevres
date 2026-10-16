import { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { ListRow } from '@/shared/components/ListRow';
import { EmptyState } from '@/shared/components/EmptyState';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { Fab } from '@/shared/components/Fab';
import { FlecheRetourDepuis } from '@/shared/components/FlecheRetourDepuis';
import { lierLesFichesDeMemeNom, listContacts } from '@/features/contacts/repository';
import type { Contact } from '@/features/contacts/services/contacts';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.contacts;

/** Ce que dit la ligne d'un contact : s'il reçoit des recettes (client), fait des dépenses (fournisseur), ses coordonnées. */
const sousTitreDe = (c: Contact): string => {
  const source = c.client ?? c.fournisseur;
  return [
    [c.client ? T.recettes : undefined, c.fournisseur ? T.depenses : undefined].filter(Boolean).join(' + '),
    source?.telephone,
    source?.email,
  ]
    .filter(Boolean)
    .join(' · ');
};

/**
 * Les contacts : les clients et les fournisseurs en une seule liste, chacun une fois — avec « Recettes » s'il a une fiche client,
 * « Dépenses » s'il a une fiche fournisseur. Un appui ouvre sa fiche ; l'autre côté s'y ouvre ou s'y ajoute.
 */
export default function ListeContacts() {
  const router = useRouter();
  /** Ouverte depuis un écran en cours : la flèche y ramène. */
  const { retour } = useLocalSearchParams<{ retour?: string }>();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [recherche, setRecherche] = useState('');

  useFocusEffect(
    useCallback(() => {
      // Les fiches de même nom se lient d'elles-mêmes avant d'être réunies.
      lierLesFichesDeMemeNom()
        .then(listContacts)
        .then(setContacts)
        .catch(() => undefined);
    }, []),
  );

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      [c.nom, c.client?.telephone, c.client?.email, c.fournisseur?.telephone, c.fournisseur?.email, c.fournisseur?.nom].some((v) =>
        v?.toLowerCase().includes(q),
      ),
    );
  }, [contacts, recherche]);

  return (
    <Screen scroll={false}>
      <FlecheRetourDepuis retour={retour} />
      <View style={commonStyles.topPadded}>
        <Text style={commonStyles.note}>{T.aide}</Text>
        <ChampRecherche value={recherche} onChangeText={setRecherche} placeholder={T.recherche} />
      </View>

      <FlatList
        data={filtres}
        keyExtractor={(item) => item.cle}
        contentContainerStyle={commonStyles.listFab}
        ListEmptyComponent={<EmptyState title={T.aucun} subtitle={T.aucunSousTitre} />}
        renderItem={({ item }) => (
          <ListRow
            title={item.nom}
            subtitle={sousTitreDe(item) || undefined}
            onPress={() =>
              router.push(
                (item.client ? ROUTES.ficheClient(item.client.id) : ROUTES.ficheFournisseur(item.fournisseur!.id)) as never,
              )
            }
          />
        )}
      />

      <Fab
        options={[
          { label: T.nouveauClient, icon: 'add', onPress: () => router.push(ROUTES.CLIENT_NOUVEAU as never) },
          {
            label: T.nouveauFournisseur,
            icon: 'add',
            onPress: () => router.push(ROUTES.FOURNISSEUR_NOUVEAU as never),
          },
        ]}
      />
    </Screen>
  );
}
