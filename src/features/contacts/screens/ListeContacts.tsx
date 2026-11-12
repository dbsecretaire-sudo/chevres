import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { LigneDeBloc } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { EmptyState } from '@/shared/components/EmptyState';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { Fab } from '@/shared/components/Fab';
import { FlecheRetourDepuis } from '@/shared/components/FlecheRetourDepuis';
import {
  convertirGroupementsEnContacts,
  lierLesFichesDeMemeNom,
  listContacts,
} from '@/features/contacts/repository';
import { useCategoriesContact } from '@/features/contacts/hooks/useCategoriesContact';
import type { Contact } from '@/features/contacts/services/contacts';
import { portraitDeTiers } from '@/features/contacts/services/portraitTiers';
import { categorieDuContact } from '@/features/contacts/services/fiche';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { TableauContacts } from '@/features/contacts/components/TableauContacts';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';

const T = TEXTES.contacts;
/** Les puces de catégorie : toutes les catégories, ou celles dont le choix reste à faire. */
const TOUTES = 'toutes';
const A_CHOISIR = 'a-choisir';

/** Un groupe de la liste : sa catégorie (le titre du groupe) et ses contacts. */
interface Groupe {
  titre: string;
  data: Contact[];
}

/**
 * Les contacts : les clients et les fournisseurs en une seule liste, chacun une fois — avec « Recettes » s'il a une fiche client,
 * « Dépenses » s'il a une fiche fournisseur. Un appui ouvre sa fiche unique (une catégorie, une balance, toutes ses écritures).
 * Les catégories se choisissent en pastilles au-dessus de la liste ; « Toutes » regroupe les contacts par catégorie.
 */
