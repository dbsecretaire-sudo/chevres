import { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { ListRow } from '@/shared/components/ListRow';
import { EmptyState } from '@/shared/components/EmptyState';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { Fab } from '@/shared/components/Fab';
import { FlecheRetourDepuis } from '@/shared/components/FlecheRetourDepuis';
import { convertirGroupementsEnContacts, lierLesFichesDeMemeNom, listContacts } from '@/features/contacts/repository';
import { useCategoriesContact } from '@/features/contacts/hooks/useCategoriesContact';
import type { Contact } from '@/features/contacts/services/contacts';
import { categorieDuContact } from '@/features/contacts/services/fiche';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.contacts;

/**
 * Les contacts : les clients et les fournisseurs en une seule liste, chacun une fois — avec « Recettes » s'il a une fiche client,
 * « Dépenses » s'il a une fiche fournisseur. Un appui ouvre sa fiche unique (une catégorie, une balance, toutes ses écritures).
 */
export default function ListeContacts() {
  const router = useRouter();
  /** Ouverte depuis un écran en cours : la flèche y ramène. */
  const { retour } = useLocalSearchParams<{ retour?: string }>();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [recherche, setRecherche] = useState('');
  const { categories, idsConnus } = useCategoriesContact();

  /** Ce que dit la ligne d'un contact : recettes et/ou dépenses, sa catégorie (ou « à choisir »), ses coordonnées. */
  const sousTitreDe = (c: Contact): string => {
    const source = c.client ?? c.fournisseur;
    const categorie = categorieDuContact(c, idsConnus);
    return [
      [c.client ? T.recettes : undefined, c.fournisseur ? T.depenses : undefined].filter(Boolean).join(' + '),
      categorie.conflit ? T.categorieAChoisir : categories.find((x) => x.id === categorie.id)?.nom,
      source?.telephone,
      source?.email,
    ]
      .filter(Boolean)
      .join(' · ');
  };
  const aClasser = contacts.filter((c) => categorieDuContact(c, idsConnus).conflit).length;

  useFocusEffect(
    useCallback(() => {
      // Les fiches de même nom se lient d'elles-mêmes avant d'être réunies.
      // Les groupements saisis à la main deviennent des contacts ; les fiches de même nom se lient.
      convertirGroupementsEnContacts()
        .then(lierLesFichesDeMemeNom)
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
        {aClasser > 0 ? <Text style={commonStyles.lineBold}>{T.aClasser(aClasser)}</Text> : null}
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
            onPress={() => router.push(ROUTES.ficheContact(item.cle) as never)}
          />
        )}
      />

      <Fab
        options={[{ label: T.nouveau, icon: 'add', onPress: () => router.push(ROUTES.CONTACT_NOUVEAU as never) }]}
      />
    </Screen>
  );
}
