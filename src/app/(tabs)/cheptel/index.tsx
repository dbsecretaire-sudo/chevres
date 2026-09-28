import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/ScreenList';
import { Badge } from '@/components/Badge';
import { ListRow } from '@/components/ListRow';
import { EmptyState } from '@/components/EmptyState';
import { SelectField } from '@/components/SelectField';
import { DateField } from '@/components/DateField';
import { FormField } from '@/components/FormField';
import { Fab } from '@/components/Fab';
import { colors, statutColors } from '@/theme/colors';
import { dernieresMisesBasParMere, listChevresVivantes, listChevresHistorique} from '@/storage/repositories';
import type { Chevre } from '@/types/models';
import { formatDateFR, yearOf } from '@/utils/dates';
import { afficherBadgeRenouvellement, categorieAnimal, libelleChevre, statutLabel } from '@/utils/chevreLabel';

type StatutFiltre = 'vivante' | 'morte' | 'abattoir' | 'vendue' | 'autoconsommee' | 'mortne' | 'sorties' | 'tout';
type CategorieFiltre = 'chevre' | 'bouc' | 'cabrit' | 'sansboucle' | 'tout';

const OPTIONS_STATUT: { value: StatutFiltre; label: string }[] = [
  { value: 'vivante', label: 'Vivantes' },
  { value: 'morte', label: 'Mortes' },
  { value: 'abattoir', label: 'Abattoir' },
  { value: 'vendue', label: 'Vendues' },
  { value: 'autoconsommee', label: 'Auto-consommées' },
  { value: 'mortne', label: 'Mort-nées' },
  { value: 'sorties', label: 'Toutes sorties' },
  { value: 'tout', label: 'Toutes' },
];

const LABEL_STATUT_VIDE: Record<StatutFiltre, string> = {
  vivante: 'vivant',
  morte: 'mort',
  abattoir: 'envoyé à l’abattoir',
  vendue: 'vendu',
  autoconsommee: 'auto-consommé',
  mortne: 'mort-né',
  sorties: 'sorti',
  tout: '',
};

const OPTIONS_CATEGORIE: { value: CategorieFiltre; label: string }[] = [
  { value: 'chevre', label: 'Chèvres' },
  { value: 'bouc', label: 'Boucs' },
  { value: 'cabrit', label: 'Cabris' },
  { value: 'sansboucle', label: 'Sans boucle' },
  { value: 'tout', label: 'Tous' },
];

const LABEL_CATEGORIE_FILTRE: Record<CategorieFiltre, string> = {
  chevre: 'chèvre',
  bouc: 'bouc',
  cabrit: 'cabri',
  sansboucle: 'animal sans boucle',
  tout: 'animal',
};

/** Un animal correspond à cette catégorie de filtre (âge/sexe, ou absence de boucle). */
function matchCategorie(c: Chevre, filtre: CategorieFiltre): boolean {
  if (filtre === 'tout') return true;
  if (filtre === 'sansboucle') return !c.numeroBoucle;
  return categorieAnimal(c) === filtre;
}

type Tri = 'boucle' | 'naissance' | 'misebas' | 'abattoir' | 'morte' | 'renouvellement' | 'annee';

const OPTIONS_TRI: { value: Tri; label: string }[] = [
  { value: 'boucle', label: 'N° de boucle' },
  { value: 'naissance', label: 'Date de naissance' },
  { value: 'misebas', label: 'Dernière mise bas' },
  { value: 'abattoir', label: 'Abattoir' },
  { value: 'morte', label: 'Morte' },
  { value: 'annee', label: 'Année (présent sur l’exploitation)' },
  { value: 'renouvellement', label: 'Renouvellement' },
];

/**
 * Présent sur l'exploitation durant cette année : né avant ou pendant, et encore vivant à cette
 * date ou sorti pendant/après (ex : né en 2022, mort en août 2024 → présent en 2022, 2023 et 2024).
 */
function chevrePresenteAnnee(c: Chevre, annee: number): boolean {
  if (yearOf(c.dateNaissance) > annee) return false;
  if (c.statut === 'vivante') return true;
  if (!c.dateStatut) return true;
  return yearOf(c.dateStatut) >= annee;
}

