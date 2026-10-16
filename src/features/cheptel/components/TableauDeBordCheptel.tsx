import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Card } from '@/shared/components/Card';
import { BarreHorizontale } from '@/shared/components/BarreHorizontale';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { listChevresVivantes } from '@/features/cheptel/repository/chevres';
import { suiviMouvements } from '@/features/cheptel/services/suiviMouvements';
import {
  mouvementsDeLAnnee,
  pyramideDesAges,
  type ClasseDAge,
  type MouvementsDeLAnnee,
} from '@/features/cheptel/services/tableauDeBord';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { loadAllYears } from '@/shared/storage/localStore';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { currentYear, todayISO } from '@/shared/utils/dates';

const T = TEXTES.cheptel.tableauDeBord;

/**
 * Le tableau de bord du cheptel, sur l'accueil : la pyramide des âges (femelles et mâles par classe d'âge) et les mouvements de
 * l'année (naissances, achats, ventes, morts), d'après le cheptel et les ventes de l'espèce courante.
 */
export function TableauDeBordCheptel({ afficherVide = false }: { afficherVide?: boolean }) {
  const { espece } = useEtablissement();
  const annee = currentYear();
  const [pyramide, setPyramide] = useState<ClasseDAge[]>([]);
  const [mouvements, setMouvements] = useState<MouvementsDeLAnnee | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([listChevresVivantes(), loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL), listToutesVentes()])
        .then(([vivants, tous, ventes]) => {
          setPyramide(pyramideDesAges(vivants, todayISO()));
          const suivi = suiviMouvements(deEspeceCourante(tous), ventes, annee, {
            abattoir: TEXTES.cheptel.suiviMouvements.abattoir,
            autoConsommation: TEXTES.cheptel.suiviMouvements.autoConsommation,
          });
          setMouvements(mouvementsDeLAnnee(suivi));
        })
        .catch(() => undefined);
      // L'espèce courante change ce qui est lu : le tableau se recharge avec elle.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [espece, annee]),
  );

  const total = pyramide.reduce((t, c) => t + c.femelles + c.males, 0);
  // Rien à montrer sans animal ni mouvement (un établissement qui commence) : le tableau n'encombre pas l'accueil.
  const mouvementsTotal = mouvements
    ? mouvements.naissances + mouvements.achats + mouvements.ventes + mouvements.morts + mouvements.autresSorties
    : 0;
  if (total === 0 && mouvementsTotal === 0) {
    return afficherVide ? (
      <Card>
        <Text style={commonStyles.mutedItalic}>{T.vide}</Text>
      </Card>
    ) : null;
  }
  const plusGrande = Math.max(1, ...pyramide.map((c) => c.femelles + c.males));

  return (
    <>
      <Card style={commonStyles.gap10}>
        <Text style={commonStyles.cardTitle}>{T.pyramide}</Text>
        {pyramide.map((c) => (
          <View key={c.cle} style={commonStyles.gap8}>
            <View style={commonStyles.rowSpaceBetween}>
              <Text style={commonStyles.line}>{T.classes[c.cle as keyof typeof T.classes]}</Text>
              <Text style={commonStyles.lineBold}>{T.repartition(c.femelles, c.males)}</Text>
            </View>
            <BarreHorizontale
              segments={[
                { part: c.femelles / plusGrande, couleur: colors.primary },
                { part: c.males / plusGrande, couleur: colors.accent },
              ]}
            />
          </View>
        ))}
        <Text style={commonStyles.note}>{T.legende}</Text>
      </Card>

      {mouvements ? (
        <Card style={commonStyles.gap8}>
          <Text style={commonStyles.cardTitle}>{T.mouvements(annee)}</Text>
          {(
            [
              ['naissances', mouvements.naissances],
              ['achats', mouvements.achats],
              ['ventes', mouvements.ventes],
              ['morts', mouvements.morts],
              ['autresSorties', mouvements.autresSorties],
            ] as const
          ).map(([cle, nombre]) => (
            <View key={cle} style={commonStyles.rowSpaceBetween}>
              <Text style={commonStyles.line}>{T.mouvementsLibelles[cle]}</Text>
              <Text style={commonStyles.lineBold}>{nombre}</Text>
            </View>
          ))}
        </Card>
      ) : null}
    </>
  );
}
