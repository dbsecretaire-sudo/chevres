import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Badge } from '@/components/Badge';
import { ListRow } from '@/components/ListRow';
import { EmptyState } from '@/components/EmptyState';
import { SelectField } from '@/components/SelectField';
import { DateField } from '@/components/DateField';
import { Fab } from '@/components/Fab';
import { colors } from '@/theme/colors';
import { dernieresMisesBasParMere, listChevresVivantes, listChevresHistorique} from '@/storage/repositories';
import type { Chevre } from '@/types/models';
import { formatDateFR } from '@/utils/dates';
import { accordNe, categorieAnimal, libelleChevre, LABEL_CATEGORIE_ANIMAL, statutLabel, type CategorieAnimal } from '@/utils/chevreLabel';
import { statutColors } from '@/theme/colors';

type StatutFiltre = 'vivante' | 'morte' | 'tout';
type CategorieFiltre = 'chevre' | 'bouc' | 'cabrit' | 'tout';

const OPTIONS_STATUT: { value: StatutFiltre; label: string }[] = [
  { value: 'vivante', label: 'Vivantes' },
  { value: 'morte', label: 'Mortes' },
  { value: 'tout', label: 'Toutes' },
];

const OPTIONS_CATEGORIE: { value: CategorieFiltre; label: string }[] = [
  { value: 'chevre', label: 'Chèvres' },
  { value: 'bouc', label: 'Boucs' },
  { value: 'cabrit', label: 'Cabrits' },
  { value: 'tout', label: 'Tous' },
];

const EMPTY_SUBTITLE: Record<CategorieAnimal, string> = {
  chevre: 'Les femelles de 6 mois et plus apparaissent ici.',
  bouc: 'Les mâles de 6 mois et plus apparaissent ici.',
  cabrit: 'Les jeunes de moins de 6 mois (mâles et femelles) apparaissent ici.',
  vivante: 'Tous les animaux vivants apparaissent ici.',
  tout: 'Tous les animaux vivants et morts apparaissent ici',
};

type Tri = 'boucle' | 'naissance' | 'misebas';

const OPTIONS_TRI: { value: Tri; label: string }[] = [
  { value: 'boucle', label: 'N° de boucle' },
  { value: 'naissance', label: 'Date de naissance' },
  { value: 'misebas', label: 'Dernière mise bas' },
];

function compareBoucle(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return a.localeCompare(b);
}