/** « Toutes sorties » couvre tous les statuts de sortie (morte, abattoir, vendue, auto-consommée, mort-né) ; les autres valeurs correspondent chacune à un statut précis. */
function matchStatut(c: Chevre, filtre: StatutFiltre): boolean {
  if (filtre === 'tout') return true;
  if (filtre === 'sorties') return c.statut !== 'vivante';
  return c.statut === filtre;
}

/** Recherche large : toutes les infos affichables de la fiche, pas seulement boucle/nom. */
function chevreCorrespond(c: Chevre, q: string): boolean {
  if (!q) return true;
  const champs: (string | undefined)[] = [
    c.numeroBoucle,
    c.nom,
    c.mereNumeroBoucle,
    c.notes,
    c.sexe === 'F' ? 'femelle' : 'mâle',
    statutLabel(c.statut, c.sexe),
    c.dateNaissance,
    formatDateFR(c.dateNaissance),
    c.dateStatut,
    formatDateFR(c.dateStatut),
    c.dateBouclage,
    formatDateFR(c.dateBouclage),
    c.renouvellement ? `renouvellement ${c.renouvellementAnnee ?? ''}` : undefined,
  ];
  return champs.some((v) => (v ?? '').toLowerCase().includes(q));
}

function compareBoucle(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return a.localeCompare(b);
}

/** Compare deux clés facultatives (date, année…) : absentes reléguées en fin de liste, égalité = 0 (départagée ensuite par la boucle). */
function compareOptionnel<K>(ak: K | undefined, bk: K | undefined, cmp: (a: K, b: K) => number): number {
  if (ak === undefined && bk === undefined) return 0;
  if (ak === undefined) return 1;
  if (bk === undefined) return -1;
  return cmp(ak, bk);
}