export default function ListeContacts() {
  const router = useRouter();
  // Affichage sobre sur un grand écran : les contacts en tableau.
  const comptable = useDispositionComptable();
  /** Ouverte depuis un écran en cours : la flèche y ramène. */
  const { retour } = useLocalSearchParams<{ retour?: string }>();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [recherche, setRecherche] = useState('');
  /** La catégorie choisie en puce (rien : toutes ; `A_CHOISIR` : les contacts dont la catégorie est à choisir). */
  const [categorieChoisie, setCategorieChoisie] = useState(TOUTES);
  /** La feuille des catégories est-elle ouverte ? */
  const [choixOuvert, setChoixOuvert] = useState(false);
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
  /** La catégorie d'un contact pour les puces (celles à choisir ensemble). */
  const cleCategorieDe = (c: Contact): string => {
    const categorie = categorieDuContact(c, idsConnus);
    return categorie.conflit ? A_CHOISIR : (categorie.id ?? A_CHOISIR);
  };
  /** Les puces : « Toutes », puis chaque catégorie qui a des contacts (avec leur nombre). */
  const puces = [
    { valeur: TOUTES, label: T.toutesLesCategories(contacts.length) },
    ...categories
      .map((x) => ({
        valeur: x.id,
        label: `${x.nom} (${contacts.filter((c) => cleCategorieDe(c) === x.id).length})`,
        n: contacts.filter((c) => cleCategorieDe(c) === x.id).length,
      }))
      .filter((p) => p.n > 0)
      .map(({ valeur, label }) => ({ valeur, label })),
    ...(aClasser > 0 ? [{ valeur: A_CHOISIR, label: T.categorieAChoisirPuce(aClasser) }] : []),
  ];

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
    const deLaCategorie =
      categorieChoisie === TOUTES ? contacts : contacts.filter((c) => cleCategorieDe(c) === categorieChoisie);
    if (!q) return deLaCategorie;
    return deLaCategorie.filter((c) =>
      [
        c.nom,
        c.client?.telephone,
        c.client?.email,
        c.fournisseur?.telephone,
        c.fournisseur?.email,
        c.fournisseur?.nom,
      ].some((v) => v?.toLowerCase().includes(q)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts, recherche, categorieChoisie, idsConnus]);

  // Toutes les catégories : la liste est regroupée par catégorie (un titre par groupe). Une catégorie choisie : une seule liste, sans titre.
  const groupes: Groupe[] =
    categorieChoisie !== TOUTES
      ? [{ titre: '', data: filtres }]
      : [
          ...categories.map((x) => ({ titre: x.nom, data: filtres.filter((c) => cleCategorieDe(c) === x.id) })),
          { titre: T.categorieAChoisir, data: filtres.filter((c) => cleCategorieDe(c) === A_CHOISIR) },
        ].filter((g) => g.data.length > 0);

  return (
    <Screen scroll={false}>
      <FlecheRetourDepuis retour={retour} />
      {/* Le haut : le problème à classer, la recherche, et les catégories en pastilles. */}
      <View style={{ paddingHorizontal: 16, paddingTop: 0, gap: 8 }}>
        {aClasser > 0 ? <Text style={commonStyles.lineBold}>{T.aClasser(aClasser)}</Text> : null}
        <ChampRecherche value={recherche} onChangeText={setRecherche} placeholder={T.recherche} />
        {puces.length > 2 ? (
          // Une seule ligne : la catégorie choisie. Un appui ouvre la liste des catégories, avec leur nombre de contacts.
          <Pressable onPress={() => setChoixOuvert(true)} accessibilityRole="button" accessibilityLabel="Choisir une catégorie" style={styles.selecteur}>
            <Text style={styles.selecteurTexte} numberOfLines={1}>
              {puces.find((p) => p.valeur === categorieChoisie)?.label ?? T.toutesLesCategories(contacts.length)}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>

      {comptable ? (
        <TableauContacts
          contacts={filtres}
          categorieDe={(c) => {
            const categorie = categorieDuContact(c, idsConnus);
            return categorie.conflit ? T.categorieAChoisir : (categories.find((x) => x.id === categorie.id)?.nom ?? '');
          }}
        />
      ) : (
        <SectionList
          sections={groupes}
          keyExtractor={(item) => item.cle}
          contentContainerStyle={[commonStyles.listeBlocAvecFab, { paddingHorizontal: 16 }]}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={<EmptyState title={T.aucun} subtitle={T.aucunSousTitre} />}
          renderSectionHeader={({ section }) =>
            section.titre ? (
              <Text style={styles.titreGroupe}>
                {section.titre} · {section.data.length}
              </Text>
            ) : null
          }
          renderItem={({ item, index, section }) => (
            <LigneDeBloc index={index} total={section.data.length}>
              <ListRow
                title={item.nom}
                subtitle={sousTitreDe(item) || undefined}
                emoji={portraitDeTiers(categorieDuContact(item, idsConnus).id).emoji}
                onPress={() => router.push(ROUTES.ficheContact(item.cle) as never)}
              />
            </LigneDeBloc>
          )}
        />
      )}

      {/* La liste des catégories, en feuille du bas : un appui choisit, et la feuille se ferme. */}
      <Modal visible={choixOuvert} transparent animationType="fade" onRequestClose={() => setChoixOuvert(false)}>
        <Pressable style={styles.fond} onPress={() => setChoixOuvert(false)} accessibilityLabel={TEXTES.commun.general.fermer}>
          <Pressable style={styles.feuille} onPress={() => undefined}>
            <Text style={styles.feuilleTitre}>Catégorie</Text>
            <ScrollView>
              {puces.map((p) => {
                const choisie = p.valeur === categorieChoisie;
                return (
                  <Pressable
                    key={p.valeur}
                    onPress={() => {
                      setCategorieChoisie(p.valeur);
                      setChoixOuvert(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: choisie }}
                    style={[styles.ligne, choisie && styles.ligneChoisie]}
                  >
                    <Text style={[styles.ligneTexte, choisie && styles.ligneTexteChoisi]}>{p.label}</Text>
                    {choisie ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Fab
        options={[
          { label: T.nouveau, icon: 'add', onPress: () => router.push(ROUTES.CONTACT_NOUVEAU as never) },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  selecteur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.blanc,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selecteurTexte: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  fond: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  feuille: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    maxHeight: '70%',
  },
  feuilleTitre: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 8 },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  ligneChoisie: { backgroundColor: '#E4EEDF' },
  ligneTexte: { fontSize: 15, color: colors.text },
  ligneTexteChoisi: { fontWeight: '700', color: colors.primary },
  titreGroupe: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
});
