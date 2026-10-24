import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { joursAbattusAFacturer, type JourAbattu } from '@/features/comptabilite/utils/animauxVendus';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import type { Chevre } from '@/features/cheptel/types';
import { especeDe } from '@/features/cheptel/utils/espece';
import { poidsTotal } from '@/features/cheptel/utils/poids';
import { useInconsommables } from '@/features/lots-animaux/hooks/useInconsommables';
import { useLots } from '@/features/lots-animaux/hooks/useLots';
import { ListeDeChoix } from '@/features/production/simple/ListeDeChoix';
import { CATEGORIE_LOT } from '@/shared/constants/lots';
import { ROUTES } from '@/shared/constants/routes';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { loadAllYears } from '@/shared/storage/localStore';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.production.viande;

/**
 * « Viande à facturer » au plus simple : une tuile par jour d'abattage dont la viande n'est pas encore facturée (le jour, le nombre d'animaux, le poids). Un appui
 * ouvre la fiche du lot d'abattoir de ce jour (créée si elle manque), où l'on facture.
 */
export function ViandeSimple() {
  const router = useRouter();
  const { espece } = useEtablissement();
  const { lots, creer } = useLots();
  const inconsommables = useInconsommables();
  const [jours, setJours] = useState<JourAbattu[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL) as Promise<Chevre[]>, listToutesVentes()])
        .then(([cheptel, ventes]) =>
          setJours(
            joursAbattusAFacturer(
              cheptel.filter((a) => especeDe(a) === espece),
              ventes,
            ),
          ),
        )
        .catch(() => undefined);
    }, [espece]),
  );

  // Seuls les animaux avec boucle se facturent ici (une bête déclarée inconsommable est abattue mais ne se facture pas).
  const groupes = (jours ?? [])
    .map((j) => ({
      date: j.date,
      animaux: j.animaux.filter((a) => !!a.numeroBoucle?.trim() && !inconsommables.has(a.id)),
    }))
    .filter((g) => g.animaux.length > 0);

  const ouvrir = async (date: string) => {
    const g = groupes.find((x) => x.date === date);
    if (!g) return;
    const lot =
      lots.find((l) => l.abattoir === date) ??
      (await creer(TEXTES.cheptel.lots.abattoirDu(formatDateFR(date)), g.animaux.map((a) => a.numeroBoucle?.trim() ?? '').filter(Boolean).join(', '), {
        abattoir: date,
        categorie: CATEGORIE_LOT.ABATTOIR,
      }));
    router.push(`${ROUTES.lotDeProduction(lot.id)}&retour=${encodeURIComponent(ROUTES.PRODUCTION_VIANDE_SIMPLE)}` as never);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={styles.titre}>{TEXTES.accueil.ferme.terrain.tuiles.viandeAFacturer}</Text>
      {jours !== null && groupes.length === 0 ? <Text style={styles.detail}>{T.rienAFacturer}</Text> : null}
      <ListeDeChoix
        presentation="tuiles"
        choix={groupes.map((g) => {
          const poids = poidsTotal(g.animaux);
          return {
            cle: g.date,
            libelle: `${T.abattoirLe(formatDateFR(g.date))}\n${[T.animaux(g.animaux.length), poids ? T.poids(String(poids).replace('.', ',')) : ''].filter(Boolean).join(' · ')}`,
            icone: 'food-steak' as const,
          };
        })}
        onChoisir={(c) => ouvrir(c.cle)}
      />
      <Pressable style={styles.discret} onPress={() => router.back()} accessibilityRole="button">
        <Text style={styles.discretTexte}>{TEXTES.production.fabricationSimple.retour}</Text>
      </Pressable>
    </ScrollView>
  );
}