export default function CheptelIndex() {
  const router = useRouter();
  const [chevres, setChevres] = useState<Chevre[]>([]);
  const [misesBas, setMisesBas] = useState<Record<string, string>>({});
  const [recherche, setRecherche] = useState('');
  const [statutFiltre, setStatutFiltre] = useState<StatutFiltre>('vivante');
  const [categorieFiltre, setCategorieFiltre] = useState<CategorieFiltre>('tout');
  const [tri, setTri] = useState<Tri>('boucle');
  const [dateAbattoirDebut, setDateAbattoirDebut] = useState('');
  const [dateAbattoirFin, setDateAbattoirFin] = useState('');
  const [dateNaissanceDebut, setDateNaissanceDebut] = useState('');
  const [dateNaissanceFin, setDateNaissanceFin] = useState('');
  const [anneeMorte, setAnneeMorte] = useState('');
  const [anneeRenouv, setAnneeRenouv] = useState('');
  const [anneePresence, setAnneePresence] = useState('');

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
      // Filtre vivant / mort — ignoré pour Année (couvre vivant ET sorti), Morte et Abattoir (le tri
      // impose déjà un statut précis ; le filtre Statut par défaut sur « Vivantes » les viderait sinon).
      .filter((c) => ['annee', 'morte', 'abattoir'].includes(triActif) || matchStatut(c, statutFiltre))
      // Filtre chèvre / bouc / cabrit / sans boucle
      .filter((c) => matchCategorie(c, categorieFiltre))
      // Recherche : tous les champs affichables de la fiche
      .filter((c) => chevreCorrespond(c, q))
      // Plage Du/Au — uniquement quand le tri correspondant est actif (champs cachés sinon)
      .filter((c) => {
        if (triActif === 'abattoir') {
          if (c.statut !== 'abattoir') return false;
          if (!dateAbattoirDebut && !dateAbattoirFin) return true;
          if (!c.dateStatut) return false;
          if (dateAbattoirDebut && c.dateStatut < dateAbattoirDebut) return false;
          if (dateAbattoirFin && c.dateStatut > dateAbattoirFin) return false;
          return true;
        }
        if (triActif === 'morte') {
          if (c.statut !== 'morte') return false;
          if (!anneeMorte.trim()) return true;
          return !!c.dateStatut && yearOf(c.dateStatut) === Number(anneeMorte);
        }
        if (triActif === 'renouvellement') {
          if (!anneeRenouv.trim()) return true;
          return !!c.renouvellement && c.renouvellementAnnee === Number(anneeRenouv);
        }
        if (triActif === 'annee') {
          if (!anneePresence.trim()) return true;
          return chevrePresenteAnnee(c, Number(anneePresence));
        }
        if (triActif === 'naissance') {
          if (!dateNaissanceDebut && !dateNaissanceFin) return true;
          if (dateNaissanceDebut && c.dateNaissance < dateNaissanceDebut) return false;
          if (dateNaissanceFin && c.dateNaissance > dateNaissanceFin) return false;
          return true;
        }
        return true;
      });

    // Chaque tri applique son propre critère, puis départage systématiquement par n° de boucle
    // croissant (y compris à égalité de date/année, ou quand aucun critère spécifique ne s'applique).
    return [...liste].sort((a, b) => {
      let cmp = 0;

      if (triActif === 'naissance') {
        cmp = a.dateNaissance.localeCompare(b.dateNaissance);
      } else if (triActif === 'misebas') {
        const da = a.numeroBoucle ? misesBas[a.numeroBoucle] : undefined;
        const db = b.numeroBoucle ? misesBas[b.numeroBoucle] : undefined;
        cmp = compareOptionnel(da, db, (x, y) => x.localeCompare(y));
      } else if (triActif === 'abattoir') {
        const da = a.statut === 'abattoir' ? a.dateStatut : undefined;
        const db = b.statut === 'abattoir' ? b.dateStatut : undefined;
        cmp = compareOptionnel(da, db, (x, y) => x.localeCompare(y));
      } else if (triActif === 'morte') {
        const da = a.statut === 'morte' ? a.dateStatut : undefined;
        const db = b.statut === 'morte' ? b.dateStatut : undefined;
        cmp = compareOptionnel(da, db, (x, y) => x.localeCompare(y));
      } else if (triActif === 'renouvellement') {
        const da = a.renouvellement ? a.renouvellementAnnee : undefined;
        const db = b.renouvellement ? b.renouvellementAnnee : undefined;
        cmp = compareOptionnel(da, db, (x, y) => x - y);
      }

      return cmp !== 0 ? cmp : compareBoucle(a.numeroBoucle, b.numeroBoucle);
    });
  }, [
    chevres,
    recherche,
    statutFiltre,
    categorieFiltre,
    triActif,
    misesBas,
    dateAbattoirDebut,
    dateAbattoirFin,
    dateNaissanceDebut,
    dateNaissanceFin,
    anneeMorte,
    anneeRenouv,
    anneePresence,
  ]);

  const optionsStatut = OPTIONS_STATUT.map((option) => ({
    ...option,
    label: `${option.label} (${
      option.value === 'tout' ? chevres.length : chevres.filter((c) => matchStatut(c, option.value)).length
    })`,
  }));

  const optionsCategorie = OPTIONS_CATEGORIE.map((option) => ({
    ...option,
    label: `${option.label} (${
      chevres.filter((c) => matchStatut(c, statutFiltre) && matchCategorie(c, option.value)).length
    })`,
  }));

  const suffixeStatut = statutFiltre === 'tout' ? '' : ` ${LABEL_STATUT_VIDE[statutFiltre]}`;
  const emptyTitle =
    categorieFiltre === 'tout'
      ? `Aucun animal${suffixeStatut}`
      : `Aucun ${LABEL_CATEGORIE_FILTRE[categorieFiltre]}${suffixeStatut}`;

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

      <View style={styles.filtres}>
        <View style={styles.flex1}>
          <SelectField
            label="Trier/filtre par"
            value={triActif}
            onChange={setTri}
            options={
              categorieFiltre === 'chevre'
                ? OPTIONS_TRI
                : OPTIONS_TRI.filter((o) => o.value !== 'misebas')
            }
          />
        </View>

        <View style={styles.flex1}>
          <Text style={styles.searchLabel}>Rechercher</Text>
          <TextInput
            style={styles.search}
            placeholder="Dans tous les champs…"
            placeholderTextColor={colors.textMuted}
            value={recherche}
            onChangeText={setRecherche}
          />
        </View>
      </View>

      {triActif === 'naissance' && (
        <View style={styles.filtres}>
          <View style={styles.flex1}>
            <DateField label="Date de naissance — du" value={dateNaissanceDebut} onChange={setDateNaissanceDebut} />
          </View>
          <View style={styles.flex1}>
            <DateField label="Date de naissance — au" value={dateNaissanceFin} onChange={setDateNaissanceFin} />
          </View>
        </View>
      )}

      {triActif === 'abattoir' && (
        <View style={styles.filtres}>
          <View style={styles.flex1}>
            <DateField label="Date d’abattage — du" value={dateAbattoirDebut} onChange={setDateAbattoirDebut} />
          </View>
          <View style={styles.flex1}>
            <DateField label="Date d’abattage — au" value={dateAbattoirFin} onChange={setDateAbattoirFin} />
          </View>
        </View>
      )}

      {triActif === 'morte' && (
        <View style={styles.filtres}>
          <View style={styles.flex1}>
            <FormField
              label="Année"
              value={anneeMorte}
              onChangeText={setAnneeMorte}
              keyboardType="number-pad"
              placeholder="AAAA"
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.anneeNote}>Nombre d’animaux morts sur l’exploitation cette année-là.</Text>
          </View>
        </View>
      )}

      {triActif === 'renouvellement' && (
        <View style={styles.filtres}>
          <View style={styles.flex1}>
            <FormField
              label="Année de désignation"
              value={anneeRenouv}
              onChangeText={setAnneeRenouv}
              keyboardType="number-pad"
              placeholder="AAAA"
            />
          </View>
          <View style={styles.flex1} />
        </View>
      )}

      {triActif === 'annee' && (
        <View style={styles.filtres}>
          <View style={styles.flex1}>
            <FormField
              label="Année"
              value={anneePresence}
              onChangeText={setAnneePresence}
              keyboardType="number-pad"
              placeholder="AAAA"
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.anneeNote}>
              Chèvres nées avant/pendant cette année et encore présentes (vivantes ou sorties pendant/après) —
              le filtre Statut est ignoré ici.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.resultatRow}>
        {triActif === 'naissance' && (!!dateNaissanceDebut || !!dateNaissanceFin) ? (
          <Pressable onPress={() => { setDateNaissanceDebut(''); setDateNaissanceFin(''); }}>
            <Text style={styles.effacerTexte}>Effacer la date de naissance</Text>
          </Pressable>
        ) : triActif === 'abattoir' && (!!dateAbattoirDebut || !!dateAbattoirFin) ? (
          <Pressable onPress={() => { setDateAbattoirDebut(''); setDateAbattoirFin(''); }}>
            <Text style={styles.effacerTexte}>Effacer la date d’abattage</Text>
          </Pressable>
        ) : triActif === 'morte' && !!anneeMorte ? (
          <Pressable onPress={() => setAnneeMorte('')}>
            <Text style={styles.effacerTexte}>Effacer l’année</Text>
          </Pressable>
        ) : triActif === 'renouvellement' && !!anneeRenouv ? (
          <Pressable onPress={() => setAnneeRenouv('')}>
            <Text style={styles.effacerTexte}>Effacer l’année de renouvellement</Text>
          </Pressable>
        ) : triActif === 'annee' && !!anneePresence ? (
          <Pressable onPress={() => setAnneePresence('')}>
            <Text style={styles.effacerTexte}>Effacer l’année</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Text style={styles.resultatTexte}>Résultat : {filtrees.length}</Text>
      </View>

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
            subtitle={`${item.sexe === 'F' ? 'Femelle' : 'Mâle'} · ${formatDateFR(item.dateNaissance)} - ${
              item.statut !== 'vivante' && item.dateStatut ? formatDateFR(item.dateStatut) : ''
            }${
              item.mereNumeroBoucle ? ` · Mère : ${item.mereNumeroBoucle}` : ''
            }`}
            trailing={
            (() => {
              if (item.renouvellement && afficherBadgeRenouvellement(item.dateNaissance)) {
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
    rowGap: 0,
    columnGap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  flex1: {
    flex: 1,
  },

  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },

  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    color: colors.text,
  },

  list: {
    padding: 16,
    paddingBottom: 160,
    gap: 10,
  },

  anneeNote: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  resultatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },

  resultatTexte: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },

  effacerTexte: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