export default function CheptelIndex() {
  const router = useRouter();
  const [chevres, setChevres] = useState<Chevre[]>([]);
  const [misesBas, setMisesBas] = useState<Record<string, string>>({});
  const [recherche, setRecherche] = useState('');
  const [statutFiltre, setStatutFiltre] = useState<StatutFiltre>('vivante');
  const [categorieFiltre, setCategorieFiltre] = useState<CategorieFiltre>('tout');
  const [tri, setTri] = useState<Tri>('boucle');
  const [dateAbattageDebut, setDateAbattageDebut] = useState('');
  const [dateAbattageFin, setDateAbattageFin] = useState('');

  const charger = useCallback(async () => {
    const [vivantes, mortes, misesBasParMere] = await Promise.all([listChevresVivantes(), listChevresHistorique(), dernieresMisesBasParMere()]);
    setChevres([...vivantes, ...mortes]);
    setMisesBas(misesBasParMere);
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const triActif =
    categorieFiltre === 'chevre'
      ? tri
      : tri === 'misebas'
        ? 'boucle'
        : tri;

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();

    const liste = chevres
      // Filtre vivant / mort
      .filter(
        (c) =>
          statutFiltre === 'tout' ||
          c.statut === statutFiltre,
      )
      // Filtre chèvre / bouc / cabrit
      .filter(
        (c) =>
          categorieFiltre === 'tout' ||
          categorieAnimal(c) === categorieFiltre,
      )
      // Recherche
      .filter(
        (c) =>
          !q ||
          (c.numeroBoucle ?? '').toLowerCase().includes(q) ||
          (c.nom ?? '').toLowerCase().includes(q),
      )
      // Date d'abattage (Du / Au)
      .filter((c) => {
        if (!dateAbattageDebut && !dateAbattageFin) return true;
        if (c.statut !== 'abattoir' || !c.dateStatut) return false;
        if (dateAbattageDebut && c.dateStatut < dateAbattageDebut) return false;
        if (dateAbattageFin && c.dateStatut > dateAbattageFin) return false;
        return true;
      });

    return [...liste].sort((a, b) => {
      if (triActif === 'naissance') {
        return a.dateNaissance.localeCompare(b.dateNaissance);
      }

      if (triActif === 'misebas') {
        const da = a.numeroBoucle
          ? misesBas[a.numeroBoucle]
          : undefined;

        const db = b.numeroBoucle
          ? misesBas[b.numeroBoucle]
          : undefined;

        if (!da && !db) {
          return compareBoucle(a.numeroBoucle, b.numeroBoucle);
        }

        if (!da) return 1;
        if (!db) return -1;

        return da.localeCompare(db);
      }

      return compareBoucle(a.numeroBoucle, b.numeroBoucle);
    });
  }, [
    chevres,
    recherche,
    statutFiltre,
    categorieFiltre,
    triActif,
    misesBas,
    dateAbattageDebut,
    dateAbattageFin,
  ]);

  const optionsStatut = OPTIONS_STATUT.map((option) => ({
    ...option,
    label: `${option.label} (${
      option.value === 'tout'
        ? chevres.length
        : chevres.filter((c) => c.statut === option.value).length
    })`,
  }));

  const optionsCategorie = OPTIONS_CATEGORIE.map((option) => ({
    ...option,
    label: `${option.label} (${
      option.value === 'tout'
        ? chevres.filter(
            (c) =>
              statutFiltre === 'tout' ||
              c.statut === statutFiltre,
          ).length
        : chevres.filter(
            (c) =>
              (statutFiltre === 'tout' ||
                c.statut === statutFiltre) &&
              categorieAnimal(c) === option.value,
          ).length
    })`,
  }));

  const emptyTitle =
  categorieFiltre === 'tout'
    ? statutFiltre === 'tout'
      ? 'Aucun animal'
      : `Aucun animal ${statutFiltre === 'vivante' ? 'vivant' : 'mort'}`
    : statutFiltre === 'tout'
      ? `Aucun ${categorieFiltre}`
      : `Aucun ${categorieFiltre} ${
          statutFiltre === 'vivante' ? 'vivant' : 'mort'
        }`;

  return (
    <Screen scroll={false}>
      <View style={styles.filtres}>
        <View style={styles.flex1}>
          <SelectField
            label="Statut"
            value={statutFiltre}
            onChange={setStatutFiltre}
            options={optionsStatut}
          />
        </View>

        <View style={styles.flex1}>
          <SelectField
            label="Catégorie"
            value={categorieFiltre}
            onChange={setCategorieFiltre}
            options={optionsCategorie}
          />
        </View>
      </View>

      <View style={styles.tri}>
        <SelectField
          label="Trier par"
          value={triActif}
          onChange={setTri}
          options={
            categorieFiltre === 'chevre'
              ? OPTIONS_TRI
              : OPTIONS_TRI.filter((o) => o.value !== 'misebas')
          }
        />
      </View>

      <TextInput
        style={styles.search}
        placeholder="Rechercher par n° de boucle ou nom…"
        placeholderTextColor={colors.textMuted}
        value={recherche}
        onChangeText={setRecherche}
      />

      <View style={styles.filtres}>
        <View style={styles.flex1}>
          <DateField label="Date d’abattage — du" value={dateAbattageDebut} onChange={setDateAbattageDebut} />
        </View>
        <View style={styles.flex1}>
          <DateField label="Date d’abattage — au" value={dateAbattageFin} onChange={setDateAbattageFin} />
        </View>
      </View>
      {(!!dateAbattageDebut || !!dateAbattageFin) && (
        <Pressable
          style={styles.effacerDates}
          onPress={() => {
            setDateAbattageDebut('');
            setDateAbattageFin('');
          }}
        >
          <Text style={styles.effacerDatesTexte}>Effacer la date d’abattage</Text>
        </Pressable>
      )}

      <FlatList
        data={filtrees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState title={emptyTitle} subtitle="Aucun animal ne correspond aux filtres sélectionnés." />
        }
        renderItem={({ item }) => (
          <ListRow
            title={libelleChevre(item)}
            subtitle={`${item.sexe === 'F' ? 'Femelle' : 'Mâle'} · ${accordNe(item.sexe)} le ${formatDateFR(item.dateNaissance)}${
              item.mereNumeroBoucle ? ` · Mère : ${item.mereNumeroBoucle}` : ''
            }${
              item.statut === 'abattoir' && item.dateStatut ? ` · Abattu(e) le ${formatDateFR(item.dateStatut)}` : ''
            }`}
            trailing={
            (() => {
              if (item.renouvellement) {
                return <Badge label="Renouvellement" color={colors.primary} />;
              } else if (item.statut !== 'vivante') {
                return (
                  <Badge
                    label={statutLabel(item.statut, item.sexe)}
                    color={statutColors[item.statut]}
                  />
                );
              }

              return undefined;
            })()}
            onPress={() => router.push(`/cheptel/${item.id}`)}
          />
        )}
      />

      <Fab
        options={[{ label: 'Ajouter au cheptel', icon: 'add-circle', onPress: () => router.push('/cheptel/ajout-rapide') }]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filtres: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  flex1: {
    flex: 1,
  },

  tri: {
    paddingHorizontal: 16,
    marginTop: 12,
  },

  search: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    color: colors.text,
  },

  list: {
    padding: 16,
    paddingBottom: 100,
    gap: 10,
  },

  effacerDates: {
    marginHorizontal: 16,
    marginTop: 8,
    alignSelf: 'flex-start',
  },

  effacerDatesTexte: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
