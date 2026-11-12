import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Card } from '@/shared/components/Card';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { suiviMouvements, type Effectifs, type LigneMouvement } from '@/features/cheptel/services/suiviMouvements';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { loadAllYears } from '@/shared/storage/localStore';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.cheptel.suiviMouvements.historique;

/** Le nombre d'animaux d'un total d'effectifs (jeunes, femelles et mâles). */
const nombre = (e: Effectifs): number => Object.values(e).reduce((t, n) => t + n, 0);

/** La cause d'une ligne : une sortie si elle sort des animaux, sinon une entrée (les lettres P et C servent aux deux). */
const libelleCause = (l: LigneMouvement): string => {
  const estSortie = nombre(l.sorties) > 0;
  const causes = estSortie ? T.causesSortie : T.causesEntree;
  return causes[l.cause] ?? l.cause;
};

/** Le nombre de la ligne, signé : + pour les entrées, − pour les sorties. */
const signe = (l: LigneMouvement): string =>
  [nombre(l.entrees) ? `+${nombre(l.entrees)}` : '', nombre(l.sorties) ? `−${nombre(l.sorties)}` : '']
    .filter(Boolean)
    .join(' ');

/**
 * L'historique des mouvements de l'année active (entrées, sorties, ventes), le plus récent en tête, avec une recherche par date, cause ou
 * acheteur. Il s'affiche sous les boutons de la page Mouvement.
 */
export function HistoriqueMouvements() {
  const { espece } = useEtablissement();
  const { settings } = useAppSettings();
  const annee = settings.anneeActive;
  const [lignes, setLignes] = useState<LigneMouvement[]>([]);
  const [recherche, setRecherche] = useState('');

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL), listToutesVentes()])
        .then(([tous, ventes]) => {
          const suivi = suiviMouvements(deEspeceCourante(tous), ventes, annee, {
            abattoir: TEXTES.cheptel.suiviMouvements.abattoir,
            autoConsommation: TEXTES.cheptel.suiviMouvements.autoConsommation,
          });
          setLignes(suivi.lignes);
        })
        .catch(() => undefined);
      // L'espèce et l'année changent ce qui est lu : l'historique se recharge avec elles.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [espece, annee]),
  );

  // Le plus récent en tête ; la recherche porte sur la date, la cause et le nom (acheteur, vendeur).
  const affichees = useMemo(() => {
    const motif = recherche.trim().toLowerCase();
    return [...lignes]
      .reverse()
      .filter((l) => !motif || [formatDateFR(l.date), libelleCause(l), l.nom ?? ''].join(' ').toLowerCase().includes(motif));
  }, [lignes, recherche]);

  return (
    <Card style={commonStyles.gap10}>
      <Text style={commonStyles.cardTitle}>{T.titre(annee)}</Text>
      <ChampRecherche value={recherche} onChangeText={setRecherche} placeholder={T.recherche} />
      {affichees.length === 0 ? <Text style={commonStyles.note}>{T.aucun}</Text> : null}
      {affichees.map((l) => (
        <View key={`${l.date}|${l.cause}|${l.nom ?? ''}`} style={[commonStyles.rowSpaceBetween, { alignItems: 'flex-start' }]}>
          <View style={commonStyles.flex1}>
            <Text style={commonStyles.line}>{`${formatDateFR(l.date)} · ${libelleCause(l)}`}</Text>
            {l.nom ? <Text style={[commonStyles.muted, { color: colors.textMuted }]}>{l.nom}</Text> : null}
          </View>
          <Text style={commonStyles.lineBold}>{signe(l)}</Text>
        </View>
      ))}
    </Card>
  );
}
