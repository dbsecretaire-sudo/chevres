import { useCallback, useMemo, useState } from 'react';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { Alert, FlatList, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { SelectModal } from '@/shared/components/SelectModal';
import { exporterBordereauxPertePdf } from '@/features/export/documents/bordereauPertePdf';
import { anneesDuSuivi } from '@/features/cheptel/services/suiviMouvements';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { loadAllYears } from '@/shared/storage/localStore';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Badge } from '@/shared/components/Badge';
import { ListRow } from '@/shared/components/ListRow';
import { LigneDeBloc } from '@/shared/components/BlocListe';
import { EmptyState } from '@/shared/components/EmptyState';
import { SelectField } from '@/shared/components/SelectField';
import { statutColors } from '@/shared/theme/colors';
import { listChevresHistorique } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { currentYear, formatDateFR } from '@/shared/utils/dates';
import { detailDeLAnimal, libelleChevre, statutLabel } from '@/features/cheptel/utils/chevreLabel';
import { styles } from '@/shared/styles/cheptel/Historique.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { TRI_HISTORIQUE } from '@/shared/constants/cheptel';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { TableauSorties } from '@/features/cheptel/components/TableauSorties';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';

type Tri = ValeurDe<typeof TRI_HISTORIQUE>;

const OPTIONS_TRI: { value: Tri; label: string }[] = [
  { value: TRI_HISTORIQUE.SORTIE, label: TEXTES.cheptel.historique.dateDeSortie },
  { value: TRI_HISTORIQUE.NAISSANCE, label: TEXTES.commun.general.dateDeNaissance },
  { value: TRI_HISTORIQUE.BOUCLE, label: TEXTES.commun.general.nDeBoucle },
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

export default function Historique() {
  const router = useRouter();
  // Le poste de comptabilité : les sorties en tableau, classées d'un clic sur un titre.
  const comptable = useDispositionComptable();
  /** L'adresse de cet écran : la fiche d'un animal ouverte d'ici y revient. */
  const retour = useAdresseCourante();
  // L'espèce active : l'écran se recharge quand elle change, sans être recréé.
  const { espece } = useEtablissement();
  const [chevres, setChevres] = useState<Chevre[]>([]);
  const [tri, setTri] = useState<Tri>(TRI_HISTORIQUE.SORTIE);
  /** Les années où l'on peut imprimer les bordereaux de perte, et la fenêtre où l'on choisit. */
  const [annees, setAnnees] = useState<number[]>([]);
  const [choixAnnee, setChoixAnnee] = useState(false);

  useFocusEffect(
    useCallback(() => {
      listChevresHistorique().then(setChevres);
      loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL).then((tous) =>
        setAnnees(anneesDuSuivi(deEspeceCourante(tous), currentYear())),
      );
      // L'espèce n'est pas lue dans le chargement : elle sert à le relancer quand elle change.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [espece]),
  );

  const triees = useMemo(() => {
    return [...chevres].sort((a, b) => {
      if (tri === TRI_HISTORIQUE.NAISSANCE) return b.dateNaissance.localeCompare(a.dateNaissance);
      if (tri === TRI_HISTORIQUE.BOUCLE) return compareBoucle(a.numeroBoucle, b.numeroBoucle);
      return (b.dateStatut ?? '').localeCompare(a.dateStatut ?? '');
    });
  }, [chevres, tri]);

  /** Imprime les bordereaux de perte de l'année choisie (« toutes » : toutes les années) ; rien à imprimer sans perte. */
  const imprimerBordereaux = async (choix: string) => {
    setChoixAnnee(false);
    const liste = choix === 'toutes' ? annees : [Number(choix)];
    try {
      if ((await exporterBordereauxPertePdf(liste)) === 0)
        Alert.alert(TEXTES.cheptel.suiviMouvements.aucunePerte);
    } catch (e: unknown) {
      Alert.alert(e instanceof Error ? e.message : TEXTES.commun.general.erreur);
    }
  };

  return (
    <Screen scroll={false}>
      <SelecteurEspece />
      {/* Les bordereaux de perte : un par jour où des animaux sont morts, d'après l'historique. */}
      <View style={commonStyles.topPadded}>
        <Button
          variant="secondary"
          label={TEXTES.cheptel.suiviMouvements.genererBordereaux}
          onPress={() => setChoixAnnee(true)}
          disabled={annees.length === 0}
        />
      </View>
      {comptable ? null : (
      <View style={styles.filtre}>
        <SelectField
          label={TEXTES.cheptel.historique.trierPar}
          value={tri}
          onChange={setTri}
          options={OPTIONS_TRI}
        />
      </View>
      )}
      <SelectModal<string>
        visible={choixAnnee}
        titre={TEXTES.cheptel.suiviMouvements.annee}
        value=""
        options={[
          { value: 'toutes', label: TEXTES.cheptel.suiviMouvements.toutesLesAnnees },
          ...[...annees].reverse().map((a) => ({ value: String(a), label: String(a) })),
        ]}
        onSelect={imprimerBordereaux}
        onClose={() => setChoixAnnee(false)}
      />
      {comptable ? (
        <TableauSorties animaux={chevres} ouvrirFiche={(id) => router.push(ROUTES.ficheChevreDepuis(id, retour))} vide={TEXTES.cheptel.historique.aucunHistorique} />
      ) : (
      <FlatList
        data={triees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <EmptyState
            title={TEXTES.cheptel.historique.aucunHistorique}
            subtitle={TEXTES.cheptel.historique.lesChevresMortesEnvoyeesA}
          />
        }
        renderItem={({ item, index }) => (
          <LigneDeBloc index={index} total={triees.length}>
            <ListRow
              title={libelleChevre(item)}
              subtitle={
                item.numeroBoucle || item.nom
                  ? TEXTES.commun.general.accordNeLeDate(
                      statutLabel(item.statut, item.sexe),
                      formatDateFR(item.dateStatut),
                    )
                  : detailDeLAnimal(item)
              }
              trailing={
                <Badge label={statutLabel(item.statut, item.sexe)} color={statutColors[item.statut]} />
              }
              onPress={() => router.push(ROUTES.ficheChevreDepuis(item.id, retour))}
            />
          </LigneDeBloc>
        )}
      />
      )}
    </Screen>
  );
}
